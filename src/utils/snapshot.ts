import {type BigDecimal} from '@subsquid/big-decimal'
import {
  type Account,
  AccountSnapshot,
  type BasePool,
  BasePoolSnapshot,
  type Delegation,
  DelegationSnapshot,
  type GlobalState,
  GlobalStateSnapshot,
  type StakePool,
  type Worker,
  WorkerSnapshot,
} from '../model'
import {join} from './common'

export const createAccountSnapshot = ({
  account,
  updatedTime,
}: {
  account: Account
  updatedTime: Date
}): AccountSnapshot => {
  const date = new Date(updatedTime)
  date.setUTCHours(0, 0, 0, 0)
  return new AccountSnapshot({
    id: join(account.id, date.toISOString()),
    account,
    delegationValue: account.vaultValue
      .plus(account.stakePoolValue)
      .round(2, 0),
    updatedTime: date,
    cumulativeStakePoolOwnerRewards:
      account.cumulativeStakePoolOwnerRewards.round(2, 0),
    cumulativeVaultOwnerRewards: account.cumulativeVaultOwnerRewards.round(
      2,
      0,
    ),
  })
}

export const createBasePoolSnapshot = ({
  basePool,
  updatedTime,
  apr,
  stakePool,
}: {
  basePool: BasePool
  updatedTime: Date
  apr: BigDecimal
  stakePool?: StakePool
}): BasePoolSnapshot => {
  return new BasePoolSnapshot({
    id: join(basePool.id, updatedTime.toISOString()),
    basePool,
    commission: basePool.commission,
    totalValue: basePool.totalValue.round(2, 0),
    sharePrice: basePool.sharePrice,
    delegatorCount: basePool.delegatorCount,
    apr,
    updatedTime,
    workerCount: stakePool?.workerCount,
    idleWorkerCount: stakePool?.idleWorkerCount,
    stakePoolCount:
      stakePool == null ? basePool.account.stakePoolNftCount : undefined,
    cumulativeOwnerRewards: basePool.cumulativeOwnerRewards.round(2, 0),
  })
}

export const createDelegationSnapshot = ({
  delegation,
  updatedTime,
}: {
  delegation: Delegation
  updatedTime: Date
}): DelegationSnapshot => {
  return new DelegationSnapshot({
    id: join(delegation.id, updatedTime.toISOString()),
    delegation,
    cost: delegation.cost.round(2, 0),
    value: delegation.value.round(2, 0),
    updatedTime,
  })
}

export const createWorkerSnapshot = ({
  worker,
  updatedTime,
}: {
  worker: Worker
  updatedTime: Date
}): WorkerSnapshot => {
  return new WorkerSnapshot({
    id: join(worker.id, updatedTime.toISOString()),
    updatedTime,
    worker,
    stakePoolId: worker.stakePool?.id,
    sessionId: worker.session?.id,
    confidenceLevel: worker.confidenceLevel,
    initialScore: worker.initialScore,
    stake: worker.session?.stake.round(2, 0),
    state: worker.session?.state,
    v: worker.session?.v.round(2, 0),
    ve: worker.session?.ve.round(2, 0),
    pInit: worker.session?.pInit,
    pInstant: worker.session?.pInstant,
    totalReward: worker.session?.totalReward.round(2, 0),
  })
}

export const createGlobalStateSnapshot = (
  globalState: GlobalState,
  updatedTime: Date,
): GlobalStateSnapshot => {
  return new GlobalStateSnapshot({
    id: updatedTime.toISOString(),
    updatedTime,
    totalValue: globalState.totalValue,
    averageBlockTime: globalState.averageBlockTime,
    averageApr: globalState.averageApr,
    cumulativeRewards: globalState.cumulativeRewards,
    budgetPerBlock: globalState.budgetPerBlock,
    workerCount: globalState.workerCount,
    idleWorkerCount: globalState.idleWorkerCount,
    budgetPerShare: globalState.budgetPerShare,
    delegatorCount: globalState.delegatorCount,
    idleWorkerShares: globalState.idleWorkerShares,
  })
}
