import {BigDecimal} from '@subsquid/big-decimal'
import {Account, DelegationValueRecord} from '../model'
import {join} from './common'

export const createDelegationValueRecord = ({
  account,
  value,
  updatedTime,
}: {
  account: Account
  value: BigDecimal
  updatedTime: Date
}): DelegationValueRecord => {
  const dateString = updatedTime.toISOString().slice(0, 10)
  return new DelegationValueRecord({
    id: join(account.id, dateString),
    account,
    value: value.round(2, 0),
    updatedTime: new Date(`${dateString}T00:00:00.000Z`),
  })
}
