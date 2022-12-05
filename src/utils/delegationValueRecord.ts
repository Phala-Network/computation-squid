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
}): DelegationValueRecord =>
  new DelegationValueRecord({
    id: join(account.id, updatedTime.getTime()),
    account,
    value,
    updatedTime,
  })
