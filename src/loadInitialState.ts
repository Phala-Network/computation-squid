import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import {BigDecimal} from '@subsquid/big-decimal'
import {addDays} from 'date-fns'
import {BASE_POOL_ACCOUNT, INITIAL_BLOCK} from './constants'
import {getAccount} from './helper/account'
import {
  createPool,
  updateSharePrice,
  updateStakePoolAprMultiplier,
  updateStakePoolDelegable,
} from './helper/basePool'
import {updateDelegationValue} from './helper/delegation'
import {updateTokenomicParameters} from './helper/globalState'
import {getSnapshotUpdatedTime} from './helper/snapshot'
import {updateSessionShares} from './helper/worker'
import {
  type Account,
  type BasePool,
  BasePoolKind,
  BasePoolWhitelist,
  Delegation,
  GlobalState,
  type IdentityJudgement,
  Nft,
  Session,
  type StakePool,
  type Vault,
  Worker,
  WorkerState,
} from './model'
import type {Ctx} from './processor'
import {assertGet, fromBits, join, save, toBalance} from './utils'

interface IBasePool {
  pid: string
  cid: number
  owner: string
  commission: string
  totalShares: string
  totalValue: string
  freeValue: string
  poolAccountId: string
  whitelists: string[]
  withdrawQueue: Array<{
    user: string
    startTime: number
    nftId: number
  }>
}

interface BasePoolWithVault extends IBasePool {
  vault: {
    lastSharePriceCheckpoint: string
    ownerShares: string
  }
  stakePool?: never
}

interface BasePoolWithStakePool extends IBasePool {
  vault?: never
  stakePool: {
    capacity: string | null
    workers: string[]
    ownerReward: string
  }
}

interface InitialState {
  timestamp: number
  basePools: Array<BasePoolWithVault | BasePoolWithStakePool>
  workers: Array<{
    id: string
    confidenceLevel: number
    initialScore: number | null
  }>
  sessions: Array<{
    id: string
    v: string
    ve: string
    state: WorkerState
    pInit: number
    pInstant: number
    totalReward: string
    coolingDownStartTime: number
    stake: string
    worker: string | null
  }>
  identities: Array<{
    id: string
    identity: string | null
    judgements: IdentityJudgement[]
  }>
  nfts: Array<{
    cid: number
    nftId: number
    owner: string
    shares?: string
    createTime?: number
  }>
}

