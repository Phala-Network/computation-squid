import {type BigDecimal} from '@subsquid/big-decimal'
import {AccountValueSnapshot, type Account} from '../model'
import {join} from './common'

export const createAccountValueSnapshot = ({
  account,
  value,
  updatedTime,
}: {
  account: Account
  value: BigDecimal
  updatedTime: Date
}): AccountValueSnapshot => {
  const dateString = updatedTime.toISOString().slice(0, 10)
  return new AccountValueSnapshot({
    id: join(account.id, dateString),
    account,
    value: value.round(2, 0),
    updatedTime: new Date(`${dateString}T00:00:00.000Z`),
  })
}
