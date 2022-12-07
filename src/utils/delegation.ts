import {BigDecimal} from '@subsquid/big-decimal'
import {BasePool, Delegation} from '../model'
import {sum} from './common'

export const updateDelegationValue = (
  delegation: Delegation,
  basePool: BasePool
): void => {
  delegation.value = delegation.shares.times(basePool.sharePrice).round(12, 0)
  delegation.withdrawingValue = delegation.withdrawingShares
    .times(basePool.sharePrice)
    .round(12, 0)
}

export const getDelegationAvgAprMultiplier = (
  delegations: Delegation[]
): BigDecimal => {
  const totalValue = sum(...delegations.map((x) => x.value))
  if (totalValue.eq(0)) return BigDecimal(0)
  return delegations
    .reduce(
      (a, b) => a.plus(b.value.times(b.basePool.aprMultiplier)),
      BigDecimal(0)
    )
    .div(totalValue)
}
