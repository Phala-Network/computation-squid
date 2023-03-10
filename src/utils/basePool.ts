import {BigDecimal} from '@subsquid/big-decimal'
import {
  BasePool,
  BasePoolKind,
  GlobalState,
  StakePool,
  Vault,
  type Account,
} from '../model'
import {type Ctx} from '../processor'
import {sum} from './common'

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
  const sharePrice = basePool.totalShares.eq(0)
    ? BigDecimal(1)
    : basePool.totalValue.div(basePool.totalShares).round(12, 0)
  basePool.sharePrice = sharePrice
  basePool.withdrawingValue = basePool.withdrawingShares
    .times(sharePrice)
    .round(12, 0)
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
        .round(6, 0)
}

export const updateVaultAprMultiplier = (
  basePool: BasePool,
  account: Account
): void => {
  if (basePool.totalValue.eq(0)) {
    basePool.aprMultiplier = BigDecimal(0)
  } else {
    basePool.aprMultiplier = account.stakePoolAvgAprMultiplier
      .times(account.stakePoolValue)
      .div(basePool.totalValue)
      .times(BigDecimal(1).minus(basePool.commission))
      .round(6, 0)
  }
}

export const updateStakePoolDelegable = (
  basePool: BasePool,
  stakePool: StakePool
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
  basePools: BasePool[]
): BigDecimal => {
  const totalValue = sum(...basePools.map((x) => x.totalValue))
  if (totalValue.eq(0)) return BigDecimal(0)
  return basePools
    .reduce(
      (a, b) => a.plus(b.totalValue.times(b.aprMultiplier)),
      BigDecimal(0)
    )
    .div(totalValue)
    .round(6, 0)
}

export const updateGlobalAverageAprMultiplier = async (
  ctx: Ctx
): Promise<void> => {
  const lastBlock = ctx.blocks[ctx.blocks.length - 1]
  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})
  const FIVE_MINUTES = 5 * 60 * 1000
  if (
    lastBlock.header.timestamp -
      globalState.averageAprMultiplierUpdatedTime.getTime() >
    FIVE_MINUTES
  ) {
    const stakePools = await ctx.store.find(BasePool, {
      where: {kind: BasePoolKind.StakePool},
    })
    globalState.averageAprMultiplier = getBasePoolAvgAprMultiplier(stakePools)
    globalState.averageAprMultiplierUpdatedTime = new Date(
      lastBlock.header.timestamp
    )
    await ctx.store.save(globalState)
  }
}
