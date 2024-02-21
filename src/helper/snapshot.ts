import assert from 'assert'
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
  type Session,
  type StakePool,
  type Worker,
  WorkerSnapshot,
} from '../model'
import type {Ctx, SubstrateBlock} from '../processor'
import {assertGet, join} from '../utils'
import {getApr} from './basePool'

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
    account: account.id,
    delegationValue: account.vaultValue.plus(account.stakePoolValue),
    updatedTime: date,
    cumulativeStakePoolOwnerRewards: account.cumulativeStakePoolOwnerRewards,
    cumulativeVaultOwnerRewards: account.cumulativeVaultOwnerRewards,
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
    basePool: basePool.id,
    commission: basePool.commission,
    totalShares: basePool.totalShares,
    totalValue: basePool.totalValue,
    sharePrice: basePool.sharePrice,
    delegatorCount: basePool.delegatorCount,
    apr,
    updatedTime,
    workerCount: stakePool?.workerCount,
    idleWorkerCount: stakePool?.idleWorkerCount,
    stakePoolCount:
      stakePool == null ? basePool.account.stakePoolNftCount : undefined,
    cumulativeOwnerRewards: basePool.cumulativeOwnerRewards,
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
    delegation: delegation.id,
    cost: delegation.cost,
    value: delegation.value,
    updatedTime,
  })
}

export const createWorkerSnapshot = ({
  worker,
  session,
  updatedTime,
}: {
  worker: Worker
  session: Session
  updatedTime: Date
}): WorkerSnapshot => {
  assert(session.worker)
  assert(worker.stakePool)
  return new WorkerSnapshot({
    id: join(session.id, updatedTime.toISOString()),
    updatedTime,
    worker: worker.id,
    session: session.id,
    stakePool: worker.stakePool.id,
    confidenceLevel: worker.confidenceLevel,
    initialScore: worker.initialScore,
    stake: session.stake,
    state: session.state,
    v: session.v,
    ve: session.ve,
    pInit: session.pInit,
    pInstant: session.pInstant,
    totalReward: session.totalReward,
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

const getUpdatedTime = (block: SubstrateBlock): Date => {
  const timestamp = block.timestamp
  assert(timestamp)
  const updatedTime = new Date(timestamp)
  updatedTime.setUTCHours(0, 0, 0, 0)
  return updatedTime
}

export const isSnapshotUpdateNeeded = (
  block: SubstrateBlock,
  globalState: GlobalState,
): boolean => {
  const updatedTime = getUpdatedTime(block)
  return updatedTime.getTime() !== globalState.snapshotUpdatedTime.getTime()
}

export const takeSnapshot = async (
  ctx: Ctx,
  block: SubstrateBlock,
  globalState: GlobalState,
  accountMap: Map<string, Account>,
  basePoolMap: Map<string, BasePool>,
  stakePoolMap: Map<string, StakePool>,
  workerMap: Map<string, Worker>,
  sessionMap: Map<string, Session>,
  delegations: Delegation[],
) => {
  const updatedTime = getUpdatedTime(block)
  globalState.snapshotUpdatedTime = updatedTime
  const accountSnapshots: AccountSnapshot[] = []
  const delegationSnapshots: DelegationSnapshot[] = []
  const workerSnapshots: WorkerSnapshot[] = []
  const basePoolSnapshots: BasePoolSnapshot[] = []

  if (updatedTime.getUTCHours() === 0) {
    for (const session of sessionMap.values()) {
      if (session.worker != null) {
        const worker = assertGet(workerMap, session.worker.id)
        workerSnapshots.push(
          createWorkerSnapshot({worker, session, updatedTime}),
        )
      }
    }
  }

  for (const account of accountMap.values()) {
    accountSnapshots.push(createAccountSnapshot({account, updatedTime}))
  }

  for (const delegation of delegations) {
    if (delegation.shares.gt(0)) {
      delegationSnapshots.push(
        createDelegationSnapshot({delegation, updatedTime}),
      )
    }
  }

  for (const basePool of basePoolMap.values()) {
    basePoolSnapshots.push(
      createBasePoolSnapshot({
        basePool,
        updatedTime,
        apr: getApr(globalState, basePool.aprMultiplier),
        stakePool: stakePoolMap.get(basePool.id),
      }),
    )
  }

  const globalStateSnapshot = createGlobalStateSnapshot(
    globalState,
    updatedTime,
  )

  ctx.log.info(`Saving snapshots ${updatedTime.toISOString()}`)
  await ctx.store.save(workerSnapshots)
  await ctx.store.save(basePoolSnapshots)
  await ctx.store.save(globalStateSnapshot)
  await ctx.store.save(accountSnapshots)
  await ctx.store.save(delegationSnapshots)
}