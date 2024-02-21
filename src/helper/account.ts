import {BigDecimal} from '@subsquid/big-decimal'
import {Account} from '../model'

export const getAccount = (m: Map<string, Account>, id: string): Account => {
  let acc = m.get(id)
  if (acc == null) {
    acc = new Account({
      id,
      stakePoolValue: BigDecimal(0),
      stakePoolNftCount: 0,
      stakePoolAvgAprMultiplier: BigDecimal(0),
      vaultValue: BigDecimal(0),
      vaultNftCount: 0,
      vaultAvgAprMultiplier: BigDecimal(0),
      cumulativeStakePoolOwnerRewards: BigDecimal(0),
      cumulativeVaultOwnerRewards: BigDecimal(0),
    })
    m.set(id, acc)
  }
  return acc
}
