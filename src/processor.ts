import {BigDecimal} from '@subsquid/big-decimal'
import {
  BatchContext,
  BatchProcessorItem,
  SubstrateBatchProcessor,
} from '@subsquid/substrate-processor'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import {In} from 'typeorm'
import {
  Account,
  BasePool,
  BasePoolKind,
  GlobalState,
  Session,
  StakePool,
  StakePoolWhitelist,
  TokenomicParameters,
  Vault,
  Worker,
  WorkerState,
} from './model'
import serializeEvents from './serializeEvents'
import {
  combineIds,
  createPool,
  getAccount,
  getStakePool,
  toMap,
  updateWorkerShare,
  updateWorkerSMinAndSMax,
} from './utils/common'

const processor = new SubstrateBatchProcessor()
  .setDataSource({
    archive: 'http://51.210.116.29:4444/graphql',
    chain: 'wss://pc-test-3.phala.network/khala/ws',
  })
  .addEvent('PhalaStakePoolv2.PoolCreated')
  .addEvent('PhalaStakePoolv2.PoolCommissionSet')
  .addEvent('PhalaStakePoolv2.PoolCapacitySet')
  .addEvent('PhalaStakePoolv2.PoolWorkerAdded')
  .addEvent('PhalaStakePoolv2.PoolWorkerRemoved')
  .addEvent('PhalaStakePoolv2.WorkingStarted')
  .addEvent('PhalaStakePoolv2.RewardReceived')
  .addEvent('PhalaStakePoolv2.Contribution')
  .addEvent('PhalaStakePoolv2.Withdrawal')
  .addEvent('PhalaStakePoolv2.WithdrawalQueued')
  .addEvent('PhalaStakePoolv2.WorkerReclaimed')
  .addEvent('PhalaStakePoolv2.PoolWhitelistCreated')
  .addEvent('PhalaStakePoolv2.PoolWhitelistDeleted')
  .addEvent('PhalaStakePoolv2.PoolWhitelistStakerAdded')
  .addEvent('PhalaStakePoolv2.PoolWhitelistStakerRemoved')

  .addEvent('PhalaVault.PoolCreated')
  .addEvent('PhalaVault.VaultCommissionSet')
  .addEvent('PhalaVault.OwnerSharesClaimed')
  .addEvent('PhalaVault.OwnerSharesGained')
  .addEvent('PhalaVault.Contribution')

  .addEvent('PhalaBasePool.Withdrawal')
  .addEvent('PhalaBasePool.WithdrawalQueued')

  .addEvent('PhalaComputation.SessionBound')
  .addEvent('PhalaComputation.SessionUnbound')
  .addEvent('PhalaComputation.SessionSettled')
  .addEvent('PhalaComputation.WorkerStarted')
  .addEvent('PhalaComputation.WorkerStopped')
  .addEvent('PhalaComputation.WorkerReclaimed')
  .addEvent('PhalaComputation.WorkerEnterUnresponsive')
  .addEvent('PhalaComputation.WorkerExitUnresponsive')
  .addEvent('PhalaComputation.BenchmarkUpdated')
  .addEvent('PhalaComputation.TokenomicParametersChanged')

  .addEvent('PhalaRegistry.WorkerAdded')
  .addEvent('PhalaRegistry.WorkerUpdated')
  .addEvent('PhalaRegistry.InitialScoreSet')

  // .addEvent('RmrkCore.CollectionCreated')
  .addEvent('RmrkCore.NftMinted')
  .addEvent('RmrkCore.PropertySet')
  .addEvent('RmrkCore.NFTBurned')

  .addEvent('Identity.IdentitySet')
  .addEvent('Identity.IdentityCleared')
  .addEvent('Identity.JudgementGiven')

