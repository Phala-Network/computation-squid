import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import config from './config'
import {readFile} from 'fs/promises'
import path from 'path'
import {
  Account,
  BasePool,
  BasePoolKind,
  BasePoolWhitelist,
  Delegation,
  DelegationNft,
  GlobalState,
  IdentityLevel,
  Session,
  StakePool,
  Vault,
  Worker,
  WorkerState,
} from './model'
import {Ctx} from './processor'
import {createPool, updateSharePrice} from './utils/basePool'
import {assertGet, combineIds, getAccount, max} from './utils/common'
import {updateTokenomicParameters} from './utils/tokenomicParameters'
import {updateWorkerShares, updateWorkerSMinAndSMax} from './utils/worker'
import {fromBits, toBalance} from './utils/converter'

interface Dump {
  timestamp: number
  basePools: Array<{
    pid: string
    cid: number
    owner: string
    commission: string
    totalShares: string
    totalValue: string
    freeValue: string
    poolAccountId: string
    vault?: {
      lastSharePriceCheckpoint: string
    }
    stakePool?: {
      capacity: string | null
      workers: string[]
      ownerReward: string
    }
    whitelists: string[]
    withdrawQueue: Array<{
      user: string
      startTime: number
      nftId: number
    }>
  }>
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
    judgement: IdentityLevel | null
    // superId: string | null
    // subIdentity: string | null
  }>
  delegationNfts: Array<{
    cid: number
    nftId: number
    owner: string
    shares: string
  }>
}

