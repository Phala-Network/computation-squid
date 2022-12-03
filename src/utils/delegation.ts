import {BasePool, Delegation} from '../model'

export const updateDelegationValue = (
  delegation: Delegation,
  basePool: BasePool
): void => {
  delegation.value = delegation.shares.times(basePool.sharePrice).round(12, 0)
  delegation.withdrawalValue = delegation.withdrawalShares
    .times(basePool.sharePrice)
    .round(12, 0)
}
