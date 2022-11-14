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
  props: {pid: string; cid: number; owner: Account; poolAccountId: string}
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
    poolAccountId,
  }: {pid: string; cid: number; owner: Account; poolAccountId?: string}
): {basePool: BasePool; stakePool?: StakePool; vault?: Vault} {
  const basePool = new BasePool({
    id: pid,
    pid: BigInt(pid),
    cid,
    owner,
    kind,
    totalShares: BigDecimal(0),
    totalValue: BigDecimal(0),
    totalWithdrawalValue: BigDecimal(0),
  })

  if (kind === BasePoolKind.StakePool) {
    const stakePool = new StakePool({
      id: pid,
      basePool,
      commission: BigDecimal(0),
      freeStake: BigDecimal(0),
      releasingStake: BigDecimal(0),
      workerCount: 0,
      idleWorkerCount: 0,
      idleWorkerShares: BigDecimal(0),
      whitelistEnabled: false,
    })
    return {basePool, stakePool}
  }

  const vault = new Vault({
    id: pid,
    basePool,
    commission: BigDecimal(0),
    accountId: poolAccountId,
  })
  return {basePool, vault}
}
