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
  BasePoolWhitelist,
  Delegation,
  DelegationNft,
  GlobalState,
  Session,
  StakePool,
  TokenomicParameters,
  Vault,
  Worker,
  WorkerState,
} from './model'
import decodeEvents from './decodeEvents'
import {createPool, updateSharePrice} from './utils/basePool'
import {assertGet, combineIds, getAccount, toMap} from './utils/common'
import {queryIdentities} from './utils/identity'
import {updateWorkerShares, updateWorkerSMinAndSMax} from './utils/worker'

const processor = new SubstrateBatchProcessor()
  .setDataSource({
    archive: 'http://localhost:4444/graphql',
    chain: 'ws://localhost:49944',
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

  .addEvent('PhalaVault.PoolCreated')
  .addEvent('PhalaVault.VaultCommissionSet')
  .addEvent('PhalaVault.OwnerSharesGained')
  .addEvent('PhalaVault.OwnerSharesClaimed')
  .addEvent('PhalaVault.Contribution')

  .addEvent('PhalaBasePool.Withdrawal')
  .addEvent('PhalaBasePool.WithdrawalQueued')
  .addEvent('PhalaBasePool.PoolWhitelistCreated')
  .addEvent('PhalaBasePool.PoolWhitelistDeleted')
  .addEvent('PhalaBasePool.PoolWhitelistStakerAdded')
  .addEvent('PhalaBasePool.PoolWhitelistStakerRemoved')

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

  .addEvent('RmrkCore.NftMinted')
  .addEvent('RmrkCore.PropertySet')
  .addEvent('RmrkCore.NFTBurned')

  .addEvent('Identity.IdentitySet')
  .addEvent('Identity.IdentityCleared')
  .addEvent('Identity.JudgementGiven')

type Item = BatchProcessorItem<typeof processor>
export type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
  const events = decodeEvents(ctx)

  const identityUpdatedAccountIdSet = new Set<string>()
  const basePoolIdSet = new Set<string>()
  const basePoolCidSet = new Set<number>()
  const stakePoolIdSet = new Set<string>()
  const vaultIdSet = new Set<string>()
  const workerIdSet = new Set<string>()
  const sessionIdSet = new Set<string>()
  const delegationIdSet = new Set<string>()
  const delegationNftIdSet = new Set<string>()
  const basePoolWhitelistIdSet = new Set<string>()

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
      name === 'PhalaStakePoolv2.WorkerReclaimed'
    ) {
      basePoolIdSet.add(args.pid)
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
      basePoolIdSet.add(args.pid)
      vaultIdSet.add(args.pid)
    }

    if (
      name === 'PhalaBasePool.PoolWhitelistCreated' ||
      name === 'PhalaBasePool.PoolWhitelistDeleted' ||
      name === 'PhalaBasePool.PoolWhitelistStakerAdded' ||
      name === 'PhalaBasePool.PoolWhitelistStakerRemoved'
    ) {
      basePoolIdSet.add(args.pid)
    }

    if (
      name === 'PhalaStakePoolv2.Contribution' ||
      name === 'PhalaStakePoolv2.Withdrawal' ||
      name === 'PhalaStakePoolv2.WithdrawalQueued' ||
      name === 'PhalaVault.Contribution' ||
      name === 'PhalaBasePool.Withdrawal' ||
      name === 'PhalaBasePool.WithdrawalQueued'
    ) {
      delegationIdSet.add(combineIds(args.pid, args.accountId))
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

    if (name === 'PhalaBasePool.PoolWhitelistStakerRemoved') {
      basePoolWhitelistIdSet.add(combineIds(args.pid, args.accountId))
    }

    if (name === 'RmrkCore.NftMinted') {
      basePoolCidSet.add(args.collectionId)
    }

    if (name === 'RmrkCore.NFTBurned' || name === 'RmrkCore.PropertySet') {
      delegationNftIdSet.add(combineIds(args.collectionId, args.nftId))
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
    .find(Account, {relations: {vault: true}})
    .then(toMap)
  const sessionMap = await ctx.store
    .find(Session, {
      where: {id: In([...sessionIdSet])},
      relations: {stakePool: {basePool: true}, worker: true},
    })
    .then(toMap)
  for (const {stakePool} of sessionMap.values()) {
    basePoolIdSet.add(stakePool.id)
    stakePoolIdSet.add(stakePool.id)
  }
  const basePools = await ctx.store.find(BasePool, {
    where: [{id: In([...basePoolIdSet])}, {cid: In([...basePoolCidSet])}],
  })
  const basePoolMap = toMap(basePools)
  const basePoolCidMap = toMap(basePools, 'cid')
  const stakePoolMap = await ctx.store
    .find(StakePool, {
      where: {id: In([...stakePoolIdSet])},
      relations: {basePool: {owner: true}},
    })
    .then(toMap)
  const vaultMap = await ctx.store
    .find(Vault, {
      where: {id: In([...vaultIdSet])},
      relations: {basePool: {owner: true}},
    })
    .then(toMap)
  const workerMap = await ctx.store
    .find(Worker, {
      where: {id: In([...workerIdSet])},
      relations: {stakePool: true, session: true},
    })
    .then(toMap)
  const delegationMap = await ctx.store
    .find(Delegation, {
      where: {id: In([...delegationIdSet])},
      relations: {
        account: true,
        basePool: true,
        delegationNft: true,
        withdrawalNft: true,
      },
    })
    .then(toMap)
  const delegationNftMap = await ctx.store
    .find(DelegationNft, {
      where: {id: In([...delegationNftIdSet])},
      relations: {owner: true},
    })
    .then(toMap)
  const basePoolWhitelistMap = await ctx.store
    .find(BasePoolWhitelist, {
      where: {id: In([...basePoolWhitelistIdSet])},
    })
    .then(toMap)

  for (const {name, args, block} of events) {
    const blockTime = new Date(block.timestamp)
    switch (name) {
      case 'PhalaStakePoolv2.PoolCreated': {
        const {pid, owner, cid} = args
        const ownerAccount = getAccount(accountMap, owner)
        const {stakePool, basePool} = createPool(BasePoolKind.StakePool, {
          pid,
          cid,
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
        const basePool = assertGet(basePoolMap, pid)
        basePool.commission = commission
        break
      }
      case 'PhalaStakePoolv2.PoolCapacitySet': {
        const {pid, cap} = args
        const stakePool = assertGet(stakePoolMap, pid)
        const basePool = assertGet(basePoolMap, pid)
        stakePool.capacity = cap
        stakePool.delegable = stakePool.capacity
          .minus(basePool.totalValue)
          .plus(basePool.withdrawalValue)
        break
      }
      case 'PhalaStakePoolv2.PoolWorkerAdded': {
        const {pid, workerId} = args
        const stakePool = assertGet(stakePoolMap, pid)
        const worker = assertGet(workerMap, workerId)
        assert(worker.session) // MEMO: SessionBound happens before PoolWorkerAdded
        const session = assertGet(sessionMap, worker.session.id)
        stakePool.workerCount++
        worker.stakePool = stakePool
        session.stakePool = stakePool
        break
      }
      case 'PhalaStakePoolv2.PoolWorkerRemoved': {
        const {pid, workerId} = args
        const worker = assertGet(workerMap, workerId)
        const stakePool = assertGet(stakePoolMap, pid)
        assert(worker.stakePool?.id === pid)
        worker.stakePool = null
        stakePool.workerCount--
        break
      }
      case 'PhalaStakePoolv2.WorkingStarted': {
        const {pid, workerId, amount} = args
        const basePool = assertGet(basePoolMap, pid)
        const worker = assertGet(workerMap, workerId)
        assert(worker.session)
        const session = assertGet(sessionMap, worker.session.id)
        session.stake = amount
        basePool.freeValue = basePool.freeValue.minus(amount)
        break
      }
      case 'PhalaStakePoolv2.RewardReceived': {
        const {pid, toOwner, toStakers} = args
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        stakePool.ownerReward = stakePool.ownerReward.plus(toOwner)
        basePool.totalValue = basePool.totalValue.plus(toStakers)
        globalState.stakePoolValue = globalState.stakePoolValue.plus(toStakers)
        globalState.totalValue = globalState.totalValue.plus(toStakers)
        updateSharePrice(basePool)
        break
      }
      case 'PhalaStakePoolv2.Contribution': {
        const {pid, accountId, amount, shares} = args
        const account = getAccount(accountMap, accountId)
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        const delegationId = combineIds(pid, accountId)
        const delegation = delegationMap.get(delegationId)
        basePool.freeValue = basePool.freeValue.plus(amount)
        basePool.totalShares = basePool.totalShares.plus(shares)
        basePool.totalValue = basePool.totalValue.plus(amount)
        updateSharePrice(basePool)
        stakePool.aprMultiplier = stakePool.idleWorkerShares
          .times(BigDecimal(1).minus(basePool.commission))
          .div(basePool.totalValue)
        account.stakePoolValue = account.stakePoolValue.plus(amount)
        globalState.stakePoolValue = globalState.stakePoolValue.plus(amount)
        if (account.vault == null) {
          globalState.totalValue = globalState.totalValue.plus(amount)
        }
        if (stakePool.delegable != null) {
          stakePool.delegable = stakePool.delegable.minus(amount)
        }
        if (delegation == null) {
          delegationMap.set(
            delegationId,
            new Delegation({
              id: delegationId,
              basePool,
              account: getAccount(accountMap, accountId),
              // value: amount,
              shares,
              withdrawalShares: BigDecimal(0),
            })
          )
          basePool.delegatorCount++
        } else {
          if (delegation.shares.eq(0)) {
            basePool.delegatorCount++
          }
          delegation.shares = delegation.shares.plus(shares)
          // delegation.value = delegation.value.plus(amount)
        }
        break
      }
      case 'PhalaStakePoolv2.Withdrawal': {
        const {pid, accountId, amount, shares} = args
        const account = getAccount(accountMap, accountId)
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        const delegationId = combineIds(pid, accountId)
        const delegation = assertGet(delegationMap, delegationId)
        account.stakePoolValue = account.stakePoolValue.minus(amount)
        globalState.stakePoolValue = globalState.stakePoolValue.minus(amount)
        basePool.totalShares = basePool.totalShares.minus(shares)
        basePool.totalValue = basePool.totalValue.minus(amount)
        updateSharePrice(basePool)
        stakePool.aprMultiplier = basePool.totalValue.eq(0)
          ? BigDecimal(0)
          : stakePool.idleWorkerShares
              .times(BigDecimal(1).minus(basePool.commission))
              .div(basePool.totalValue)
        basePool.freeValue = basePool.freeValue.minus(amount)
        delegation.shares = delegation.shares.minus(shares)
        // delegation.value = delegation.value.minus(amount)
        if (delegation.shares.eq(0)) {
          basePool.delegatorCount--
        }
        if (basePool.withdrawalValue.gt(0)) {
          basePool.withdrawalValue = basePool.withdrawalValue.minus(amount)
        }
        if (stakePool.capacity != null) {
          stakePool.delegable = stakePool.capacity
            .minus(basePool.totalValue)
            .plus(basePool.withdrawalValue)
        }
        if (delegation.withdrawalShares.gt(0)) {
          delegation.withdrawalShares =
            delegation.withdrawalShares.minus(shares)
        }
        // if (delegation.withdrawalValue.gt(0)) {
        //   delegation.withdrawalValue = delegation.withdrawalValue.minus(amount)
        // }
        break
      }
      case 'PhalaStakePoolv2.WithdrawalQueued': {
        const {pid, accountId, shares} = args
        const delegationId = combineIds(pid, accountId)
        // const basePool = assertGet(basePoolMap, pid)
        // const stakePool = assertGet(stakePoolMap, pid)
        const delegation = assertGet(delegationMap, delegationId)
        // const {totalShares, totalValue} = basePool
        // const amount = shares.div(totalShares).times(totalValue).round(12, 0)
        // Replace previous withdrawal
        // stakePool.withdrawalValue = stakePool.withdrawalValue.minus(
        //   delegation.withdrawalValue
        // )
        delegation.withdrawalShares = shares
        // delegation.withdrawalValue = amount
        delegation.withdrawalStartTime = blockTime
        // stakePool.withdrawalValue = stakePool.withdrawalValue.plus(amount)
        // if (stakePool.capacity != null) {
        //   stakePool.delegable = stakePool.capacity
        //     .minus(stakePool.totalValue)
        //     .plus(stakePool.withdrawalValue)
        // }
        break
      }
      case 'PhalaStakePoolv2.WorkerReclaimed': {
        // const {pid, workerId} = args
        // const stakePool = stakePoolMap.get(pid)
        // const worker = workerMap.get(workerId)
        // assert(worker)
        // basePool.releasingValue = basePool.releasingValue.minus(worker.session.s)
        // stakePool.freeValue = stakePool.freeValue.plus(amount)
        break
      }
      case 'PhalaBasePool.PoolWhitelistCreated': {
        const {pid} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.whitelistEnabled = true
        break
      }
      case 'PhalaBasePool.PoolWhitelistDeleted': {
        const {pid} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.whitelistEnabled = false
        break
      }
      case 'PhalaBasePool.PoolWhitelistStakerAdded': {
        const {pid, accountId} = args
        const account = getAccount(accountMap, accountId)
        const basePool = assertGet(basePoolMap, pid)
        const id = combineIds(pid, accountId)
        const basePoolWhitelist = new BasePoolWhitelist({
          id,
          basePool,
          account,
          createTime: blockTime,
        })
        basePoolWhitelistMap.set(id, basePoolWhitelist)
        break
      }
      case 'PhalaBasePool.PoolWhitelistStakerRemoved': {
        const {pid, accountId} = args
        const id = combineIds(pid, accountId)
        const basePoolWhitelist = assertGet(basePoolWhitelistMap, id)
        basePoolWhitelistMap.delete(id)
        await ctx.store.remove(basePoolWhitelist)
        break
      }
      case 'PhalaVault.PoolCreated': {
        const {pid, owner, cid, poolAccountId} = args
        const poolAccount = getAccount(accountMap, poolAccountId)
        const ownerAccount = getAccount(accountMap, owner)
        const {vault, basePool} = createPool(BasePoolKind.Vault, {
          pid,
          cid,
          owner: ownerAccount,
          poolAccount,
        })
        basePoolMap.set(pid, basePool)
        vaultMap.set(pid, vault)
        await ctx.store.insert(poolAccount)
        await ctx.store.save(ownerAccount)
        await ctx.store.insert(basePool)
        await ctx.store.insert(vault)
        break
      }
      case 'PhalaVault.VaultCommissionSet': {
        const {pid, commission} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.commission = commission
        break
      }
      case 'PhalaVault.OwnerSharesGained': {
        const {pid, shares} = args
        const basePool = assertGet(basePoolMap, pid)
        const vault = assertGet(vaultMap, pid)
        basePool.totalShares = basePool.totalShares.plus(shares)
        updateSharePrice(basePool)
        vault.claimableOwnerShares = vault.claimableOwnerShares.plus(shares)
        break
      }
      case 'PhalaVault.OwnerSharesClaimed': {
        const {pid, accountId, shares} = args
        // const account = getAccount(accountMap, accountId)
        const basePool = assertGet(basePoolMap, pid)
        const delegationId = combineIds(pid, accountId)
        const delegation = delegationMap.get(delegationId)
        // account.vaultValue = account.vaultValue.plus(amount)
        if (delegation == null) {
          delegationMap.set(
            delegationId,
            new Delegation({
              id: delegationId,
              basePool,
              account: getAccount(accountMap, accountId),
              // value: amount,
              shares,
              // withdrawalValue: BigDecimal(0),
              withdrawalShares: BigDecimal(0),
            })
          )
          basePool.delegatorCount++
        } else {
          if (delegation.shares.eq(0)) {
            basePool.delegatorCount++
          }
          delegation.shares = delegation.shares.plus(shares)
          // delegation.value = delegation.value.plus(amount)
        }
        break
      }
      case 'PhalaVault.Contribution': {
        const {pid, accountId, amount, shares} = args
        const account = getAccount(accountMap, accountId)
        const basePool = assertGet(basePoolMap, pid)
        // const vault = assertGet(vaultMap, pid)
        const delegationId = combineIds(pid, accountId)
        const delegation = delegationMap.get(delegationId)
        basePool.freeValue = basePool.freeValue.plus(amount)
        basePool.totalShares = basePool.totalShares.plus(shares)
        basePool.totalValue = basePool.totalValue.plus(amount)
        updateSharePrice(basePool)
        // TODO: update vault apr
        account.vaultValue = account.vaultValue.plus(amount)
        globalState.vaultValue = globalState.vaultValue.plus(amount)
        globalState.totalValue = globalState.totalValue.plus(amount)
        if (delegation == null) {
          delegationMap.set(
            delegationId,
            new Delegation({
              id: delegationId,
              basePool,
              account: getAccount(accountMap, accountId),
              // value: amount,
              shares,
              // withdrawalValue: BigDecimal(0),
              withdrawalShares: BigDecimal(0),
            })
          )
          basePool.delegatorCount++
        } else {
          if (delegation.shares.eq(0)) {
            basePool.delegatorCount++
          }
          delegation.shares = delegation.shares.plus(shares)
          // delegation.value = delegation.value.plus(amount)
        }
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
      case 'PhalaComputation.SessionUnbound': {
        const {sessionId, workerId} = args
        const session = assertGet(sessionMap, sessionId)
        const worker = assertGet(workerMap, workerId)
        assert(session.worker.id === workerId)
        worker.session = null
        worker.shares = null
        session.isBound = false
        break
      }
      case 'PhalaComputation.SessionSettled': {
        const {sessionId, v, payout} = args
        const session = assertGet(sessionMap, sessionId)
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
          stakePool.aprMultiplier = stakePool.idleWorkerShares
            .times(BigDecimal(1).minus(basePool.commission))
            .div(basePool.totalValue)
        }
        break
      }
      case 'PhalaComputation.WorkerStarted': {
        const {sessionId, initP, initV} = args
        const session = assertGet(sessionMap, sessionId)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        stakePool.idleWorkerCount++
        session.pInit = initP
        session.ve = initV
        session.v = initV
        session.state = WorkerState.WorkerIdle
        const worker = assertGet(workerMap, session.worker.id)
        updateWorkerShares(worker, session)
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares
        )
        stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
          worker.shares
        )
        stakePool.aprMultiplier = stakePool.idleWorkerShares
          .times(BigDecimal(1).minus(basePool.commission))
          .div(basePool.totalValue)
        break
      }
      case 'PhalaComputation.WorkerStopped': {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            worker.shares
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            worker.shares
          )
          stakePool.aprMultiplier = stakePool.idleWorkerShares
            .times(BigDecimal(1).minus(basePool.commission))
            .div(basePool.totalValue)
          stakePool.idleWorkerCount--
        }
        session.state = WorkerState.WorkerCoolingDown
        session.coolingDownStartTime = blockTime
        basePool.releasingValue = basePool.releasingValue.plus(session.stake)
        break
      }
      case 'PhalaComputation.WorkerReclaimed': {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        session.state = WorkerState.Ready
        session.coolingDownStartTime = null
        session.stake = BigDecimal(0)
        break
      }
      case 'PhalaComputation.WorkerEnterUnresponsive': {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        session.state = WorkerState.WorkerUnresponsive
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        stakePool.idleWorkerCount--
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
          worker.shares
        )
        stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
          worker.shares
        )
        stakePool.aprMultiplier = stakePool.idleWorkerShares
          .times(BigDecimal(1).minus(basePool.commission))
          .div(basePool.totalValue)
        break
      }
      case 'PhalaComputation.WorkerExitUnresponsive': {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        session.state = WorkerState.WorkerIdle
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        stakePool.idleWorkerCount++
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares
        )
        stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
          worker.shares
        )
        stakePool.aprMultiplier = stakePool.idleWorkerShares
          .times(BigDecimal(1).minus(basePool.commission))
          .div(basePool.totalValue)
        break
      }
      case 'PhalaComputation.BenchmarkUpdated': {
        const {sessionId, pInstant} = args
        const session = assertGet(sessionMap, sessionId)
        session.pInstant = pInstant
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        const prevShares = worker.shares
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
          stakePool.aprMultiplier = stakePool.idleWorkerShares
            .times(BigDecimal(1).minus(basePool.commission))
            .div(basePool.totalValue)
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
        const worker = assertGet(workerMap, workerId)
        worker.confidenceLevel = confidenceLevel
        updateWorkerSMinAndSMax(worker, tokenomicParameters)
        if (worker.session != null) {
          const session = assertGet(sessionMap, worker.session.id)
          updateWorkerShares(worker, session)
        }
        break
      }
      case 'PhalaRegistry.InitialScoreSet': {
        const {workerId, initialScore} = args
        const worker = assertGet(workerMap, workerId)
        worker.initialScore = initialScore
        updateWorkerSMinAndSMax(worker, tokenomicParameters)
        break
      }
      case 'RmrkCore.NftMinted': {
        const {owner, collectionId, nftId} = args
        const ownerAccount = getAccount(accountMap, owner)
        const basePool = basePoolCidMap.get(collectionId)
        // MEMO: not a delegation NFT
        if (basePool == null) {
          break
        }
        const id = combineIds(collectionId, nftId)
        const delegationNft = new DelegationNft({
          id,
          owner: ownerAccount,
          collectionId,
          nftId,
        })
        delegationNftMap.set(id, delegationNft)
        await ctx.store.insert(delegationNft)
        const delegationId = combineIds(basePool.id, owner)
        const delegation = assertGet(delegationMap, delegationId)
        delegation.delegationNft = delegationNft
        if (basePool.kind === BasePoolKind.StakePool) {
          ownerAccount.stakePoolNftCount++
        }
        if (basePool.kind === BasePoolKind.Vault) {
          ownerAccount.vaultNftCount++
        }
        break
      }
      case 'RmrkCore.PropertySet': {
        break
      }
      case 'RmrkCore.NFTBurned': {
        const {collectionId, nftId, owner} = args
        const id = combineIds(collectionId, nftId)
        const delegationNft = delegationNftMap.get(id)
        if (delegationNft != null) {
          delegationNftMap.delete(id)
          await ctx.store.remove(delegationNft)
          const ownerAccount = getAccount(accountMap, owner)
          const basePool = assertGet(basePoolCidMap, collectionId)
          const delegationId = combineIds(basePool.id, owner)
          const delegation = assertGet(delegationMap, delegationId)
          delegation.delegationNft = null
          if (basePool.kind === BasePoolKind.StakePool) {
            ownerAccount.stakePoolNftCount--
          }
          if (basePool.kind === BasePoolKind.Vault) {
            ownerAccount.vaultNftCount--
          }
        }
        break
      }
    }
  }

  // MEMO: identity events don't provide specific args, so query it directly
  await queryIdentities(ctx, [...identityUpdatedAccountIdSet], accountMap)

  for (const x of [
    globalState,
    accountMap,
    basePoolMap,
    stakePoolMap,
    vaultMap,
    sessionMap,
    workerMap,
    delegationNftMap,
    basePoolWhitelistMap,
  ]) {
    if (x instanceof Map) {
      await ctx.store.save([...x.values()])
    } else {
      await ctx.store.save(x)
    }
  }
})
