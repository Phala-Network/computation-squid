import assert from 'assert'
import {BigDecimal} from '@subsquid/big-decimal'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {In} from 'typeorm'
import {
  BASE_POOL_ACCOUNT,
  ENABLE_SNAPSHOT,
  FORCE_REFRESH_IDENTITY,
} from './constants'
import decodeEvents from './decodeEvents'
import {getAccount} from './helper/account'
import {
  createPool,
  updateFreeValue,
  updateSharePrice,
  updateStakePoolAprMultiplier,
  updateStakePoolDelegable,
} from './helper/basePool'
import {updateDelegationValue} from './helper/delegation'
import {updateTokenomicParameters} from './helper/globalState'
import {queryIdentities} from './helper/identity'
import postUpdate from './helper/postUpdate'
import {isSnapshotUpdateNeeded, takeSnapshot} from './helper/snapshot'
import {updateSessionShares} from './helper/worker'
import loadInitialState from './loadInitialState'
import {
  Account,
  BasePool,
  BasePoolKind,
  BasePoolWhitelist,
  Delegation,
  GlobalState,
  Nft,
  Session,
  StakePool,
  Vault,
  Worker,
  WorkerState,
} from './model'
import {processor} from './processor'
import {
  identity,
  phalaBasePool,
  phalaComputation,
  phalaRegistry,
  phalaStakePoolv2,
  phalaVault,
  rmrkCore,
} from './types/events'
import {assertGet, join, max, save, toMap} from './utils'

