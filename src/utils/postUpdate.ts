import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {groupBy} from 'lodash'
import {
  Account,
  BasePool,
  BasePoolKind,
  Delegation,
  GlobalRewardsSnapshot,
  GlobalState,
  StakePool,
  Worker,
  type AccountSnapshot,
  type BasePoolSnapshot,
  type DelegationSnapshot,
  type WorkerSnapshot,
} from '../model'
import {type Ctx} from '../processor'
import {createAccountSnapshot} from './accountSnapshot'
import {updateSharePrice, updateVaultAprMultiplier} from './basePool'
import {createBasePoolSnapshot} from './basePoolSnapshot'
import {assertGet, sum, toMap} from './common'
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

  const accountSnapshots: AccountSnapshot[] = []
  const delegationSnapshots: DelegationSnapshot[] = []

  const getApr = async (basePool: BasePool): Promise<BigDecimal> => {
    const {averageBlockTime, idleWorkerShares, budgetPerBlock, treasuryRatio} =
      globalState
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
      if (delegation.shares.gt(0)) {
        basePool.delegatorCount++
      }
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
  }

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.Vault) {
      const basePool = assertGet(basePoolMap, delegation.basePool.id)

      updateDelegationValue(delegation, basePool)
      if (delegation.shares.gt(0)) {
        basePool.delegatorCount++
      }
    }

    if (shouldRecord && delegation.shares.gt(0)) {
      delegationSnapshots.push(
        createDelegationSnapshot({delegation, updatedTime})
      )
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
      accountSnapshots.push(createAccountSnapshot({account, updatedTime}))
    }

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations
    )
  }

  await ctx.store.save([...delegationMap.values()])
  await ctx.store.save([...accountMap.values()])
  await ctx.store.save(basePools)
  await ctx.store.save(accountSnapshots)
  await ctx.store.save(delegationSnapshots)

  if (shouldRecord) {
    const workerSnapshots: WorkerSnapshot[] = []
    const basePoolSnapshots: BasePoolSnapshot[] = []

    const workers = await ctx.store.find(Worker, {
      relations: {
        stakePool: true,
        session: true,
      },
    })

    for (const worker of workers) {
      workerSnapshots.push(createWorkerSnapshot({worker, updatedTime}))
    }

    for (const basePool of basePools) {
      basePoolSnapshots.push(
        createBasePoolSnapshot({
          basePool,
          updatedTime,
          apr: await getApr(basePool),
          stakePool: stakePoolMap.get(basePool.id),
        })
      )
    }

    const globalRewardsSnapshot = new GlobalRewardsSnapshot({
      id: updatedTime.toISOString(),
      updatedTime,
      value: globalState.cumulativeRewards,
    })

    await ctx.store.save(workerSnapshots)
    await ctx.store.save(basePoolSnapshots)
    await ctx.store.save(globalRewardsSnapshot)
  }
}

export default postUpdate
