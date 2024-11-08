import assert from 'node:assert'
import {BigDecimal} from '@subsquid/big-decimal'
import {isBefore} from 'date-fns'
import {group} from 'radash'
import {CLEAR_WITHDRAWAL_DATE, CLEAR_WITHDRAWAL_THRESHOLD} from '../constants'
import {
  type Account,
  type BasePool,
  BasePoolKind,
  type Delegation,
  type GlobalState,
} from '../model'
import type {SubstrateBlock} from '../processor'
import {assertGet, sum} from '../utils'
import {
  getApr,
  getBasePoolAvgAprMultiplier,
  updateSharePrice,
  updateVaultAprMultiplier,
} from './basePool'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './delegation'
import {updateAverageBlockTime} from './globalState'

const postUpdate = (
  block: SubstrateBlock,
  globalState: GlobalState,
  accountMap: Map<string, Account>,
  basePoolMap: Map<string, BasePool>,
  delegations: Delegation[],
): void => {
  globalState.height = block.height
  updateAverageBlockTime(block, globalState)
  const timestamp = block.timestamp
  assert(timestamp)
  const blockDate = new Date(timestamp)

  const delegatorSet = new Set<string>()
  const delegationAccountIdMap = group(delegations, (x) => x.account.id)

  if (!globalState.withdrawalDustCleared) {
    if (
      CLEAR_WITHDRAWAL_DATE != null &&
      !isBefore(blockDate, CLEAR_WITHDRAWAL_DATE)
    ) {
      for (const delegation of delegations) {
        const basePool = assertGet(basePoolMap, delegation.basePool.id)
        const prevWithdrawingShares = delegation.withdrawingShares
        if (
          prevWithdrawingShares.gt(0) &&
          prevWithdrawingShares.lte(CLEAR_WITHDRAWAL_THRESHOLD) &&
          delegation.withdrawalStartTime != null &&
          isBefore(delegation.withdrawalStartTime, CLEAR_WITHDRAWAL_DATE)
        ) {
          delegation.withdrawingShares = BigDecimal(0)
          delegation.shares = delegation.shares.minus(prevWithdrawingShares)
          basePool.totalShares = basePool.totalShares.minus(
            prevWithdrawingShares,
          )
          basePool.withdrawingShares = basePool.withdrawingShares.minus(
            prevWithdrawingShares,
          )
          updateSharePrice(basePool)
        }
      }
      globalState.withdrawalDustCleared = true
    }
  }

  globalState.delegatorCount = 0
  for (const basePool of basePoolMap.values()) {
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

  for (const account of accountMap.values()) {
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

  for (const basePool of basePoolMap.values()) {
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
  }

  for (const account of accountMap.values()) {
    const accountDelegations = delegationAccountIdMap[account.id]
    if (accountDelegations === undefined) continue
    const accountVaultDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.Vault,
    )
    account.vaultValue = sum(...accountVaultDelegations.map((x) => x.value))
    account.vaultNftCount = accountVaultDelegations.filter((x) =>
      x.shares.gt(0),
    ).length
    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations,
    )
  }

  globalState.averageAprMultiplier = getBasePoolAvgAprMultiplier(basePoolMap)
  globalState.budgetPerShare = globalState.idleWorkerShares.eq(0)
    ? BigDecimal(0)
    : globalState.budgetPerBlock
        .div(globalState.idleWorkerShares)
        .div(globalState.averageBlockTime)
        .times(1e7 * 24 * 60 * 60)
        .round(12)
  globalState.delegatorCount = delegatorSet.size
  globalState.averageApr = getApr(globalState, globalState.averageAprMultiplier)
}

export default postUpdate