const loadInitialState = async (ctx: Ctx): Promise<void> => {
  const data = fs.readFileSync(
    path.resolve(__dirname, `../initial_state/${INITIAL_BLOCK}.json`),
    'utf8',
  )
  const initialState: InitialState = JSON.parse(data)
  const updatedTime = new Date(initialState.timestamp)
  const globalState = new GlobalState({
    id: '0',
    height: INITIAL_BLOCK,
    averageApr: BigDecimal(0),
    averageAprMultiplier: BigDecimal(0),
    averageBlockTimeUpdatedHeight: INITIAL_BLOCK,
    averageBlockTimeUpdatedTime: updatedTime,
    snapshotUpdatedTime: addDays(
      getSnapshotUpdatedTime(initialState.timestamp),
      -1,
    ),
    averageBlockTime: 12_000,
    totalValue: BigDecimal(0),
    idleWorkerShares: BigDecimal(0),
    cumulativeRewards: BigDecimal(0),
    workerCount: 0,
    idleWorkerCount: 0,
    idleWorkerPInit: 0,
    idleWorkerPInstant: 0,
    budgetPerShare: BigDecimal(0),
    delegatorCount: 0,
  })
  await updateTokenomicParameters(ctx.blocks[0].header, globalState)
  const accountMap = new Map<string, Account>()
  const workerMap = new Map<string, Worker>()
  const sessionMap = new Map<string, Session>()
  const workerSessionMap = new Map<string, Session>()
  const basePoolMap = new Map<string, BasePool>()
  const cidBasePoolMap = new Map<string, BasePool>()
  const accountBasePoolMap = new Map<string, BasePool>()
  const stakePoolMap = new Map<string, StakePool>()
  const vaultMap = new Map<string, Vault>()
  const delegationMap = new Map<string, Delegation>()
  const nftMap = new Map<string, Nft>()
  const basePoolWhitelistMap = new Map<string, BasePoolWhitelist>()
  const nftUserMap = new Map<string, string>()
  const whitelists: BasePoolWhitelist[] = []

  for (const i of initialState.identities) {
    const account = getAccount(accountMap, i.id)
    account.identityDisplay = i.identity
    if (i.judgements.length > 0) {
      account.identityLevel = i.judgements[i.judgements.length - 1]
      account.identityJudgements = i.judgements
    }
    accountMap.set(account.id, account)
  }

  for (const w of initialState.workers) {
    const worker = new Worker({
      id: w.id,
      confidenceLevel: w.confidenceLevel,
      initialScore: w.initialScore,
    })
    workerMap.set(worker.id, worker)
  }

  for (const s of initialState.sessions) {
    const session = new Session({
      id: s.id,
      v: fromBits(s.v),
      ve: fromBits(s.ve),
      state: s.state,
      pInit: s.pInit,
      pInstant: s.pInstant,
      totalReward: toBalance(s.totalReward),
      coolingDownStartTime:
        s.coolingDownStartTime === 0
          ? null
          : new Date(s.coolingDownStartTime * 1000),
      stake: toBalance(s.stake),
      shares: BigDecimal(0),
    })
    if (s.worker != null) {
      workerSessionMap.set(s.worker, session)
      const worker = assertGet(workerMap, s.worker)
      session.worker = worker
      updateSessionShares(session, worker)
      globalState.workerCount++
      if (session.state === WorkerState.WorkerIdle) {
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          session.shares,
        )
        globalState.idleWorkerCount++
        globalState.idleWorkerPInit += session.pInit
        globalState.idleWorkerPInstant += session.pInstant
      }
    }
    sessionMap.set(session.id, session)
  }

  for (const b of initialState.basePools) {
    const isVault = b.vault !== undefined
    const props = {
      pid: b.pid,
      cid: b.cid,
      ownerAccount: getAccount(accountMap, b.owner),
      poolAccount: getAccount(accountMap, b.poolAccountId),
    }
    const pool = isVault
      ? createPool(BasePoolKind.Vault, props)
      : createPool(BasePoolKind.StakePool, props)
    const basePool = pool.basePool
    basePool.commission = BigDecimal(b.commission).div(1e6)
    basePool.freeValue = toBalance(b.freeValue)
    basePool.totalShares = toBalance(b.totalShares)
    basePool.totalValue = toBalance(b.totalValue)
    updateSharePrice(basePool)
    if (isVault) {
      assert('vault' in pool)
      const {vault} = pool
      vault.lastSharePriceCheckpoint = toBalance(
        b.vault.lastSharePriceCheckpoint,
      )
      vault.claimableOwnerShares = toBalance(b.vault.ownerShares)
      vaultMap.set(b.pid, vault)
    } else {
      assert('stakePool' in pool)
      const {stakePool} = pool

      if (b.stakePool.capacity != null) {
        stakePool.capacity = toBalance(b.stakePool.capacity)
      }
      stakePool.workerCount = b.stakePool.workers.length
      stakePool.ownerReward = toBalance(b.stakePool.ownerReward)
      stakePoolMap.set(b.pid, stakePool)

      for (const w of b.stakePool.workers) {
        const worker = assertGet(workerMap, w)
        worker.stakePool = stakePool
        const session = assertGet(workerSessionMap, w)
        if (session.state === WorkerState.WorkerIdle) {
          stakePool.idleWorkerCount++
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
            session.shares,
          )
        } else if (session.state === WorkerState.WorkerCoolingDown) {
          basePool.releasingValue = basePool.releasingValue.plus(session.stake)
        }
      }

      updateStakePoolAprMultiplier(basePool, stakePool)
    }

    if (b.whitelists.length > 0) {
      basePool.whitelistEnabled = true
    }

    for (let i = 0; i < b.whitelists.length; i++) {
      const address = b.whitelists[i]
      whitelists.push(
        new BasePoolWhitelist({
          id: join(b.pid, address),
          account: getAccount(accountMap, address),
          basePool,
          // MEMO: keep the order of whitelists
          createTime: new Date(initialState.timestamp - whitelists.length + i),
        }),
      )
    }

    for (const withdrawal of b.withdrawQueue) {
      const withdrawalNft = new Nft({
        id: join(b.cid, withdrawal.nftId),
        owner: getAccount(accountMap, BASE_POOL_ACCOUNT),
        cid: b.cid,
        nftId: withdrawal.nftId,
      })
      const delegation = new Delegation({
        id: join(b.pid, withdrawal.user),
        account: getAccount(accountMap, withdrawal.user),
        basePool,
        shares: BigDecimal(0),
        value: BigDecimal(0),
        withdrawingShares: BigDecimal(0),
        withdrawalStartTime: new Date(withdrawal.startTime * 1000),
        withdrawalNft,
      })
      nftMap.set(withdrawalNft.id, withdrawalNft)
      delegationMap.set(delegation.id, delegation)
      nftUserMap.set(withdrawalNft.id, withdrawal.user)
    }
    basePoolMap.set(basePool.id, basePool)
    cidBasePoolMap.set(basePool.cid.toString(), basePool)
    accountBasePoolMap.set(b.poolAccountId, basePool)
  }

  for (const d of initialState.nfts) {
    const owner = getAccount(accountMap, d.owner)
    const nftId = join(d.cid, d.nftId)

    // MEMO: normal nft
    if (d.shares == null || d.createTime == null) {
      const nft = new Nft({
        id: nftId,
        owner,
        cid: d.cid,
        nftId: d.nftId,
      })
      nftMap.set(nft.id, nft)
      continue
    }
    const basePool = assertGet(cidBasePoolMap, d.cid.toString())
    const shares = toBalance(d.shares)
    if (nftMap.has(nftId)) {
      // MEMO: is a withdrawal nft
      const nft = assertGet(nftMap, nftId)
      nft.mintTime = new Date(d.createTime)
      const user = assertGet(nftUserMap, nftId)
      const delegationId = join(basePool.id, user)
      const delegation = assertGet(delegationMap, delegationId)
      delegation.shares = delegation.shares.plus(shares)
      delegation.withdrawingShares = shares
      updateDelegationValue(delegation, basePool)
      delegation.cost = delegation.value
      basePool.withdrawingShares = basePool.withdrawingShares.plus(shares)
    } else {
      const delegationId = join(basePool.id, d.owner)
      const delegationNft = new Nft({
        id: nftId,
        owner,
        cid: d.cid,
        nftId: d.nftId,
        mintTime: new Date(d.createTime),
      })

      const delegation =
        delegationMap.get(delegationId) ??
        new Delegation({
          id: delegationId,
          account: owner,
          basePool,
          delegationNft,
          withdrawingShares: BigDecimal(0),
          withdrawingValue: BigDecimal(0),
        })

      delegation.shares = shares.plus(delegation.withdrawingShares)
      updateDelegationValue(delegation, basePool)
      delegation.cost = delegation.value
      if (!accountBasePoolMap.has(owner.id)) {
        globalState.totalValue = globalState.totalValue.plus(delegation.value)
      }
      delegation.delegationNft = delegationNft
      nftMap.set(delegationNft.id, delegationNft)
      delegationMap.set(delegation.id, delegation)
    }
  }

  for (const basePool of basePoolMap.values()) {
    basePool.withdrawingValue = basePool.withdrawingShares
      .times(basePool.sharePrice)
      .round(12)
  }

  for (const stakePool of stakePoolMap.values()) {
    updateStakePoolDelegable(stakePool.basePool, stakePool)
  }

  await save(ctx, [
    globalState,
    accountMap,
    basePoolMap,
    stakePoolMap,
    vaultMap,
    workerMap,
    sessionMap,
    nftMap,
    delegationMap,
    basePoolWhitelistMap,
    whitelists,
  ])
}

export default loadInitialState
