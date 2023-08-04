import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
// import {readFile} from 'fs/promises'
import {groupBy} from 'lodash'
// import path from 'path'
import {type Store} from '@subsquid/typeorm-store'
import fetch from 'node-fetch'
import config, {BASE_POOL_ACCOUNT} from './config'
import {
  BasePoolKind,
  BasePoolWhitelist,
  Delegation,
  GlobalState,
  Nft,
  Session,
  Worker,
  WorkerState,
  type Account,
  type AccountSnapshot,
  type BasePool,
  type IdentityLevel,
  type StakePool,
  type Vault,
} from './model'
import {type ProcessorContext} from './processor'
import {createAccountSnapshot} from './utils/accountSnapshot'
import {
  createPool,
  getBasePoolAvgAprMultiplier,
  updateSharePrice,
  updateStakePoolAprMultiplier,
  updateStakePoolDelegable,
  updateVaultAprMultiplier,
} from './utils/basePool'
import {assertGet, getAccount, join, sum} from './utils/common'
import {fromBits, toBalance} from './utils/converter'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './utils/delegation'
import {updateTokenomicParameters} from './utils/globalState'
import {updateWorkerShares} from './utils/worker'

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

interface Dump {
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
    judgement: IdentityLevel | null
    // superId: string | null
    // subIdentity: string | null
  }>
  nfts: Array<{
    cid: number
    nftId: number
    owner: string
    shares?: string
    createTime?: number
  }>
}

