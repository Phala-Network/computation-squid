import {type BigDecimal} from '@subsquid/big-decimal'
import {BasePoolSnapshot, type BasePool, type StakePool} from '../model'
import {join} from './common'

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
  // MEMO: keep only one record per hour
  const savedTime = new Date(updatedTime)
  savedTime.setMinutes(0)
  savedTime.setSeconds(0)
  savedTime.setMilliseconds(0)

  return new BasePoolSnapshot({
    id: join(basePool.id, savedTime.toISOString()),
    basePool,
    commission: basePool.commission,
    totalValue: basePool.totalValue,
    sharePrice: basePool.sharePrice.round(12, 0),
    delegatorCount: basePool.delegatorCount,
    apr: apr.round(6, 0),
    updatedTime: savedTime,
    workerCount: stakePool?.workerCount,
    idleWorkerCount: stakePool?.idleWorkerCount,
    stakePoolCount:
      stakePool == null ? basePool.account.stakePoolNftCount : undefined,
  })
}
