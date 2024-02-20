import assert from 'assert'
import {BigDecimal} from '@subsquid/big-decimal'
import {groupBy} from 'lodash'
import {
  type Account,
  type AccountSnapshot,
  type BasePool,
  BasePoolKind,
  type BasePoolSnapshot,
  type Delegation,
  type DelegationSnapshot,
  type GlobalState,
  type StakePool,
  Worker,
  type WorkerSnapshot,
} from '../model'
import {type Ctx} from '../processor'
import {
  getBasePoolAvgAprMultiplier,
  updateSharePrice,
  updateVaultAprMultiplier,
} from './basePool'
import {assertGet, max, sum, toMap} from './common'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './delegation'
import {
  createAccountSnapshot,
  createBasePoolSnapshot,
  createDelegationSnapshot,
  createGlobalStateSnapshot,
  createWorkerSnapshot,
} from './snapshot'

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000

const postUpdate = async (
  ctx: Ctx,
  globalState: GlobalState,
  accountMap: Map<string, Account>,
  basePools: BasePool[],
  stakePoolMap: Map<string, StakePool>,
  delegations: Delegation[],
): Promise<void> => {
  const latestBlock = ctx.blocks.at(-1)
  assert(latestBlock?.header.timestamp)
  const updatedTime = new Date(latestBlock.header.timestamp)
  updatedTime.setUTCMinutes(0, 0, 0)
  const shouldTakeSnapshot =
    updatedTime.getTime() !== globalState.snapshotUpdatedTime.getTime()

  const delegatorSet = new Set<string>()
  const accountSnapshots: AccountSnapshot[] = []
  const delegationSnapshots: DelegationSnapshot[] = []
  const basePoolMap = toMap(basePools)
  const delegationAccountIdMap = groupBy(delegations, (x) => x.account.id)

  if (globalState.withdrawalDustCleared !== true) {
    let clearWithdrawalDate: number | undefined
    try {
      clearWithdrawalDate = new Date(
        Bun.env.CLEAR_WITHDRAWAL_DATE as string,
      ).getTime()
    } catch (err) {
      // noop
    }
    if (
      clearWithdrawalDate != null &&
      latestBlock.header.timestamp >= clearWithdrawalDate
    ) {
      const clearWithdrawalThreshold =
        Bun.env.CLEAR_WITHDRAWAL_THRESHOLD ?? '0.01'
      for (const delegation of delegations) {
        const basePool = assertGet(basePoolMap, delegation.basePool.id)
        const prevWithdrawingShares = delegation.withdrawingShares
        if (
          prevWithdrawingShares.gt(0) &&
          prevWithdrawingShares.lte(clearWithdrawalThreshold) &&
          delegation.withdrawalStartTime != null &&
          delegation.withdrawalStartTime.getTime() < clearWithdrawalDate
        ) {
          delegation.withdrawingShares = BigDecimal(0)
          delegation.shares = delegation.shares.minus(prevWithdrawingShares)
          basePool.totalShares = basePool.totalShares.minus(
            prevWithdrawingShares,
          )
          basePool.withdrawingShares = max(
            basePool.withdrawingShares.minus(prevWithdrawingShares),
            BigDecimal(0),
          )
          updateSharePrice(basePool)
        }
      }
      globalState.withdrawalDustCleared = true
    }
  }

  const getApr = (aprMultiplier: BigDecimal): BigDecimal => {
    const {averageBlockTime, idleWorkerShares, budgetPerBlock, treasuryRatio} =
      globalState
    const value = aprMultiplier
      .times(budgetPerBlock)
      .times(BigDecimal(1).minus(treasuryRatio))
      .times(ONE_YEAR)
      .div(averageBlockTime)
      .div(idleWorkerShares)
      .round(6, 0)

    return value
  }

  globalState.delegatorCount = 0
  for (const basePool of basePools) {
    basePool.delegatorCount = 0
  }

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.StakePool) {
      const basePool = assertGet(basePoolMap, delegation.basePool.id)

      updateDelegationValue(delegation, basePool)
      if (delegation.shares.gt(0)) {
        basePool.delegatorCount++
      }
    }
  }

  for (const [, account] of accountMap) {
    const accountDelegations = delegationAccountIdMap[account.id]
    if (accountDelegations === undefined) continue
    const accountStakePoolDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.StakePool,
    )
    account.stakePoolNftCount = accountStakePoolDelegations.filter((x) =>
      x.shares.gt(0),
    ).length
    account.stakePoolValue = sum(
      ...accountStakePoolDelegations.map((x) => x.value),
    )
    account.stakePoolAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountStakePoolDelegations,
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
          ...delegations.map((x) => x.withdrawingValue),
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

    if (delegation.value.gt(0) && !basePoolMap.has(delegation.account.id)) {
      delegatorSet.add(delegation.account.id)
    }

    if (shouldTakeSnapshot && delegation.shares.gt(0)) {
      delegationSnapshots.push(
        createDelegationSnapshot({delegation, updatedTime}),
      )
    }
  }

  for (const [, account] of accountMap) {
    const accountDelegations = delegationAccountIdMap[account.id]
    if (accountDelegations === undefined) continue
    const accountVaultDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.Vault,
    )
    account.vaultValue = sum(...accountVaultDelegations.map((x) => x.value))
    account.vaultNftCount = accountVaultDelegations.filter((x) =>
      x.shares.gt(0),
    ).length

    if (shouldTakeSnapshot) {
      accountSnapshots.push(createAccountSnapshot({account, updatedTime}))
    }

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations,
    )
  }

  globalState.averageAprMultiplier = getBasePoolAvgAprMultiplier(basePools)
  globalState.budgetPerShare = globalState.budgetPerBlock
    .div(globalState.idleWorkerShares)
    .div(globalState.averageBlockTime)
    .times(1e7 * 24 * 60 * 60)
    .round(12, 0)
  globalState.averageApr = getApr(globalState.averageAprMultiplier)
  globalState.delegatorCount = delegatorSet.size
  if (shouldTakeSnapshot) {
    globalState.snapshotUpdatedTime = updatedTime
  }

  if (shouldTakeSnapshot) {
    const workerSnapshots: WorkerSnapshot[] = []
    const basePoolSnapshots: BasePoolSnapshot[] = []

    // Take worker snapshot at 00:00 UTC
    if (updatedTime.getUTCHours() === 0) {
      const workers = await ctx.store.find(Worker, {
        relations: {
          stakePool: true,
          session: true,
        },
      })
      for (const worker of workers) {
        workerSnapshots.push(createWorkerSnapshot({worker, updatedTime}))
      }
    }

    for (const basePool of basePools) {
      basePoolSnapshots.push(
        createBasePoolSnapshot({
          basePool,
          updatedTime,
          apr: getApr(basePool.aprMultiplier),
          stakePool: stakePoolMap.get(basePool.id),
        }),
      )
    }

    const globalStateSnapshot = createGlobalStateSnapshot(
      globalState,
      updatedTime,
    )

    await ctx.store.save(workerSnapshots)
    await ctx.store.save(basePoolSnapshots)
    await ctx.store.save(globalStateSnapshot)
    await ctx.store.save(accountSnapshots)
    await ctx.store.save(delegationSnapshots)
  }
}

export default postUpdate
