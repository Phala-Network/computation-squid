import {BigDecimal} from '@subsquid/big-decimal'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import {In} from 'typeorm'
import {BASE_POOL_ACCOUNT} from './config'
import decodeEvents from './decodeEvents'
import importDump from './importDump'
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
  createPool,
  updateSharePrice,
  updateStakePoolAprMultiplier,
  updateStakePoolDelegable,
} from './utils/basePool'
import {assertGet, getAccount, join, max, toMap} from './utils/common'
import {updateDelegationValue} from './utils/delegation'
import {
  updateAverageBlockTime,
  updateTokenomicParameters,
} from './utils/globalState'
import {queryIdentities} from './utils/identity'
import postUpdate from './utils/postUpdate'
import {updateWorkerShares} from './utils/worker'
import {
  phalaStakePoolv2,
  identity,
  phalaBasePool,
  phalaComputation,
  phalaRegistry,
  phalaVault,
  rmrkCore,
} from './types/events'

processor.run(new TypeormDatabase(), async (ctx) => {
  if ((await ctx.store.get(GlobalState, '0')) == null) {
    ctx.log.info('Importing dump')
    await importDump(ctx)
    ctx.log.info('Dump imported')
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

    if (
      name === rmrkCore.nftBurned.name
      // || name === RmrkCore.PropertySet.name
    ) {
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
  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})
  const accountMap: Map<string, Account> = await ctx.store
    .find(Account)
    .then(toMap)
  const sessionMap = await ctx.store
    .find(Session, {
      where: [
        {id: In([...sessionIdSet])},
        {worker: {id: In([...workerIdSet])}},
      ],
      relations: {stakePool: true, worker: true},
    })
    .then(toMap)
  for (const {stakePool} of sessionMap.values()) {
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
  const workerMap = await ctx.store
    .find(Worker, {
      where: [
        {id: In([...workerIdSet])},
        {session: {id: In([...sessionIdSet])}},
      ],
      relations: {stakePool: true, session: true},
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

  // const delegationWithdrawalNftIdMap = toMap(
  //   delegations.filter((d) => d.withdrawalNft != null),
  //   (d) => (d.withdrawalNft as Nft).id
  // )
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

  let processedBlockHeight = events[0].block.height
  const sharePriceResetQueue: BasePool[] = []

  for (const {name, args, block} of events) {
    assert(block.timestamp)
    const blockTime = new Date(block.timestamp)
    const blockHeight = block.height
    // MEMO: reset share price after all events in a block are processed
    if (blockHeight > processedBlockHeight) {
      while (sharePriceResetQueue.length > 0) {
        const basePool = sharePriceResetQueue.pop()
        assert(basePool)
        updateSharePrice(basePool)
      }
      processedBlockHeight = blockHeight
    }

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
        await ctx.store.save(ownerAccount)
        await ctx.store.insert(poolAccount)
        await ctx.store.insert(basePool)
        await ctx.store.insert(stakePool)
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
        assert(worker.session) // MEMO: SessionBound happens before PoolWorkerAdded
        const session = assertGet(sessionMap, worker.session.id)
        stakePool.workerCount++
        globalState.workerCount++
        worker.stakePool = stakePool
        session.stakePool = stakePool
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
        const worker = assertGet(workerMap, workerId)
        assert(worker.session)
        const session = assertGet(sessionMap, worker.session.id)
        session.stake = amount
        basePool.freeValue = basePool.freeValue.minus(amount)
        break
      }
      case phalaStakePoolv2.rewardReceived.name: {
        const {pid, toOwner, toStakers} = args
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        const owner = assertGet(accountMap, basePool.owner.id)
        stakePool.ownerReward = stakePool.ownerReward.plus(toOwner)
        basePool.totalValue = basePool.totalValue.plus(toStakers)
        basePool.freeValue = basePool.freeValue.plus(toStakers)
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
          vaultBasePool.freeValue = vaultBasePool.freeValue.minus(amount)
        }
        updateStakePoolDelegable(basePool, stakePool)
        break
      }
      case phalaStakePoolv2.workerReclaimed.name: {
        const {pid, workerId} = args
        const basePool = assertGet(basePoolMap, pid)
        const worker = assertGet(workerMap, workerId)
        assert(worker.session)
        const session = assertGet(sessionMap, worker.session.id)
        basePool.releasingValue = basePool.releasingValue.minus(session.stake)
        basePool.freeValue = basePool.freeValue.plus(session.stake)
        session.state = WorkerState.Ready
        session.coolingDownStartTime = null
        session.stake = BigDecimal(0)
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
        await ctx.store.insert(poolAccount)
        await ctx.store.save(ownerAccount)
        await ctx.store.insert(basePool)
        await ctx.store.insert(vault)
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
        const rewards = shares.times(basePool.sharePrice).round(12, 0)
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
            delegation.shares.minus(prevShares).times(basePool.sharePrice),
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
        basePool.freeValue = basePool.freeValue.minus(amount)
        basePool.withdrawingShares = max(
          basePool.withdrawingShares.minus(removedShares),
          BigDecimal(0),
        )
        basePool.withdrawingValue = basePool.withdrawingShares
          .times(basePool.sharePrice)
          .round(12, 0)
        if (basePool.totalShares.eq(0)) {
          sharePriceResetQueue.push(basePool)
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
          vaultBasePool.freeValue = vaultBasePool.freeValue.plus(amount)
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
          .round(12, 0)
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
            isBound: true,
            state: WorkerState.Ready,
            v: BigDecimal(0),
            ve: BigDecimal(0),
            pInit: 0,
            pInstant: 0,
            totalReward: BigDecimal(0),
            stake: BigDecimal(0),
          })
          sessionMap.set(sessionId, session)
        }
        session.isBound = true
        session.worker = worker
        worker.session = session
        break
      }
      case phalaComputation.sessionUnbound.name: {
        const {sessionId, workerId} = args
        const session = assertGet(sessionMap, sessionId)
        const worker = assertGet(workerMap, workerId)
        assert(session.worker)
        assert(session.worker.id === workerId)
        worker.session = null
        worker.shares = null
        session.isBound = false
        break
      }
      case phalaComputation.sessionSettled.name: {
        const {sessionId, v, payout} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        session.totalReward = session.totalReward.plus(payout)
        session.v = v
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        const prevShares = worker.shares
        updateWorkerShares(worker, session)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(worker.shares)
          stakePool.idleWorkerShares = stakePool.idleWorkerShares
            .minus(prevShares)
            .plus(worker.shares)
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        break
      }
      case phalaComputation.workerStarted.name: {
        const {sessionId, initP, initV} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        stakePool.idleWorkerCount++
        globalState.idleWorkerCount++
        session.pInit = initP
        session.ve = initV
        session.v = initV
        session.state = WorkerState.WorkerIdle
        const worker = assertGet(workerMap, session.worker.id)
        updateWorkerShares(worker, session)
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares,
        )
        stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
          worker.shares,
        )
        updateStakePoolAprMultiplier(basePool, stakePool)
        break
      }
      case phalaComputation.workerStopped.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            worker.shares,
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            worker.shares,
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
      case phalaComputation.workerEnterUnresponsive.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        if (session.state === WorkerState.WorkerIdle) {
          session.state = WorkerState.WorkerUnresponsive
          stakePool.idleWorkerCount--
          globalState.idleWorkerCount--
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            worker.shares,
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            worker.shares,
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        break
      }
      case phalaComputation.workerExitUnresponsive.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        if (session.state === WorkerState.WorkerUnresponsive) {
          stakePool.idleWorkerCount++
          globalState.idleWorkerCount++
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
            worker.shares,
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
            worker.shares,
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        session.state = WorkerState.WorkerIdle
        break
      }
      case phalaComputation.benchmarkUpdated.name: {
        const {sessionId, pInstant} = args
        const session = assertGet(sessionMap, sessionId)
        session.pInstant = pInstant
        assert(session.worker)
        assert(session.stakePool)
        const worker = assertGet(workerMap, session.worker.id)
        const prevShares = worker.shares ?? BigDecimal(0)
        updateWorkerShares(worker, session)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(worker.shares)
          const basePool = assertGet(basePoolMap, session.stakePool.id)
          const stakePool = assertGet(stakePoolMap, session.stakePool.id)
          stakePool.idleWorkerShares = stakePool.idleWorkerShares
            .minus(prevShares)
            .plus(worker.shares)
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
        await ctx.store.insert(worker)
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
      // case RmrkCore.PropertySet.name: {
      //   break
      // }
      case rmrkCore.nftBurned.name: {
        const {cid, nftId} = args
        const nft = assertGet(nftMap, join(cid, nftId))
        nft.burned = true
        break
      }
    }
    updateAverageBlockTime(block, globalState)
  }

  if (process.env.REFRESH_IDENTITY === '1') {
    await queryIdentities(
      ctx.blocks[ctx.blocks.length - 1].header,
      [...accountMap.keys()],
      accountMap,
    )
  } else {
    // MEMO: identity events don't provide specific args, so query it directly
    await queryIdentities(
      ctx.blocks[ctx.blocks.length - 1].header,
      [...identityUpdatedAccountIdSet],
      accountMap,
    )
  }

  await postUpdate(
    ctx,
    globalState,
    accountMap,
    basePools,
    stakePoolMap,
    delegations,
  )

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
  ]) {
    if (x instanceof Map) {
      await ctx.store.save([...x.values()])
    } else {
      await ctx.store.save(x)
    }
  }
})