processor.run(new TypeormDatabase(), async (ctx) => {
  if ((await ctx.store.get(GlobalState, '0')) == null) {
    ctx.log.info('Loading initial state')
    await loadInitialState(ctx)
    ctx.log.info('Initial state loaded')
  }
  const events = decodeEvents(ctx)

  const identityUpdatedAccountIdSet = new Set<string>()
  const basePoolIdSet = new Set<string>()
  const workerIdSet = new Set<string>()
  const sessionIdSet = new Set<string>()
  const nftIdSet = new Set<string>()
  const basePoolWhitelistIdSet = new Set<string>()
  const basePoolAccountIdSet = new Set<string>()

  for (const {name, args} of events) {
    if (
      name === phalaStakePoolv2.poolCommissionSet.name ||
      name === phalaStakePoolv2.poolCapacitySet.name ||
      name === phalaStakePoolv2.poolWorkerAdded.name ||
      name === phalaStakePoolv2.workingStarted.name ||
      name === phalaStakePoolv2.rewardReceived.name ||
      name === phalaStakePoolv2.ownerRewardsWithdrawn.name ||
      name === phalaStakePoolv2.contribution.name ||
      name === phalaStakePoolv2.workerReclaimed.name ||
      name === phalaVault.vaultCommissionSet.name ||
      name === phalaVault.ownerSharesClaimed.name ||
      name === phalaVault.ownerSharesGained.name ||
      name === phalaVault.contribution.name ||
      name === phalaBasePool.nftCreated.name ||
      name === phalaBasePool.withdrawal.name ||
      name === phalaBasePool.withdrawalQueued.name ||
      name === phalaBasePool.poolWhitelistCreated.name ||
      name === phalaBasePool.poolWhitelistDeleted.name ||
      name === phalaBasePool.poolWhitelistStakerAdded.name ||
      name === phalaBasePool.poolWhitelistStakerRemoved.name
    ) {
      basePoolIdSet.add(args.pid)
    }

    if (
      name === phalaStakePoolv2.contribution.name ||
      name === phalaBasePool.withdrawalQueued.name
    ) {
      if (args.asVault !== undefined) {
        basePoolIdSet.add(args.asVault)
      }
    }

    if (name === phalaBasePool.withdrawal.name) {
      basePoolAccountIdSet.add(args.accountId)
    }

    if (
      name === phalaStakePoolv2.poolWorkerAdded.name ||
      name === phalaStakePoolv2.poolWorkerRemoved.name ||
      name === phalaStakePoolv2.workingStarted.name ||
      name === phalaComputation.sessionBound.name ||
      name === phalaComputation.sessionUnbound.name ||
      name === phalaRegistry.initialScoreSet.name ||
      name === phalaRegistry.workerUpdated.name
    ) {
      workerIdSet.add(args.workerId)
    }

    if (
      name === phalaComputation.sessionBound.name ||
      name === phalaComputation.sessionUnbound.name ||
      name === phalaComputation.sessionSettled.name ||
      name === phalaComputation.workerStarted.name ||
      name === phalaComputation.workerStopped.name ||
      name === phalaComputation.workerReclaimed.name ||
      name === phalaComputation.workerEnterUnresponsive.name ||
      name === phalaComputation.workerExitUnresponsive.name ||
      name === phalaComputation.benchmarkUpdated.name
    ) {
      sessionIdSet.add(args.sessionId)
    }

    if (name === phalaBasePool.poolWhitelistStakerRemoved.name) {
      basePoolWhitelistIdSet.add(join(args.pid, args.accountId))
    }

    if (name === rmrkCore.nftBurned.name) {
      nftIdSet.add(join(args.cid, args.nftId))
    }

    if (
      name === identity.identitySet.name ||
      name === identity.identityCleared.name ||
      name === identity.judgementGiven.name
    ) {
      identityUpdatedAccountIdSet.add(args.accountId)
    }
  }
  const globalState = await ctx.store.findOneBy(GlobalState, {id: '0'})
  assert(globalState)
  const accountMap: Map<string, Account> = await ctx.store
    .find(Account)
    .then(toMap)
  const sessions = await ctx.store.find(Session, {
    where: [{id: In([...sessionIdSet])}, {worker: {id: In([...workerIdSet])}}],
    relations: {worker: true},
  })
  const sessionMap = toMap(sessions)
  const workerSessionMap = toMap(
    sessions.filter((s): s is Session & {worker: Worker} => s.worker != null),
    (session) => session.worker.id,
  )
  for (const session of sessions) {
    if (session.worker) {
      workerIdSet.add(session.worker.id)
    }
  }
  const workerMap = await ctx.store
    .find(Worker, {
      where: [{id: In([...workerIdSet])}],
      relations: {stakePool: true},
    })
    .then(toMap)
  for (const {stakePool} of workerMap.values()) {
    if (stakePool != null) {
      basePoolIdSet.add(stakePool.id)
    }
  }
  const basePools = await ctx.store.find(BasePool, {
    relations: {owner: true, account: true},
  })
  const basePoolMap = toMap(basePools)
  const basePoolAccountIdMap = toMap(
    basePools,
    (basePool) => basePool.account.id,
  )
  const stakePoolMap = await ctx.store
    .find(StakePool, {relations: {basePool: true}})
    .then(toMap)
  const vaultMap = await ctx.store
    .find(Vault, {
      where: {id: In([...basePoolIdSet])},
      relations: {basePool: true},
    })
    .then(toMap)

  const delegations = await ctx.store.find(Delegation, {
    relations: {
      account: true,
      basePool: true,
      delegationNft: true,
      withdrawalNft: true,
    },
  })
  const delegationMap = toMap(delegations)

  const nftMap = await ctx.store
    .find(Nft, {
      where: {id: In([...nftIdSet])},
      relations: {owner: true},
    })
    .then(toMap)
  const basePoolWhitelistMap = await ctx.store
    .find(BasePoolWhitelist, {
      where: {id: In([...basePoolWhitelistIdSet])},
    })
    .then(toMap)

  for (let i = 0; i < events.length; i++) {
    const {name, args, block} = events[i]
    assert(block.timestamp)
    const blockTime = new Date(block.timestamp)

    switch (name) {
      case phalaStakePoolv2.poolCreated.name: {
        const {pid, owner, cid, poolAccountId} = args
        const ownerAccount = getAccount(accountMap, owner)
        const poolAccount = getAccount(accountMap, poolAccountId)
        const {stakePool, basePool} = createPool(BasePoolKind.StakePool, {
          pid,
          cid,
          ownerAccount,
          poolAccount,
        })
        basePoolMap.set(pid, basePool)
        basePoolAccountIdMap.set(poolAccountId, basePool)
        stakePoolMap.set(pid, stakePool)
        break
      }
      case phalaStakePoolv2.poolCommissionSet.name: {
        const {pid, commission} = args
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        basePool.commission = commission
        updateStakePoolAprMultiplier(basePool, stakePool)
        break
      }
      case phalaStakePoolv2.poolCapacitySet.name: {
        const {pid, cap} = args
        const stakePool = assertGet(stakePoolMap, pid)
        const basePool = assertGet(basePoolMap, pid)
        stakePool.capacity = cap
        updateStakePoolDelegable(basePool, stakePool)
        break
      }
      case phalaStakePoolv2.poolWorkerAdded.name: {
        const {pid, workerId} = args
        const stakePool = assertGet(stakePoolMap, pid)
        const worker = assertGet(workerMap, workerId)
        // MEMO: SessionBound happens before PoolWorkerAdded
        stakePool.workerCount++
        globalState.workerCount++
        worker.stakePool = stakePool
        break
      }
      case phalaStakePoolv2.poolWorkerRemoved.name: {
        const {pid, workerId} = args
        const worker = assertGet(workerMap, workerId)
        const stakePool = assertGet(stakePoolMap, pid)
        assert(worker.stakePool?.id === pid)
        worker.stakePool = null
        stakePool.workerCount--
        globalState.workerCount--
        break
      }
      case phalaStakePoolv2.workingStarted.name: {
        const {pid, workerId, amount} = args
        const basePool = assertGet(basePoolMap, pid)
        const session = assertGet(workerSessionMap, workerId)
        session.stake = amount
        updateFreeValue(basePool, basePool.freeValue.minus(amount))
        break
      }
      case phalaStakePoolv2.rewardReceived.name: {
        const {pid, toOwner, toStakers} = args
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        const owner = assertGet(accountMap, basePool.owner.id)
        stakePool.ownerReward = stakePool.ownerReward.plus(toOwner)
        basePool.totalValue = basePool.totalValue.plus(toStakers)
        updateFreeValue(basePool, basePool.freeValue.plus(toStakers))
        globalState.totalValue = globalState.totalValue.plus(toStakers)
        globalState.cumulativeRewards = globalState.cumulativeRewards
          .plus(toOwner)
          .plus(toStakers)
        updateSharePrice(basePool)
        updateStakePoolDelegable(basePool, stakePool)
        basePool.cumulativeOwnerRewards =
          basePool.cumulativeOwnerRewards.plus(toOwner)
        owner.cumulativeStakePoolOwnerRewards =
          owner.cumulativeStakePoolOwnerRewards.plus(toOwner)
        break
      }
      case phalaStakePoolv2.ownerRewardsWithdrawn.name: {
        const {pid} = args
        const stakePool = assertGet(stakePoolMap, pid)
        stakePool.ownerReward = BigDecimal(0)
        break
      }
      case phalaStakePoolv2.contribution.name: {
        const {pid, amount, shares, asVault} = args
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        basePool.freeValue = basePool.freeValue.plus(amount)
        basePool.totalShares = basePool.totalShares.plus(shares)
        basePool.totalValue = basePool.totalValue.plus(amount)
        updateStakePoolAprMultiplier(basePool, stakePool)
        // MEMO: delegator is not a vault
        if (asVault === undefined || asVault === '0') {
          globalState.totalValue = globalState.totalValue.plus(amount)
        } else {
          const vaultBasePool = assertGet(basePoolMap, asVault)
          updateFreeValue(vaultBasePool, vaultBasePool.freeValue.minus(amount))
        }
        updateStakePoolDelegable(basePool, stakePool)
        break
      }
      case phalaBasePool.poolWhitelistCreated.name: {
        const {pid} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.whitelistEnabled = true
        break
      }
      case phalaBasePool.poolWhitelistDeleted.name: {
        const {pid} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.whitelistEnabled = false
        break
      }
      case phalaBasePool.poolWhitelistStakerAdded.name: {
        const {pid, accountId} = args
        const account = getAccount(accountMap, accountId)
        const basePool = assertGet(basePoolMap, pid)
        const id = join(pid, accountId)
        const basePoolWhitelist = new BasePoolWhitelist({
          id,
          basePool,
          account,
          createTime: blockTime,
        })
        basePoolWhitelistMap.set(id, basePoolWhitelist)
        break
      }
      case phalaBasePool.poolWhitelistStakerRemoved.name: {
        const {pid, accountId} = args
        const id = join(pid, accountId)
        const basePoolWhitelist = assertGet(basePoolWhitelistMap, id)
        basePoolWhitelistMap.delete(id)
        await ctx.store.remove(basePoolWhitelist)
        break
      }
      case phalaVault.poolCreated.name: {
        const {pid, owner, cid, poolAccountId} = args
        const poolAccount = getAccount(accountMap, poolAccountId)
        const ownerAccount = getAccount(accountMap, owner)
        const {vault, basePool} = createPool(BasePoolKind.Vault, {
          pid,
          cid,
          ownerAccount,
          poolAccount,
        })
        basePoolMap.set(pid, basePool)
        basePoolAccountIdMap.set(poolAccountId, basePool)
        vaultMap.set(pid, vault)
        break
      }
      case phalaVault.vaultCommissionSet.name: {
        const {pid, commission} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.commission = commission
        break
      }
      case phalaVault.ownerSharesGained.name: {
        const {pid, shares} = args
        const basePool = assertGet(basePoolMap, pid)
        const vault = assertGet(vaultMap, pid)
        const owner = assertGet(accountMap, basePool.owner.id)
        basePool.totalShares = basePool.totalShares.plus(shares)
        updateSharePrice(basePool)
        vault.claimableOwnerShares = vault.claimableOwnerShares.plus(shares)
        vault.lastSharePriceCheckpoint = basePool.sharePrice
        const rewards = shares.times(basePool.sharePrice).round(12)
        basePool.cumulativeOwnerRewards =
          basePool.cumulativeOwnerRewards.plus(rewards)
        owner.cumulativeVaultOwnerRewards =
          owner.cumulativeVaultOwnerRewards.plus(rewards)
        break
      }
      case phalaVault.ownerSharesClaimed.name: {
        const {pid, shares} = args
        const vault = assertGet(vaultMap, pid)
        vault.claimableOwnerShares = vault.claimableOwnerShares.minus(shares)
        break
      }
      case phalaVault.contribution.name: {
        const {pid, amount, shares} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.freeValue = basePool.freeValue.plus(amount)
        basePool.totalShares = basePool.totalShares.plus(shares)
        basePool.totalValue = basePool.totalValue.plus(amount)
        globalState.totalValue = globalState.totalValue.plus(amount)
        break
      }
      case phalaBasePool.nftCreated.name: {
        const {pid, owner, cid, nftId, shares} = args
        const ownerAccount = getAccount(accountMap, owner)
        const basePool = assertGet(basePoolMap, pid)
        // MEMO: ignore withdrawal nft
        if (owner !== BASE_POOL_ACCOUNT) {
          const delegationNft = assertGet(nftMap, join(cid, nftId))
          if (shares.eq(0)) {
            // HACK: mark empty delegation nft as burned
            delegationNft.burned = true
          }
          const delegationId = join(pid, owner)
          const delegation =
            delegationMap.get(delegationId) ??
            new Delegation({
              id: delegationId,
              basePool,
              account: ownerAccount,
              cost: BigDecimal(0),
              value: BigDecimal(0),
              shares: BigDecimal(0),
              withdrawingValue: BigDecimal(0),
              withdrawingShares: BigDecimal(0),
            })
          delegation.delegationNft = delegationNft
          const prevShares = delegation.shares
          delegation.shares = shares.plus(delegation.withdrawingShares)
          updateDelegationValue(delegation, basePool)
          delegation.cost = delegation.cost.plus(
            delegation.shares
              .minus(prevShares)
              .times(basePool.sharePrice)
              .round(12),
          )
          delegationMap.set(delegationId, delegation)
        }
        break
      }
      case phalaBasePool.withdrawal.name: {
        const {pid, accountId, amount, shares, burntShares} = args
        let removedShares = shares
        if (burntShares != null) {
          removedShares = shares.plus(burntShares)
        }
        const basePool = assertGet(basePoolMap, pid)
        const delegationId = join(pid, accountId)
        const delegation = assertGet(delegationMap, delegationId)
        basePool.totalShares = basePool.totalShares.minus(removedShares)
        basePool.totalValue = basePool.totalValue.minus(amount)
        updateFreeValue(basePool, basePool.freeValue.minus(amount))
        basePool.withdrawingShares = max(
          basePool.withdrawingShares.minus(removedShares),
          BigDecimal(0),
        )
        basePool.withdrawingValue = basePool.withdrawingShares
          .times(basePool.sharePrice)
          .round(12)
        if (basePool.totalShares.eq(0)) {
          updateSharePrice(basePool) // MEMO: reset share price
        }
        delegation.withdrawingShares =
          delegation.withdrawingShares.minus(removedShares)
        delegation.shares = delegation.shares.minus(removedShares)
        updateDelegationValue(delegation, basePool)
        delegation.cost = delegation.cost.minus(amount)
        if (delegation.withdrawingShares.eq(0)) {
          delegation.withdrawalNft = null
        }
        if (basePool.kind === BasePoolKind.StakePool) {
          const stakePool = assertGet(stakePoolMap, pid)
          updateStakePoolAprMultiplier(basePool, stakePool)
          updateStakePoolDelegable(basePool, stakePool)
        }

        if (basePoolAccountIdMap.has(accountId)) {
          const vaultBasePool = assertGet(basePoolAccountIdMap, accountId)
          updateFreeValue(vaultBasePool, vaultBasePool.freeValue.plus(amount))
        } else {
          // MEMO: exclude vault's withdrawal
          globalState.totalValue = globalState.totalValue.minus(amount)
        }
        break
      }
      case phalaBasePool.withdrawalQueued.name: {
        const {pid, accountId, shares, withdrawingNftId} = args
        const delegationId = join(pid, accountId)
        const basePool = assertGet(basePoolMap, pid)
        const delegation = assertGet(delegationMap, delegationId)
        const stakePool = stakePoolMap.get(pid)
        const prevWithdrawingShares = delegation.withdrawingShares
        basePool.withdrawingShares = basePool.withdrawingShares
          .minus(prevWithdrawingShares)
          .plus(shares)
        basePool.withdrawingValue = basePool.withdrawingShares
          .times(basePool.sharePrice)
          .round(12)
        // Replace previous withdrawal
        delegation.withdrawingShares = shares
        delegation.withdrawalStartTime = blockTime
        if (withdrawingNftId != null) {
          const withdrawalNftId = join(basePool.cid, withdrawingNftId)
          const withdrawalNft =
            nftMap.get(withdrawalNftId) ??
            (await ctx.store.findOneBy(Nft, {id: withdrawalNftId}))
          delegation.withdrawalNft = withdrawalNft
        }

        if (stakePool != null) {
          updateStakePoolDelegable(basePool, stakePool)
        }
        break
      }
      case phalaComputation.sessionBound.name: {
        // Memo: SessionBound happens before PoolWorkerAdded
        const {sessionId, workerId} = args
        let session = sessionMap.get(sessionId)
        const worker = assertGet(workerMap, workerId)
        if (session == null) {
          session = new Session({
            id: sessionId,
            state: WorkerState.Ready,
            v: BigDecimal(0),
            ve: BigDecimal(0),
            pInit: 0,
            pInstant: 0,
            totalReward: BigDecimal(0),
            stake: BigDecimal(0),
            shares: BigDecimal(0),
          })
          sessionMap.set(sessionId, session)
        }
        session.worker = worker
        workerSessionMap.set(workerId, session as Session & {worker: Worker})
        break
      }
      case phalaComputation.sessionUnbound.name: {
        const {sessionId, workerId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.worker.id === workerId)
        session.shares = BigDecimal(0)
        session.worker = null
        workerSessionMap.delete(workerId)
        break
      }
      case phalaComputation.sessionSettled.name: {
        const {sessionId, v, payout} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        session.totalReward = session.totalReward.plus(payout)
        session.v = v
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        const basePool = assertGet(basePoolMap, worker.stakePool.id)
        const stakePool = assertGet(stakePoolMap, worker.stakePool.id)
        const prevShares = session.shares
        updateSessionShares(session, worker)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(session.shares)
          stakePool.idleWorkerShares = stakePool.idleWorkerShares
            .minus(prevShares)
            .plus(session.shares)
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        break
      }
      case phalaComputation.workerStarted.name: {
        const {sessionId, initP, initV} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        const basePool = assertGet(basePoolMap, worker.stakePool.id)
        const stakePool = assertGet(stakePoolMap, worker.stakePool.id)
        stakePool.idleWorkerCount++
        globalState.idleWorkerCount++
        session.pInit = initP
        session.ve = initV
        session.v = initV
        session.state = WorkerState.WorkerIdle
        updateSessionShares(session, worker)
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          session.shares,
        )
        stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
          session.shares,
        )
        updateStakePoolAprMultiplier(basePool, stakePool)
        break
      }
      case phalaComputation.workerStopped.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        const basePool = assertGet(basePoolMap, worker.stakePool.id)
        const stakePool = assertGet(stakePoolMap, worker.stakePool.id)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            session.shares,
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            session.shares,
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
          stakePool.idleWorkerCount--
          globalState.idleWorkerCount--
        }
        session.state = WorkerState.WorkerCoolingDown
        session.coolingDownStartTime = blockTime
        basePool.releasingValue = basePool.releasingValue.plus(session.stake)
        break
      }
      case phalaComputation.workerReclaimed.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        const basePool = assertGet(basePoolMap, worker.stakePool.id)
        basePool.releasingValue = basePool.releasingValue.minus(session.stake)
        basePool.freeValue = basePool.freeValue.plus(session.stake)
        session.state = WorkerState.Ready
        session.coolingDownStartTime = null
        session.stake = BigDecimal(0)
        break
      }
      case phalaComputation.workerEnterUnresponsive.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        const basePool = assertGet(basePoolMap, worker.stakePool.id)
        const stakePool = assertGet(stakePoolMap, worker.stakePool.id)
        if (session.state === WorkerState.WorkerIdle) {
          session.state = WorkerState.WorkerUnresponsive
          stakePool.idleWorkerCount--
          globalState.idleWorkerCount--
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            session.shares,
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            session.shares,
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        break
      }
      case phalaComputation.workerExitUnresponsive.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        const basePool = assertGet(basePoolMap, worker.stakePool.id)
        const stakePool = assertGet(stakePoolMap, worker.stakePool.id)
        if (session.state === WorkerState.WorkerUnresponsive) {
          stakePool.idleWorkerCount++
          globalState.idleWorkerCount++
          globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
            session.shares,
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
            session.shares,
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        session.state = WorkerState.WorkerIdle
        break
      }
      case phalaComputation.benchmarkUpdated.name: {
        const {sessionId, pInstant} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.stakePool)
        session.pInstant = pInstant
        const prevShares = session.shares
        updateSessionShares(session, worker)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(session.shares)
          const basePool = assertGet(basePoolMap, worker.stakePool.id)
          const stakePool = assertGet(stakePoolMap, worker.stakePool.id)
          stakePool.idleWorkerShares = stakePool.idleWorkerShares
            .minus(prevShares)
            .plus(session.shares)
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        break
      }
      case phalaComputation.tokenomicParametersChanged.name: {
        await updateTokenomicParameters(block, globalState)
        break
      }
      case phalaRegistry.workerAdded.name: {
        const {workerId, confidenceLevel} = args
        const worker = new Worker({id: workerId, confidenceLevel})
        workerMap.set(workerId, worker)
        break
      }
      case phalaRegistry.workerUpdated.name: {
        const {workerId, confidenceLevel} = args
        const worker = assertGet(workerMap, workerId)
        worker.confidenceLevel = confidenceLevel
        break
      }
      case phalaRegistry.initialScoreSet.name: {
        const {workerId, initialScore} = args
        const worker = assertGet(workerMap, workerId)
        worker.initialScore = initialScore
        break
      }
      case rmrkCore.nftMinted.name: {
        const {cid, nftId, owner} = args
        const id = join(cid, nftId)
        const nft = new Nft({
          id,
          owner: getAccount(accountMap, owner),
          cid,
          nftId,
          burned: false,
          mintTime: blockTime,
        })
        nftMap.set(id, nft)
        break
      }
      case rmrkCore.nftBurned.name: {
        const {cid, nftId} = args
        const nft = assertGet(nftMap, join(cid, nftId))
        nft.burned = true
        break
      }
    }

    const nextEvent = events[i + 1]
    const isLastEventInHandler = nextEvent == null
    const isLastEventInBlock =
      isLastEventInHandler || block.height !== nextEvent.block.height
    const shouldTakeSnapshot =
      ENABLE_SNAPSHOT &&
      isLastEventInBlock &&
      isSnapshotUpdateNeeded(block, globalState)
    if (shouldTakeSnapshot || isLastEventInHandler) {
      ctx.log.info(`Post update ${block.height}`)
      postUpdate(block, globalState, accountMap, basePoolMap, delegations)
    }
    if (shouldTakeSnapshot) {
      await takeSnapshot(
        ctx,
        block,
        globalState,
        accountMap,
        basePoolMap,
        stakePoolMap,
        workerMap,
        sessionMap,
        delegations,
      )
    }
  }

  if (FORCE_REFRESH_IDENTITY) {
    ctx.log.info('Force refreshing identity')
    await queryIdentities(
      ctx.blocks[ctx.blocks.length - 1].header,
      [...accountMap.keys()],
      accountMap,
    )
    ctx.log.info('Force refreshing identity done')
  } else {
    // MEMO: identity events don't provide specific args, so query it directly
    await queryIdentities(
      ctx.blocks[ctx.blocks.length - 1].header,
      [...identityUpdatedAccountIdSet],
      accountMap,
    )
  }

  ctx.log.info(
    `Saving state from ${ctx.blocks[0].header.height} to ${
      ctx.blocks[ctx.blocks.length - 1].header.height
    }`,
  )
  // MEMO: save session without worker first to prevent duplicate worker
  const sessionsWithWorker: Session[] = []
  const sessionsWithoutWorker: Session[] = []
  for (const session of sessionMap.values()) {
    if (session.worker != null) {
      sessionsWithWorker.push(session)
    } else {
      sessionsWithoutWorker.push(session)
    }
  }
  await save(ctx, [
    globalState,
    accountMap,
    basePoolMap,
    stakePoolMap,
    vaultMap,
    workerMap,
    sessionsWithoutWorker,
    sessionsWithWorker,
    nftMap,
    delegationMap,
    basePoolWhitelistMap,
  ])
})
