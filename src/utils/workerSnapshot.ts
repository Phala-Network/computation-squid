import {WorkerSnapshot, type Worker} from '../model'
import {join} from './common'

export const createWorkerSnapshot = ({
  worker,
  updatedTime,
}: {
  worker: Worker
  updatedTime: Date
}): WorkerSnapshot => {
  // MEMO: keep only one record per hour
  const savedTime = new Date(updatedTime)
  savedTime.setMinutes(0)
  savedTime.setSeconds(0)
  savedTime.setMilliseconds(0)

  return new WorkerSnapshot({
    id: join(worker.id, savedTime.toISOString()),
    updatedTime: savedTime,
    worker,
    stakePoolId: worker.stakePool?.id,
    sessionId: worker.session?.id,
    confidenceLevel: worker.confidenceLevel,
    initialScore: worker.initialScore,
    stake: worker.session?.stake,
    state: worker.session?.state,
    v: worker.session?.v,
    ve: worker.session?.ve,
    pInit: worker.session?.pInit,
    pInstant: worker.session?.pInstant,
    totalReward: worker.session?.totalReward,
  })
}
