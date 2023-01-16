import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {groupBy} from 'lodash'
import {In} from 'typeorm'
import {
  Account,
  BasePool,
  BasePoolKind,
  Delegation,
  DelegationSnapshot,
  GlobalState,
  StakePool,
  Worker,
  type AccountValueSnapshot,
  type BasePoolSnapshot,
  type WorkerSnapshot,
} from '../model'
import {type Ctx} from '../processor'
import {PhalaComputationTokenomicParametersStorage} from '../types/storage'
import {createAccountValueSnapshot} from './accountValueSnapshot'
import {updateSharePrice, updateVaultAprMultiplier} from './basePool'
import {createBasePoolSnapshot} from './basePoolSnapshot'
import {assertGet, sum, toMap} from './common'
import {fromBits} from './converter'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './delegation'
import {createDelegationSnapshot} from './delegationSnapshot'
import {createWorkerSnapshot} from './workerSnapshot'

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000
let lastRecordBlockHeight: number

const postUpdate = async (ctx: Ctx): Promise<void> => {
  const latestBlock = ctx.blocks.at(-1)
  assert(latestBlock)
  const shouldRecord =
    lastRecordBlockHeight === undefined ||
    latestBlock.header.height - lastRecordBlockHeight > 50
  if (shouldRecord) {
    lastRecordBlockHeight = latestBlock.header.height
  }
  const updatedTime = new Date(latestBlock.header.timestamp)
  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})
  let tokenomicParameters: {
    phaRate: BigDecimal
    budgetPerBlock: BigDecimal
    vMax: BigDecimal
    treasuryRatio: BigDecimal
    re: BigDecimal
    k: BigDecimal
  }

  const accountValueSnapshots: AccountValueSnapshot[] = []
  const delegationSnapshots: DelegationSnapshot[] = []
  const emptyDelegations: Delegation[] = []
  const basePoolSnapshots: BasePoolSnapshot[] = []

  const getApr = async (basePool: BasePool): Promise<BigDecimal> => {
    if (tokenomicParameters === undefined) {
      tokenomicParameters =
        await new PhalaComputationTokenomicParametersStorage(
          ctx,
          latestBlock.header
        ).asV1199
          .get()
          .then((value) => {
            assert(value)
            return {
              phaRate: fromBits(value.phaRate),
              budgetPerBlock: fromBits(value.budgetPerBlock),
              vMax: fromBits(value.vMax),
              treasuryRatio: fromBits(value.treasuryRatio),
              re: fromBits(value.re),
              k: fromBits(value.k),
            }
          })
    }
    const {budgetPerBlock, treasuryRatio} = tokenomicParameters
    const {averageBlockTime, idleWorkerShares} = globalState
    const value = basePool.aprMultiplier
      .times(budgetPerBlock)
      .times(BigDecimal(1).minus(treasuryRatio))
      .times(ONE_YEAR)
      .div(averageBlockTime)
      .div(idleWorkerShares)

    return value
  }

  const basePools = await ctx.store.find(BasePool, {
    relations: {owner: true, account: true},
  })
  const stakePoolMap = toMap(await ctx.store.find(StakePool))
  const basePoolMap = toMap(basePools)
  for (const basePool of basePools) {
    basePool.delegatorCount = 0
  }
  const delegations = await ctx.store.find(Delegation, {
    relations: {
      account: true,
      basePool: true,
      delegationNft: true,
      withdrawalNft: true,
    },
  })
  const delegationMap = toMap(delegations)
  const delegationAccountIdMap = groupBy(delegations, (x) => x.account.id)

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.StakePool) {
      const basePool = assertGet(basePoolMap, delegation.basePool.id)

      updateDelegationValue(delegation, basePool)
      basePool.delegatorCount++
    }
  }

  const accountMap = await ctx.store.find(Account).then(toMap)

  for (const [, account] of accountMap) {
    const accountDelegations = delegationAccountIdMap[account.id]
    if (accountDelegations === undefined) continue
    const accountStakePoolDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.StakePool
    )
    account.stakePoolNftCount = accountStakePoolDelegations.filter((x) =>
      x.shares.gt(0)
    ).length
    account.stakePoolValue = sum(
      ...accountStakePoolDelegations.map((x) => x.value)
    )
    account.stakePoolAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountStakePoolDelegations
    )
  }

  for (const [, basePool] of basePoolMap) {
    const account = assertGet(accountMap, basePool.account.id)
    if (basePool.kind === BasePoolKind.Vault) {
      basePool.totalValue = basePool.freeValue.plus(account.stakePoolValue)
      updateSharePrice(basePool)
      updateVaultAprMultiplier(basePool, account)
      const delegations = delegationAccountIdMap[account.id]
      if (delegations !== undefined) {
        basePool.releasingValue = sum(
          ...delegations.map((x) => x.withdrawingValue)
        )
      }
    }
    if (shouldRecord) {
      basePoolSnapshots.push(
        createBasePoolSnapshot({
          basePool,
          updatedTime,
          apr: await getApr(basePool),
          stakePool: stakePoolMap.get(basePool.id),
        })
      )
    }
  }

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.Vault) {
      const basePool = assertGet(basePoolMap, delegation.basePool.id)

      updateDelegationValue(delegation, basePool)
      basePool.delegatorCount++
    }

    if (shouldRecord) {
      if (delegation.shares.eq(0)) {
        emptyDelegations.push(delegation)
        delegationMap.delete(delegation.id)
      } else {
        delegationSnapshots.push(
          createDelegationSnapshot({delegation, updatedTime})
        )
      }
    }
  }

  for (const [, account] of accountMap) {
    const accountDelegations = delegationAccountIdMap[account.id]
    if (accountDelegations === undefined) continue
    const accountVaultDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.Vault
    )
    account.vaultValue = sum(...accountVaultDelegations.map((x) => x.value))
    account.vaultNftCount = accountVaultDelegations.filter((x) =>
      x.shares.gt(0)
    ).length

    if (shouldRecord) {
      accountValueSnapshots.push(
        createAccountValueSnapshot({
          account,
          value: account.vaultValue.plus(account.stakePoolValue),
          updatedTime,
        })
      )
    }

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations
    )
  }

  await ctx.store.save([...delegationMap.values()])
  const deprecatedDelegationSnapshots = await ctx.store.find(
    DelegationSnapshot,
    {where: {delegation: {id: In(emptyDelegations.map((d) => d.id))}}}
  )
  await ctx.store.remove(deprecatedDelegationSnapshots)
  await ctx.store.remove(emptyDelegations)

  await ctx.store.save([...accountMap.values()])
  await ctx.store.save(basePools)
  await ctx.store.save(accountValueSnapshots)
  await ctx.store.save(basePoolSnapshots)
  await ctx.store.save(delegationSnapshots)

  if (shouldRecord) {
    const workers = await ctx.store.find(Worker, {
      relations: {
        stakePool: true,
        session: true,
      },
    })
    const workerSnapshots: WorkerSnapshot[] = []

    for (const worker of workers) {
      workerSnapshots.push(createWorkerSnapshot({worker, updatedTime}))
    }

    await ctx.store.save(workerSnapshots)
  }
}

export default postUpdate