type Item = BatchProcessorItem<typeof processor>
export type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
  const events = serializeEvents(ctx)

  const identityUpdatedAccountIdSet = new Set<string>()
  const basePoolIdSet = new Set<string>()
  const basePoolCIdSet = new Set<number>()
  const stakePoolIdSet = new Set<string>()
  const vaultIdSet = new Set<string>()
  const workerIdSet = new Set<string>()
  const sessionIdSet = new Set<string>()
  const stakePoolWhitelistIdSet = new Set<string>()

  for (const {name, args} of events) {
    if (
      name === 'PhalaStakePoolv2.PoolCommissionSet' ||
      name === 'PhalaStakePoolv2.PoolCapacitySet' ||
      name === 'PhalaStakePoolv2.PoolWorkerAdded' ||
      name === 'PhalaStakePoolv2.WorkingStarted' ||
      name === 'PhalaStakePoolv2.RewardReceived' ||
      name === 'PhalaStakePoolv2.Contribution' ||
      name === 'PhalaStakePoolv2.Withdrawal' ||
      name === 'PhalaStakePoolv2.WithdrawalQueued' ||
      name === 'PhalaStakePoolv2.WorkerReclaimed' ||
      name === 'PhalaStakePoolv2.PoolWhitelistCreated' ||
      name === 'PhalaStakePoolv2.PoolWhitelistDeleted' ||
      name === 'PhalaStakePoolv2.PoolWhitelistStakerAdded' ||
      name === 'PhalaStakePoolv2.PoolWhitelistStakerRemoved'
    ) {
      stakePoolIdSet.add(args.pid)
    }

    if (
      name === 'PhalaVault.VaultCommissionSet' ||
      name === 'PhalaVault.OwnerSharesClaimed' ||
      name === 'PhalaVault.OwnerSharesGained' ||
      name === 'PhalaVault.Contribution' ||
      name === 'PhalaBasePool.Withdrawal' ||
      name === 'PhalaBasePool.WithdrawalQueued'
    ) {
      vaultIdSet.add(args.pid)
    }

    if (
      name === 'PhalaStakePoolv2.PoolWorkerAdded' ||
      name === 'PhalaStakePoolv2.PoolWorkerRemoved' ||
      name === 'PhalaStakePoolv2.WorkingStarted' ||
      name === 'PhalaComputation.SessionBound' ||
      name === 'PhalaComputation.SessionUnbound' ||
      name === 'PhalaRegistry.InitialScoreSet' ||
      name === 'PhalaRegistry.WorkerUpdated'
    ) {
      workerIdSet.add(args.workerId)
    }

    if (
      name === 'PhalaComputation.SessionBound' ||
      name === 'PhalaComputation.SessionUnbound' ||
      name === 'PhalaComputation.SessionSettled' ||
      name === 'PhalaComputation.WorkerStarted' ||
      name === 'PhalaComputation.WorkerStopped' ||
      name === 'PhalaComputation.WorkerReclaimed' ||
      name === 'PhalaComputation.WorkerEnterUnresponsive' ||
      name === 'PhalaComputation.WorkerExitUnresponsive' ||
      name === 'PhalaComputation.BenchmarkUpdated'
    ) {
      sessionIdSet.add(args.sessionId)
    }

    if (name === 'PhalaStakePoolv2.PoolWhitelistStakerRemoved') {
      stakePoolWhitelistIdSet.add(combineIds(args.pid, args.accountId))
    }

    if (name === 'RmrkCore.NftMinted') {
      basePoolCIdSet.add(args.collectionId)
    }

    if (
      name === 'Identity.IdentitySet' ||
      name === 'Identity.IdentityCleared' ||
      name === 'Identity.JudgementGiven'
    ) {
      identityUpdatedAccountIdSet.add(args.accountId)
    }
  }
  const globalState = await ctx.store.findOneOrFail(GlobalState, {
    where: {id: '0'},
  })
  const tokenomicParameters = await ctx.store.findOneOrFail(
    TokenomicParameters,
    {where: {id: '0'}}
  )
  const accountMap: Map<string, Account> = await ctx.store
    .find(Account)
    .then(toMap)
  const basePoolMap: Map<string, BasePool> = await ctx.store
    .find(BasePool, {
      where: [{id: In([...basePoolIdSet])}, {cid: In([...basePoolCIdSet])}],
    })
    .then(toMap)
  const stakePoolMap: Map<string, StakePool> = await ctx.store
    .find(StakePool, {
      where: {id: In([...stakePoolIdSet])},
      relations: {basePool: true},
    })
    .then(toMap)
  const vaultMap: Map<string, Vault> = await ctx.store
    .find(Vault, {
      where: {id: In([...vaultIdSet])},
      relations: {basePool: true},
    })
    .then(toMap)
  const workerMap: Map<string, Worker> = await ctx.store
    .find(Worker, {
      where: {id: In([...workerIdSet])},
      relations: {stakePool: true, session: true},
    })
    .then(toMap)
  const sessionMap: Map<string, Session> = await ctx.store
    .find(Session, {
      where: {id: In([...sessionIdSet])},
      relations: {stakePool: true, worker: true},
    })
    .then(toMap)
  const stakePoolWhitelistMap: Map<string, StakePoolWhitelist> = await ctx.store
    .find(StakePoolWhitelist, {
      where: {id: In([...stakePoolWhitelistIdSet])},
      relations: {stakePool: true, account: true},
    })
    .then(toMap)

  for (const {name, args, block} of events) {
    const blockTime = new Date(block.timestamp)
    switch (name) {
      case 'PhalaStakePoolv2.PoolCreated': {
        const {pid, owner} = args
        const ownerAccount = getAccount(accountMap, owner)
        const {stakePool, basePool} = createPool(BasePoolKind.StakePool, {
          pid,
          cid: 1,
          owner: ownerAccount,
        })
        basePoolMap.set(pid, basePool)
        stakePoolMap.set(pid, stakePool)
        await ctx.store.save(ownerAccount)
        await ctx.store.insert(basePool)
        await ctx.store.insert(stakePool)
        break
      }
      case 'PhalaStakePoolv2.PoolCommissionSet': {
        const {pid, commission} = args
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        stakePool.commission = commission
        break
      }
      case 'PhalaStakePoolv2.PoolCapacitySet': {
        const {pid, cap} = args
        const stakePool = stakePoolMap.get(pid)
        const basePool = basePoolMap.get(pid)
        assert(stakePool)
        assert(basePool)
        stakePool.capacity = cap
        stakePool.delegable = stakePool.capacity
          .minus(basePool.totalValue)
          .plus(basePool.totalWithdrawalValue)
        break
      }
      case 'PhalaStakePoolv2.PoolWorkerAdded': {
        const {pid, workerId} = args
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        const worker = workerMap.get(workerId)
        assert(worker?.session) // MEMO: SessionBound happens before PoolWorkerAdded
        const session = sessionMap.get(worker.session.id)
        assert(session)
        stakePool.workerCount++
        worker.stakePool = stakePool
        session.stakePool = stakePool
        break
      }
      case 'PhalaStakePoolv2.PoolWorkerRemoved': {
        const {pid, workerId} = args
        const worker = workerMap.get(workerId)
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        assert(worker?.stakePool?.id === pid)
        worker.stakePool = null
        stakePool.workerCount--
        break
      }
      case 'PhalaStakePoolv2.WorkingStarted': {
        const {pid, workerId, amount} = args
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        const worker = workerMap.get(workerId)
        assert(worker)
        assert(worker.session)
        const session = sessionMap.get(worker.session.id)
        assert(session)
        session.stake = amount
        // stakePool.freeStake = stakePool.freeStake.minus(amount)
        break
      }
      case 'PhalaStakePoolv2.RewardReceived': {
        break
      }
      case 'PhalaStakePoolv2.Contribution': {
        const {pid, accountId, amount, shares} = args
        const account = getAccount(accountMap, accountId)
        const basePool = basePoolMap.get(pid)
        const stakePool = stakePoolMap.get(pid)
        // const stakePoolStakeId = combineIdSet(stakePoolId, accountId)
        // const stakePoolStake = stakePoolStakes.get(stakePoolStakeId)
        assert(basePool)
        assert(stakePool)
        // stakePool.freeStake = stakePool.freeStake.plus(amount)
        basePool.totalShares = basePool.totalShares.plus(shares)
        basePool.totalValue = basePool.totalValue.plus(amount)
        // stakePool.aprBase = stakePool.miningWorkerShare
        //   .times(BigDecimal(1).minus(stakePool.commission))
        //   .div(stakePool.totalStake)
        account.totalStakePoolValue = account.totalStakePoolValue.plus(amount)
        globalState.totalStake = globalState.totalStake.plus(amount)
        if (stakePool.delegable != null) {
          stakePool.delegable = stakePool.delegable.minus(amount)
        }
        // if (stakePoolStake != null) {
        //   if (stakePoolStake.shares.eq(0)) {
        //     stakePool.activeStakeCount++
        //   }
        //   stakePoolStake.shares = stakePoolStake.shares.plus(shares)
        //   stakePoolStake.amount = stakePoolStake.amount.plus(amount)
        // } else {
        //   stakePoolStakes.set(
        //     stakePoolStakeId,
        //     new StakePoolStake({
        //       id: stakePoolStakeId,
        //       stakePool,
        //       account: getAccount(accounts, accountId),
        //       amount,
        //       shares,
        //       reward: BigDecimal(0),
        //       withdrawalAmount: BigDecimal(0),
        //       withdrawalShares: BigDecimal(0),
        //     })
        //   )
        //   stakePool.activeStakeCount++
        // }
        break
      }
      case 'PhalaStakePoolv2.Withdrawal': {
        break
      }
      case 'PhalaStakePoolv2.WithdrawalQueued': {
        break
      }
      case 'PhalaStakePoolv2.WorkerReclaimed': {
        break
      }
      case 'PhalaStakePoolv2.PoolWhitelistCreated': {
        const {pid} = args
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        stakePool.whitelistEnabled = true
        break
      }
      case 'PhalaStakePoolv2.PoolWhitelistDeleted': {
        const {pid} = args
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        stakePool.whitelistEnabled = false
        break
      }
      case 'PhalaStakePoolv2.PoolWhitelistStakerAdded': {
        const {pid, accountId} = args
        const account = getAccount(accountMap, accountId)
        const stakePool = stakePoolMap.get(pid)
        assert(stakePool)
        const id = combineIds(pid, accountId)
        const stakePoolWhitelist = new StakePoolWhitelist({
          id,
          stakePool,
          account,
          createTime: blockTime,
        })
        stakePoolWhitelistMap.set(id, stakePoolWhitelist)
        break
      }
      case 'PhalaStakePoolv2.PoolWhitelistStakerRemoved': {
        const {pid, accountId} = args
        const id = combineIds(pid, accountId)
        const stakePoolWhitelist = stakePoolWhitelistMap.get(id)
        assert(stakePoolWhitelist)
        stakePoolWhitelistMap.delete(id)
        await ctx.store.remove(stakePoolWhitelist)
        break
      }
      case 'PhalaVault.PoolCreated': {
        const {pid, owner, cid, poolAccountId} = args
        const ownerAccount = getAccount(accountMap, owner)
        const {vault, basePool} = createPool(BasePoolKind.Vault, {
          pid,
          cid,
          owner: ownerAccount,
          poolAccountId,
        })
        basePoolMap.set(pid, basePool)
        vaultMap.set(pid, vault)
        await ctx.store.save(ownerAccount)
        await ctx.store.insert(basePool)
        await ctx.store.insert(vault)
        break
      }
      case 'PhalaVault.VaultCommissionSet': {
        const {pid, commission} = args
        const vault = vaultMap.get(pid)
        assert(vault)
        vault.commission = commission
        break
      }
      case 'PhalaVault.OwnerSharesClaimed': {
        break
      }
      case 'PhalaVault.OwnerSharesGained': {
        break
      }
      case 'PhalaVault.Contribution': {
        break
      }
      case 'PhalaBasePool.Withdrawal': {
        break
      }
      case 'PhalaBasePool.WithdrawalQueued': {
        break
      }
      case 'PhalaComputation.SessionBound': {
        // Memo: SessionBound happens before PoolWorkerAdded
        const {sessionId, workerId} = args
        let session = sessionMap.get(sessionId)
        const worker = workerMap.get(workerId)
        assert(worker)
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
      case 'PhalaComputation.SessionUnbound': {
        const {sessionId, workerId} = args
        const session = sessionMap.get(sessionId)
        const worker = workerMap.get(workerId)
        assert(worker)
        assert(session?.worker.id === workerId)
        worker.session = null
        worker.share = null
        session.isBound = false
        break
      }
      case 'PhalaComputation.SessionSettled': {
        const {sessionId, v, payout} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        assert(session.stakePool)
        session.totalReward = session.totalReward.plus(payout)
        session.v = v
        assert(session.worker)
        const worker = workerMap.get(session.worker.id)
        assert(worker)
        assert(worker.share)
        const stakePool = getStakePool(stakePoolMap, session.stakePool)
        const prevShare = worker.share
        updateWorkerShare(worker, session)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShare = globalState.idleWorkerShare
            .minus(prevShare)
            .plus(worker.share)
          stakePool.idleWorkerShare = stakePool.idleWorkerShare
            .minus(prevShare)
            .plus(worker.share)
          // stakePool.aprBase = stakePool.idleWorkerShare
          //   .times(BigDecimal(1).minus(stakePool.commission))
          //   .div(stakePool.totalStake)
        }
        break
      }
      case 'PhalaComputation.WorkerStarted': {
        const {sessionId, initP, initV} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        assert(session.stakePool)
        assert(session.worker)
        const stakePool = getStakePool(stakePoolMap, session.stakePool)
        stakePool.idleWorkerCount++
        session.pInit = initP
        session.ve = initV
        session.v = initV
        session.state = WorkerState.WorkerIdle
        const worker = workerMap.get(session.worker.id)
        assert(worker)
        updateWorkerShare(worker, session)
        globalState.idleWorkerShare = globalState.idleWorkerShare.plus(
          worker.share
        )
        // stakePool.idleWorkerShare = stakePool.idleWorkerShare.plus(
        //   worker.share
        // )
        // stakePool.aprBase = stakePool.idleWorkerShare
        //   .times(BigDecimal(1).minus(stakePool.commission))
        //   .div(stakePool.totalStake)
        break
      }
      case 'PhalaComputation.WorkerStopped': {
        const {sessionId} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        assert(session.worker)
        assert(session.stakePool)
        const stakePool = getStakePool(stakePoolMap, session.stakePool)
        const worker = workerMap.get(session.worker.id)
        assert(worker)
        assert(worker.share)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShare = globalState.idleWorkerShare.minus(
            worker.share
          )
          stakePool.idleWorkerShare = stakePool.idleWorkerShare.minus(
            worker.share
          )
          // stakePool.aprBase = stakePool.idleWorkerShare
          //   .times(BigDecimal(1).minus(stakePool.commission))
          //   .div(stakePool.totalStake)
          stakePool.idleWorkerCount--
        }
        session.state = WorkerState.WorkerCoolingDown
        session.coolingDownStartTime = blockTime
        // stakePool.releasingStake = stakePool.releasingStake.plus(session.stake)
        break
      }
      case 'PhalaComputation.WorkerReclaimed': {
        const {sessionId} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        session.state = WorkerState.Ready
        session.coolingDownStartTime = null
        session.stake = BigDecimal(0)
        break
      }
      case 'PhalaComputation.WorkerEnterUnresponsive': {
        const {sessionId} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        session.state = WorkerState.WorkerUnresponsive
        assert(session.stakePool)
        const stakePool = getStakePool(stakePoolMap, session.stakePool)
        stakePool.idleWorkerCount--
        assert(session.worker)
        const worker = workerMap.get(session.worker.id)
        assert(worker)
        assert(worker.share)
        globalState.idleWorkerShare = globalState.idleWorkerShare.minus(
          worker.share
        )
        stakePool.idleWorkerShare = stakePool.idleWorkerShare.minus(
          worker.share
        )
        // stakePool.aprBase = stakePool.idleWorkerShare
        //   .times(BigDecimal(1).minus(stakePool.commission))
        //   .div(stakePool.totalStake)
        break
      }
      case 'PhalaComputation.WorkerExitUnresponsive': {
        const {sessionId} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        session.state = WorkerState.WorkerIdle
        assert(session.stakePool)
        const stakePool = getStakePool(stakePoolMap, session.stakePool)
        stakePool.idleWorkerCount++
        assert(session.worker)
        const worker = workerMap.get(session.worker.id)
        assert(worker)
        assert(worker.share)
        globalState.idleWorkerShare = globalState.idleWorkerShare.plus(
          worker.share
        )
        stakePool.idleWorkerShare = stakePool.idleWorkerShare.plus(worker.share)
        // stakePool.aprBase = stakePool.idleWorkerShare
        //   .times(BigDecimal(1).minus(stakePool.commission))
        //   .div(stakePool.totalStake)
        break
      }
      case 'PhalaComputation.BenchmarkUpdated': {
        const {sessionId, pInstant} = args
        const session = sessionMap.get(sessionId)
        assert(session)
        session.pInstant = pInstant
        assert(session.worker)
        const worker = workerMap.get(session.worker.id)
        assert(worker)
        assert(worker.share)
        const prevShare = worker.share
        updateWorkerShare(worker, session)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShare = globalState.idleWorkerShare
            .minus(prevShare)
            .plus(worker.share)
          assert(session.stakePool)
          const stakePool = getStakePool(stakePoolMap, session.stakePool)
          stakePool.idleWorkerShare = stakePool.idleWorkerShare
            .minus(prevShare)
            .plus(worker.share)
          // stakePool.aprBase = stakePool.idleWorkerShare
          //   .times(BigDecimal(1).minus(stakePool.commission))
          //   .div(stakePool.totalStake)
        }
        break
      }
      case 'PhalaComputation.TokenomicParametersChanged': {
        break
      }
      case 'PhalaRegistry.WorkerAdded': {
        const {workerId, confidenceLevel} = args
        const worker = new Worker({id: workerId, confidenceLevel})
        updateWorkerSMinAndSMax(worker, tokenomicParameters)
        workerMap.set(workerId, worker)
        await ctx.store.insert(worker)
        break
      }
      case 'PhalaRegistry.WorkerUpdated': {
        const {workerId, confidenceLevel} = args
        const worker = workerMap.get(workerId)
        assert(worker)
        worker.confidenceLevel = confidenceLevel
        updateWorkerSMinAndSMax(worker, tokenomicParameters)
        if (worker.session != null) {
          const session = sessionMap.get(worker.session.id)
          assert(session)
          updateWorkerShare(worker, session)
        }
        break
      }
      case 'PhalaRegistry.InitialScoreSet': {
        const {workerId, initialScore} = args
        const worker = workerMap.get(workerId)
        assert(worker)
        worker.initialScore = initialScore
        updateWorkerSMinAndSMax(worker, tokenomicParameters)
        break
      }
      case 'RmrkCore.NftMinted': {
        const {owner, collectionId, nftId} = args
        break
      }
      case 'RmrkCore.PropertySet': {
        break
      }
      case 'RmrkCore.NFTBurned': {
        break
      }
      case 'Identity.IdentitySet': {
        break
      }
      case 'Identity.IdentityCleared': {
        break
      }
      case 'Identity.JudgementGiven': {
        break
      }
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
  ]) {
    await ctx.store.save(x instanceof Map ? [...x.values()] : x)
  }
})
