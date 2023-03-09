import {AccountSnapshot, type Account} from '../model'
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
      0
    ),
  })
}
