import {BigDecimal} from '@subsquid/big-decimal'
import {BasePoolKind, Account, BasePool, StakePool, Vault} from '../model'

export function createPool(
  kind: BasePoolKind.StakePool,
  props: {pid: string; cid: number; owner: Account}
): {
  basePool: BasePool
  stakePool: StakePool
}
export function createPool(
  kind: BasePoolKind.Vault,
  props: {pid: string; cid: number; owner: Account; poolAccount: Account}
): {
  basePool: BasePool
  vault: Vault
}
export function createPool(
  kind: BasePoolKind,
  {
    pid,
    cid,
    owner,
    poolAccount,
  }: {pid: string; cid: number; owner: Account; poolAccount?: Account}
): {basePool: BasePool; stakePool?: StakePool; vault?: Vault} {
  const basePool = new BasePool({
    id: pid,
    pid: BigInt(pid),
    cid,
    owner,
    kind,
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
      workerCount: 0,
      idleWorkerCount: 0,
      idleWorkerShares: BigDecimal(0),
    })
    return {basePool, stakePool}
  }

  const vault = new Vault({
    id: pid,
    basePool,
    account: poolAccount,
    apr: BigDecimal(0),
    lastSharePriceCheckpoint: BigDecimal(1),
    claimableOwnerShares: BigDecimal(0),
  })
  return {basePool, vault}
}

export function updateSharePrice(pool: BasePool): void {
  pool.sharePrice = pool.totalValue.div(pool.totalShares)
}
