import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {groupBy} from 'lodash'
import {
  Account,
  BasePool,
  BasePoolAprRecord,
  BasePoolKind,
  Delegation,
  DelegationValueRecord,
  GlobalState,
} from '../model'
import {Ctx} from '../processor'
import {PhalaComputationTokenomicParametersStorage} from '../types/storage'
import {updateSharePrice, updateVaultAprMultiplier} from './basePool'
import {createBasePoolAprRecord} from './basePoolAprRecord'
import {assertGet, sum, toMap} from './common'
import {fromBits} from './converter'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './delegation'
import {createDelegationValueRecord} from './delegationValueRecord'

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000

const postUpdate = async (ctx: Ctx): Promise<void> => {
  const lastBlock = ctx.blocks.at(-1)
  assert(lastBlock)
  const updatedTime = new Date(lastBlock.header.timestamp)
  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})
  const tokenomicParameters =
    await new PhalaComputationTokenomicParametersStorage(
      ctx,
      lastBlock.header
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

  const delegationValueRecords: DelegationValueRecord[] = []
  const basePoolAprRecords: BasePoolAprRecord[] = []

  const getApr = (basePool: BasePool): BasePoolAprRecord => {
    const {budgetPerBlock, treasuryRatio} = tokenomicParameters
    const {averageBlockTime, idleWorkerShares} = globalState
    const value = basePool.aprMultiplier
      .times(budgetPerBlock)
      .times(BigDecimal(1).minus(treasuryRatio))
      .times(ONE_YEAR)
      .div(averageBlockTime)
      .div(idleWorkerShares)

    return createBasePoolAprRecord({
      basePool,
      value,
      updatedTime,
    })
  }

  const basePools = await ctx.store.find(BasePool, {
    relations: {owner: true, account: true},
  })
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
  const delegationMap = groupBy(delegations, (x) => x.account.id)
  const emptyDelegation: Delegation[] = []

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.StakePool) {
      const basePool = assertGet(basePoolMap, delegation.basePool.id)

      if (delegation.shares.eq(0)) {
        emptyDelegation.push(delegation)
      } else {
        updateDelegationValue(delegation, basePool)
        basePool.delegatorCount++
      }
    }
  }

  const accountMap = await ctx.store.find(Account).then(toMap)

  for (const [, account] of accountMap) {
    const accountDelegations = delegationMap[account.id]
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
      const delegations = delegationMap[account.id]
      if (delegations !== undefined) {
        basePool.releasingValue = sum(
          ...delegations.map((x) => x.withdrawingValue)
        )
      }
    }
    basePoolAprRecords.push(getApr(basePool))
  }

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.Vault) {
      const basePool = assertGet(basePoolMap, delegation.basePool.id)

      if (delegation.shares.eq(0)) {
        emptyDelegation.push(delegation)
      } else {
        updateDelegationValue(delegation, basePool)
        basePool.delegatorCount++
      }
    }
  }

  for (const [, account] of accountMap) {
    const accountDelegations = delegationMap[account.id]
    if (accountDelegations === undefined) continue
    const accountVaultDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.Vault
    )
    account.vaultValue = sum(...accountVaultDelegations.map((x) => x.value))
    account.vaultNftCount = accountVaultDelegations.filter((x) =>
      x.shares.gt(0)
    ).length

    delegationValueRecords.push(
      createDelegationValueRecord({
        account,
        value: account.vaultValue.plus(account.stakePoolValue),
        updatedTime,
      })
    )

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations
    )
  }

  await ctx.store.save(delegations)
  await ctx.store.remove(emptyDelegation)
  await ctx.store.save([...accountMap.values()])
  await ctx.store.save(basePools)
  await ctx.store.save(delegationValueRecords)
  await ctx.store.save(basePoolAprRecords)
}

export default postUpdate
