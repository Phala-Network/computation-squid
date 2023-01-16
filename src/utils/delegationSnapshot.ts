import {DelegationSnapshot, type Delegation} from '../model'
import {join} from './common'

export const createDelegationSnapshot = ({
  delegation,
  updatedTime,
}: {
  delegation: Delegation
  updatedTime: Date
}): DelegationSnapshot => {
  // MEMO: keep only one record per hour
  const savedTime = new Date(updatedTime)
  savedTime.setMinutes(0)
  savedTime.setSeconds(0)
  savedTime.setMilliseconds(0)

  return new DelegationSnapshot({
    id: join(delegation.id, savedTime.toISOString()),
    delegation,
    cost: delegation.cost.round(4, 0),
    value: delegation.value.round(4, 0),
    updatedTime: savedTime,
  })
}
