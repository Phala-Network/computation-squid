import {BigDecimal} from '@subsquid/big-decimal'
import {
  type Account,
  BasePool,
  BasePoolKind,
  GlobalState,
  StakePool,
  Vault,
} from '../model'

export function createPool(
  kind: BasePoolKind.StakePool,
  props: {
    pid: string
    cid: number
    ownerAccount: Account
    poolAccount: Account
  },
): {
  basePool: BasePool
  stakePool: StakePool
}
export function createPool(
  kind: BasePoolKind.Vault,
  props: {
    pid: string
    cid: number
    ownerAccount: Account
    poolAccount: Account
  },
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
  }: {pid: string; cid: number; ownerAccount: Account; poolAccount: Account},
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
    withdrawingShares: BigDecimal(0),
    withdrawingValue: BigDecimal(0),
    delegatorCount: 0,
    whitelistEnabled: false,
    cumulativeOwnerRewards: BigDecimal(0),
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
  if (basePool.totalShares.eq(0)) {
    basePool.sharePrice = BigDecimal(1)
    basePool.totalValue = BigDecimal(0)
  } else {
    basePool.sharePrice = basePool.totalValue.div(basePool.totalShares)
  }
  basePool.withdrawingValue = basePool.withdrawingShares.times(
    basePool.sharePrice,
  )
}

export function updateStakePoolAprMultiplier(
  basePool: BasePool,
  stakePool: StakePool,
): void {
  basePool.aprMultiplier = basePool.totalValue.eq(0)
    ? BigDecimal(0)
    : stakePool.idleWorkerShares
        .times(BigDecimal(1).minus(basePool.commission))
        .div(basePool.totalValue)
        .round(6)
}

export const updateVaultAprMultiplier = (
  basePool: BasePool,
  account: Account,
): void => {
  if (basePool.totalValue.eq(0)) {
    basePool.aprMultiplier = BigDecimal(0)
  } else {
    basePool.aprMultiplier = account.stakePoolAvgAprMultiplier
      .times(account.stakePoolValue)
      .div(basePool.totalValue)
      .times(BigDecimal(1).minus(basePool.commission))
      .round(6)
  }
}

export const updateStakePoolDelegable = (
  basePool: BasePool,
  stakePool: StakePool,
): void => {
  if (stakePool.capacity != null) {
    stakePool.delegable = basePool.totalValue.gt(stakePool.capacity)
      ? BigDecimal(0)
      : stakePool.capacity
          .minus(basePool.totalValue)
          .plus(basePool.withdrawingValue)
  } else {
    stakePool.delegable = null
  }
}

export const getBasePoolAvgAprMultiplier = (
  basePoolMap: Map<string, BasePool>,
): BigDecimal => {
  let weight = BigDecimal(0)
  let totalValue = BigDecimal(0)
  for (const basePool of basePoolMap.values()) {
    if (basePool.kind === BasePoolKind.StakePool) {
      totalValue = totalValue.plus(basePool.totalValue)
      weight = weight.plus(basePool.totalValue.times(basePool.aprMultiplier))
    }
  }
  if (totalValue.eq(0)) {
    return BigDecimal(0)
  }

  return weight.div(totalValue).round(6)
}

export const getApr = (
  globalState: GlobalState,
  aprMultiplier: BigDecimal,
): BigDecimal => {
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000
  const {averageBlockTime, idleWorkerShares, budgetPerBlock, treasuryRatio} =
    globalState
  const value = aprMultiplier
    .times(budgetPerBlock)
    .times(BigDecimal(1).minus(treasuryRatio))
    .times(ONE_YEAR)
    .div(averageBlockTime)
    .div(idleWorkerShares)
    .round(6)

  return value
}

// export const updateFreeValue = (
//   basePool: BasePool,
//   value: BigDecimal,
// ): void => {
//   // free value is wPHA with minBalance
//   if (value.lt('0.0001')) {
//     basePool.freeValue = BigDecimal(0)
//   } else {
//     basePool.freeValue = value
//   }
// }
