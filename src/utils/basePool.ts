import {BigDecimal} from '@subsquid/big-decimal'
import {BasePoolKind, Account, BasePool, StakePool, Vault} from '../model'
import {max} from './common'

export function createPool(
  kind: BasePoolKind.StakePool,
  props: {pid: string; cid: number; ownerAccount: Account; poolAccount: Account}
): {
  basePool: BasePool
  stakePool: StakePool
}
export function createPool(
  kind: BasePoolKind.Vault,
  props: {pid: string; cid: number; ownerAccount: Account; poolAccount: Account}
): {
  basePool: BasePool
  vault: Vault
}
export function createPool(
  kind: BasePoolKind,
  {
    pid,
    cid,
    ownerAccount,
    poolAccount,
  }: {pid: string; cid: number; ownerAccount: Account; poolAccount: Account}
): {basePool: BasePool; stakePool?: StakePool; vault?: Vault} {
  const basePool = new BasePool({
    id: pid,
    pid: BigInt(pid),
    cid,
    owner: ownerAccount,
    account: poolAccount,
    kind,
    aprMultiplier: BigDecimal(0),
    commission: BigDecimal(0),
    totalShares: BigDecimal(0),
    totalValue: BigDecimal(0),
    sharePrice: BigDecimal(1),
    freeValue: BigDecimal(0),
    releasingValue: BigDecimal(0),
    withdrawalShares: BigDecimal(0),
    withdrawalValue: BigDecimal(0),
    delegatorCount: 0,
    whitelistEnabled: false,
  })

  if (kind === BasePoolKind.StakePool) {
    const stakePool = new StakePool({
      id: pid,
      basePool,
      ownerReward: BigDecimal(0),
      workerCount: 0,
      idleWorkerCount: 0,
      idleWorkerShares: BigDecimal(0),
    })
    return {basePool, stakePool}
  }

  const vault = new Vault({
    id: pid,
    basePool,
    lastSharePriceCheckpoint: BigDecimal(1),
    claimableOwnerShares: BigDecimal(0),
  })
  return {basePool, vault}
}

export function updateSharePrice(basePool: BasePool): void {
  const sharePrice = basePool.totalShares.eq(0)
    ? BigDecimal(1)
    : basePool.totalValue.div(basePool.totalShares)
  basePool.sharePrice = sharePrice
  basePool.withdrawalValue = basePool.withdrawalShares.times(sharePrice)
}

export function updateStakePoolAprMultiplier(
  basePool: BasePool,
  stakePool: StakePool
): void {
  basePool.aprMultiplier = basePool.totalValue.eq(0)
    ? BigDecimal(0)
    : stakePool.idleWorkerShares
        .times(BigDecimal(1).minus(basePool.commission))
        .div(basePool.totalValue)
}

export const updateStakePoolDelegable = (
  basePool: BasePool,
  stakePool: StakePool
): void => {
  if (stakePool.capacity != null) {
    stakePool.delegable = max(
      stakePool.capacity
        .minus(basePool.totalValue)
        .plus(basePool.withdrawalValue),
      BigDecimal(0)
    )
  } else {
    stakePool.delegable = null
  }
}