const saveInitialState = async (ctx: Ctx): Promise<void> => {
  const startBlock = ctx.blocks[0].header
  const fromHeight = config.blockRange.from
  const dumpFile = await readFile(
    path.join(__dirname, `../assets/dump_${fromHeight - 1}.json`),
    'utf8'
  )
  const dump = JSON.parse(dumpFile) as Dump
  const globalState = new GlobalState({
    id: '0',
    height: fromHeight - 1,
    stakePoolValue: BigDecimal(0),
    vaultValue: BigDecimal(0),
    totalValue: BigDecimal(0),
    lastRecordedBlockHeight: fromHeight - 1,
    lastRecordedBlockTime: new Date(dump.timestamp),
    averageBlockTime: 12000,
    idleWorkerShares: BigDecimal(0),
  })
  const tokenomicParameters = await updateTokenomicParameters(ctx, startBlock)
  const accountMap = new Map<string, Account>()
  const workerMap = new Map<string, Worker>()
  const basePoolMap = new Map<string, BasePool>()
  const basePoolCidMap = new Map<string, BasePool>()
  const stakePoolMap = new Map<string, StakePool>()
  const vaultMap = new Map<string, Vault>()
  const sessionMap = new Map<string, Session>()
  const delegationMap = new Map<string, Delegation>()
  const delegationNftMap = new Map<string, DelegationNft>()
  const basePoolWhitelistMap = new Map<string, BasePoolWhitelist>()
  const nftUserMap = new Map<string, string>()

  for (const i of dump.identities) {
    const account = getAccount(accountMap, i.id)
    account.identityDisplay = i.identity
    account.identityLevel = i.judgement
    // account.subIdentity = i.subIdentity
    // if (i.superId != null) {
    //   account.super = getAccount(accountMap, i.superId)
    // }
    accountMap.set(account.id, account)
  }

  for (const w of dump.workers) {
    const worker = new Worker({
      id: w.id,
      confidenceLevel: w.confidenceLevel,
      initialScore: w.initialScore,
    })
    updateWorkerSMinAndSMax(worker, tokenomicParameters)
    workerMap.set(worker.id, worker)
  }

  // MEMO: insert worker first to avoid invalid foreign key
  await ctx.store.insert([...workerMap.values()])

  for (const s of dump.sessions) {
    const session = new Session({
      id: s.id,
      isBound: false,
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
    })
    if (s.worker != null) {
      const worker = assertGet(workerMap, s.worker)
      session.isBound = true
      session.worker = worker
      worker.session = session
      updateWorkerShares(worker, session)
      if (session.state === WorkerState.WorkerIdle) {
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares
        )
      }
    }
    sessionMap.set(session.id, session)
  }

  for (const b of dump.basePools) {
    let basePool: BasePool
    const props = {
      pid: b.pid,
      cid: b.cid,
      ownerAccount: getAccount(accountMap, b.owner),
      poolAccount: getAccount(accountMap, b.poolAccountId),
    }
    if (b.stakePool != null) {
      const pool = createPool(BasePoolKind.StakePool, props)
      basePool = pool.basePool
      basePool.commission = BigDecimal(b.commission).div(1e6)
      basePool.freeValue = toBalance(b.freeValue)
      basePool.totalShares = toBalance(b.totalShares)
      basePool.totalValue = toBalance(b.totalValue)
      updateSharePrice(basePool)

      const {stakePool} = pool

      if (b.stakePool.capacity != null) {
        stakePool.capacity = BigDecimal(b.stakePool.capacity)
        stakePool.delegable = max(
          BigDecimal(0),
          basePool.totalValue.minus(stakePool.capacity)
        )
      }
      stakePool.workerCount = b.stakePool.workers.length
      stakePool.ownerReward = toBalance(b.stakePool.ownerReward)
      stakePoolMap.set(b.pid, stakePool)

      for (const w of b.stakePool.workers) {
        const worker = assertGet(workerMap, w)
        worker.stakePool = stakePool
        assert(worker.session)
        worker.session.stakePool = stakePool
        if (worker.session.state === WorkerState.WorkerIdle) {
          assert(worker.shares)
          stakePool.idleWorkerCount++
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
            worker.shares
          )
        }
      }

      stakePool.aprMultiplier = basePool.totalValue.eq(0)
        ? BigDecimal(0)
        : stakePool.idleWorkerShares
            .times(BigDecimal(1).minus(basePool.commission))
            .div(basePool.totalValue)
    } else {
      assert(b.vault)
      const pool = createPool(BasePoolKind.Vault, props)
      basePool = pool.basePool
      const {vault} = pool
      vault.lastSharePriceCheckpoint = toBalance(
        b.vault.lastSharePriceCheckpoint
      )
      vaultMap.set(b.pid, vault)
    }

    for (const withdrawal of b.withdrawQueue) {
      const withdrawalNft = new DelegationNft({
        id: combineIds(b.cid, withdrawal.nftId),
        owner: getAccount(accountMap, b.poolAccountId),
        collectionId: b.cid,
        nftId: withdrawal.nftId,
      })
      const delegation = new Delegation({
        id: combineIds(b.pid, withdrawal.user),
        account: getAccount(accountMap, withdrawal.user),
        basePool,
        shares: BigDecimal(0),
        value: BigDecimal(0),
        withdrawalStartTime: new Date(withdrawal.startTime * 1000),
        withdrawalNft,
      })
      delegationNftMap.set(withdrawalNft.id, withdrawalNft)
      delegationMap.set(delegation.id, delegation)
      nftUserMap.set(withdrawalNft.id, withdrawal.user)
    }
    basePoolMap.set(basePool.id, basePool)
    basePoolCidMap.set(basePool.cid.toString(), basePool)
  }

  for (const d of dump.delegationNfts) {
    const owner = getAccount(accountMap, d.owner)
    const basePool = assertGet(basePoolCidMap, d.cid.toString())
    const shares = toBalance(d.shares)
    const delegationNftId = combineIds(d.cid, d.nftId)
    if (delegationNftMap.has(delegationNftId)) {
      // MEMO: delegation nft is a withdrawal nft
      const user = assertGet(nftUserMap, delegationNftId)
      const delegationId = combineIds(basePool.id, user)
      const delegation = assertGet(delegationMap, delegationId)
      delegation.withdrawalShares = shares
      delegation.withdrawalValue = BigDecimal(0)
    } else {
      const delegationId = combineIds(basePool.id, d.owner)
      const delegationNft = new DelegationNft({
        id: delegationNftId,
        owner,
        collectionId: d.cid,
        nftId: d.nftId,
      })

      const delegation =
        delegationMap.get(delegationId) ??
        new Delegation({
          id: delegationId,
          account: owner,
          basePool,
          delegationNft,
          withdrawalShares: BigDecimal(0),
          withdrawalValue: BigDecimal(0),
        })

      delegation.shares = shares
      delegation.value = BigDecimal(0)
      delegation.delegationNft = delegationNft

      delegationNftMap.set(delegationNft.id, delegationNft)
      delegationMap.set(delegation.id, delegation)
    }
  }

  for (const x of [
    globalState,
    accountMap,
    basePoolMap,
    stakePoolMap,
    vaultMap,
    sessionMap,
    workerMap,
    delegationNftMap,
    delegationMap,
    basePoolWhitelistMap,
  ]) {
    if (x instanceof Map) {
      await ctx.store.save([...x.values()])
    } else {
      await ctx.store.save(x)
    }
  }
}

export default saveInitialState