const importDump = async (ctx: ProcessorContext<Store>): Promise<void> => {
  const fromHeight = config.blockRange.from
  const dump = await fetch(
    'https://raw.githubusercontent.com/Phala-Network/computation-squid/main/dump_4396000.json'
  ).then(async (res) => (await res.json()) as Dump)
  const globalState = new GlobalState({
    id: '0',
    height: fromHeight - 1,
    averageAprMultiplierUpdatedTime: new Date(dump.timestamp),
    averageBlockTimeUpdatedHeight: fromHeight - 1,
    averageBlockTimeUpdatedTime: new Date(dump.timestamp),
    averageBlockTime: 12000,
    totalValue: BigDecimal(0),
    idleWorkerShares: BigDecimal(0),
    cumulativeRewards: BigDecimal(0),
  })
  await updateTokenomicParameters(ctx, ctx.blocks[0].header, globalState)
  const accountMap = new Map<string, Account>()
  const workerMap = new Map<string, Worker>()
  const basePoolMap = new Map<string, BasePool>()
  const basePoolCidMap = new Map<string, BasePool>()
  const stakePoolMap = new Map<string, StakePool>()
  const vaultMap = new Map<string, Vault>()
  const sessionMap = new Map<string, Session>()
  const delegationMap = new Map<string, Delegation>()
  const nftMap = new Map<string, Nft>()
  const basePoolWhitelistMap = new Map<string, BasePoolWhitelist>()
  const nftUserMap = new Map<string, string>()
  const accountValueSnapshots: AccountSnapshot[] = []
  const whitelists: BasePoolWhitelist[] = []

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
        b.vault.lastSharePriceCheckpoint
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
        assert(worker.session)
        worker.session.stakePool = stakePool
        if (worker.session.state === WorkerState.WorkerIdle) {
          assert(worker.shares)
          stakePool.idleWorkerCount++
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
            worker.shares
          )
        }
        if (worker.session.state === WorkerState.WorkerCoolingDown) {
          basePool.releasingValue = basePool.releasingValue.plus(
            worker.session.stake
          )
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
          createTime: new Date(dump.timestamp - whitelists.length + i),
        })
      )
    }

    for (const withdrawal of b.withdrawQueue) {
      const withdrawalNft = new Nft({
        id: join(b.cid, withdrawal.nftId),
        owner: getAccount(accountMap, BASE_POOL_ACCOUNT),
        cid: b.cid,
        nftId: withdrawal.nftId,
        burned: false,
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
    basePoolCidMap.set(basePool.cid.toString(), basePool)
  }

  for (const d of dump.nfts) {
    const owner = getAccount(accountMap, d.owner)
    const nftId = join(d.cid, d.nftId)

    // MEMO: normal nft
    if (d.shares === undefined || d.createTime === undefined) {
      const nft = new Nft({
        id: nftId,
        owner,
        cid: d.cid,
        nftId: d.nftId,
        burned: false,
      })
      nftMap.set(nft.id, nft)
      continue
    }
    const basePool = assertGet(basePoolCidMap, d.cid.toString())
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
        // HACK: mark as burned to avoid displaying on dashboard
        burned: shares.eq(0),
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
      if (![...basePoolMap.values()].some((x) => x.account.id === owner.id)) {
        // HACK: invalid delegation value
        if (
          delegation.id !==
          '4720-3zxRSK5DquqD1f53e8CXTjqMb9wVBJxPDqb534w77147b5Cz'
        ) {
          globalState.totalValue = globalState.totalValue.plus(delegation.value)
        }
      }
      delegation.delegationNft = delegationNft

      nftMap.set(delegationNft.id, delegationNft)
      delegationMap.set(delegation.id, delegation)
      if (shares.gt(0)) {
        basePool.delegatorCount++
        if (basePool.kind === BasePoolKind.StakePool) {
          owner.stakePoolValue = owner.stakePoolValue.plus(delegation.value)
          owner.stakePoolNftCount++
        } else {
          owner.vaultValue = owner.vaultValue.plus(delegation.value)
          owner.vaultNftCount++
        }
      }
    }
  }

  const accountDelegationMap = groupBy(
    [...delegationMap.values()],
    (x) => x.account.id
  )

  for (const account of accountMap.values()) {
    const delegations = accountDelegationMap[account.id] ?? []
    const stakePoolDelegations = delegations.filter(
      (x) => x.basePool.kind === BasePoolKind.StakePool
    )
    account.stakePoolAvgAprMultiplier =
      getDelegationAvgAprMultiplier(stakePoolDelegations)

    accountValueSnapshots.push(
      createAccountSnapshot({account, updatedTime: new Date(dump.timestamp)})
    )
  }

  for (const basePool of basePoolMap.values()) {
    if (basePool.kind === BasePoolKind.Vault) {
      updateVaultAprMultiplier(basePool, basePool.account)
      const delegations = accountDelegationMap[basePool.account.id] ?? []
      const stakePoolDelegations = delegations.filter(
        (x) => x.basePool.kind === BasePoolKind.StakePool
      )
      basePool.releasingValue = sum(
        ...stakePoolDelegations.map((x) => x.withdrawingValue)
      )
    }
    basePool.withdrawingValue = basePool.withdrawingShares
      .times(basePool.sharePrice)
      .round(12, 0)
  }

  for (const stakePool of stakePoolMap.values()) {
    updateStakePoolDelegable(stakePool.basePool, stakePool)
  }

  for (const account of accountMap.values()) {
    const delegations = accountDelegationMap[account.id] ?? []
    const vaultDelegations = delegations.filter(
      (x) => x.basePool.kind === BasePoolKind.Vault
    )
    account.vaultAvgAprMultiplier =
      getDelegationAvgAprMultiplier(vaultDelegations)
  }

  globalState.averageAprMultiplier = getBasePoolAvgAprMultiplier(
    [...basePoolMap.values()].filter((x) => x.kind === BasePoolKind.StakePool)
  )

  ctx.log.info(globalState.totalValue.toString())

  for (const x of [
    globalState,
    accountMap,
    basePoolMap,
    stakePoolMap,
    vaultMap,
    sessionMap,
    workerMap,
    nftMap,
    delegationMap,
    basePoolWhitelistMap,
    accountValueSnapshots,
    whitelists,
  ]) {
    if (x instanceof Map) {
      await ctx.store.save([...x.values()])
    } else if (Array.isArray(x)) {
      await ctx.store.save([...x])
    } else {
      // bypass type check
      await ctx.store.save(x)
    }
  }
}

export default importDump
