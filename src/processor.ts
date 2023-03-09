import {BigDecimal} from '@subsquid/big-decimal'
import {
  SubstrateBatchProcessor,
  type BatchContext,
  type BatchProcessorItem,
} from '@subsquid/substrate-processor'
import {TypeormDatabase, type Store} from '@subsquid/typeorm-store'
import assert from 'assert'
import {In} from 'typeorm'
import config, {BASE_POOL_ACCOUNT} from './config'
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
import {
  createPool,
  updateGlobalAverageAprMultiplier,
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

const processor = new SubstrateBatchProcessor()
  .setDataSource(config.dataSource)
  .setBlockRange(config.blockRange)

  .addEvent('PhalaStakePoolv2.PoolCreated')
  .addEvent('PhalaStakePoolv2.PoolCommissionSet')
  .addEvent('PhalaStakePoolv2.PoolCapacitySet')
  .addEvent('PhalaStakePoolv2.PoolWorkerAdded')
  .addEvent('PhalaStakePoolv2.PoolWorkerRemoved')
  .addEvent('PhalaStakePoolv2.WorkingStarted')
  .addEvent('PhalaStakePoolv2.RewardReceived')
  .addEvent('PhalaStakePoolv2.OwnerRewardsWithdrawn')
  .addEvent('PhalaStakePoolv2.Contribution')
  .addEvent('PhalaStakePoolv2.WorkerReclaimed')

  .addEvent('PhalaVault.PoolCreated')
  .addEvent('PhalaVault.VaultCommissionSet')
  .addEvent('PhalaVault.OwnerSharesGained')
  .addEvent('PhalaVault.OwnerSharesClaimed')
  .addEvent('PhalaVault.Contribution')

  .addEvent('PhalaBasePool.NftCreated')
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
  // .addEvent('RmrkCore.PropertySet')
  .addEvent('RmrkCore.NFTBurned')

  .addEvent('Identity.IdentitySet')
  .addEvent('Identity.IdentityCleared')
  .addEvent('Identity.JudgementGiven')

type Item = BatchProcessorItem<typeof processor>
export type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
  if ((await ctx.store.get(GlobalState, '0')) == null) {
    ctx.log.info('Importing dump...')
    await importDump(ctx)
    ctx.log.info('Dump imported')
  }
  const events = decodeEvents(ctx)

  const identityUpdatedAccountIdSet = new Set<string>()
  const basePoolIdSet = new Set<string>()
  const workerIdSet = new Set<string>()
  const sessionIdSet = new Set<string>()
  const delegationIdSet = new Set<string>()
  const nftIdSet = new Set<string>()
  const basePoolWhitelistIdSet = new Set<string>()
  const basePoolAccountIdSet = new Set<string>()

  for (const {name, args} of events) {
    if (
      name === 'PhalaStakePoolv2.PoolCommissionSet' ||
      name === 'PhalaStakePoolv2.PoolCapacitySet' ||
      name === 'PhalaStakePoolv2.PoolWorkerAdded' ||
      name === 'PhalaStakePoolv2.WorkingStarted' ||
      name === 'PhalaStakePoolv2.RewardReceived' ||
      name === 'PhalaStakePoolv2.OwnerRewardsWithdrawn' ||
      name === 'PhalaStakePoolv2.Contribution' ||
      name === 'PhalaStakePoolv2.WorkerReclaimed' ||
      name === 'PhalaVault.VaultCommissionSet' ||
      name === 'PhalaVault.OwnerSharesClaimed' ||
      name === 'PhalaVault.OwnerSharesGained' ||
      name === 'PhalaVault.Contribution' ||
      name === 'PhalaBasePool.NftCreated' ||
      name === 'PhalaBasePool.Withdrawal' ||
      name === 'PhalaBasePool.WithdrawalQueued' ||
      name === 'PhalaBasePool.PoolWhitelistCreated' ||
      name === 'PhalaBasePool.PoolWhitelistDeleted' ||
      name === 'PhalaBasePool.PoolWhitelistStakerAdded' ||
      name === 'PhalaBasePool.PoolWhitelistStakerRemoved'
    ) {
      basePoolIdSet.add(args.pid)
    }

    if (
      name === 'PhalaStakePoolv2.Contribution' ||
      name === 'PhalaBasePool.WithdrawalQueued'
    ) {
      if (args.asVault !== undefined) {
        basePoolIdSet.add(args.asVault)
      }
    }

    if (name === 'PhalaBasePool.Withdrawal') {
      basePoolAccountIdSet.add(args.accountId)
    }

    if (
      name === 'PhalaBasePool.Withdrawal' ||
      name === 'PhalaBasePool.WithdrawalQueued'
    ) {
      delegationIdSet.add(join(args.pid, args.accountId))
    }

    if (name === 'PhalaBasePool.NftCreated') {
      delegationIdSet.add(join(args.pid, args.owner))
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
      basePoolWhitelistIdSet.add(join(args.pid, args.accountId))
    }

    if (name === 'RmrkCore.NFTBurned') {
      nftIdSet.add(join(args.cid, args.nftId))
    }

    if (
      name === 'Identity.IdentitySet' ||
      name === 'Identity.IdentityCleared' ||
      name === 'Identity.JudgementGiven'
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
    where: [
      {id: In([...basePoolIdSet])},
      {account: {id: In([...basePoolAccountIdSet])}},
    ],
    relations: {owner: true, account: true},
  })

  const basePoolMap = toMap(basePools)
  const basePoolAccountIdMap = toMap(
    basePools,
    (basePool) => basePool.account.id
  )

  const stakePoolMap = await ctx.store
    .find(StakePool, {
      where: {id: In([...basePoolIdSet])},
      relations: {basePool: true},
    })
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
  // MEMO: get all delegations in updated pools for value update
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

  for (const {name, args, block} of events) {
    const blockTime = new Date(block.timestamp)
    switch (name) {
      case 'PhalaStakePoolv2.PoolCreated': {
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
      case 'PhalaStakePoolv2.PoolCommissionSet': {
        const {pid, commission} = args
        const basePool = assertGet(basePoolMap, pid)
        const stakePool = assertGet(stakePoolMap, pid)
        basePool.commission = commission
        updateStakePoolAprMultiplier(basePool, stakePool)
        break
      }
      case 'PhalaStakePoolv2.PoolCapacitySet': {
        const {pid, cap} = args
        const stakePool = assertGet(stakePoolMap, pid)
        const basePool = assertGet(basePoolMap, pid)
        stakePool.capacity = cap
        updateStakePoolDelegable(basePool, stakePool)
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
      case 'PhalaStakePoolv2.OwnerRewardsWithdrawn': {
        const {pid} = args
        const stakePool = assertGet(stakePoolMap, pid)
        stakePool.ownerReward = BigDecimal(0)
        break
      }
      case 'PhalaStakePoolv2.Contribution': {
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
      case 'PhalaStakePoolv2.WorkerReclaimed': {
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
      case 'PhalaBasePool.PoolWhitelistStakerRemoved': {
        const {pid, accountId} = args
        const id = join(pid, accountId)
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
      case 'PhalaVault.OwnerSharesClaimed': {
        const {pid, shares} = args
        const vault = assertGet(vaultMap, pid)
        vault.claimableOwnerShares = vault.claimableOwnerShares.minus(shares)
        break
      }
      case 'PhalaVault.Contribution': {
        const {pid, amount, shares} = args
        const basePool = assertGet(basePoolMap, pid)
        basePool.freeValue = basePool.freeValue.plus(amount)
        basePool.totalShares = basePool.totalShares.plus(shares)
        basePool.totalValue = basePool.totalValue.plus(amount)
        globalState.totalValue = globalState.totalValue.plus(amount)
        break
      }
      case 'PhalaBasePool.NftCreated': {
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
            delegation.shares.minus(prevShares).times(basePool.sharePrice)
          )
          delegationMap.set(delegationId, delegation)
        }
        break
      }
      case 'PhalaBasePool.Withdrawal': {
        const {pid, accountId, amount, shares} = args
        const basePool = assertGet(basePoolMap, pid)
        const delegationId = join(pid, accountId)
        const delegation = assertGet(delegationMap, delegationId)
        basePool.totalShares = basePool.totalShares.minus(shares)
        basePool.totalValue = basePool.totalValue.minus(amount)
        basePool.freeValue = basePool.freeValue.minus(amount)
        basePool.withdrawingShares = max(
          basePool.withdrawingShares.minus(shares),
          BigDecimal(0)
        )
        basePool.withdrawingValue = basePool.withdrawingShares
          .times(basePool.sharePrice)
          .round(12, 0)
        if (basePool.totalShares.eq(0)) {
          basePool.sharePrice = BigDecimal(1)
        }
        delegation.withdrawingShares =
          delegation.withdrawingShares.minus(shares)
        delegation.shares = delegation.shares.minus(shares)
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
      case 'PhalaBasePool.WithdrawalQueued': {
        const {pid, accountId, shares, nftId} = args
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
        const withdrawalNftId = join(basePool.cid, nftId)
        const withdrawalNft =
          nftMap.get(withdrawalNftId) ??
          (await ctx.store.findOneBy(Nft, {id: join(basePool.cid, nftId)}))
        delegation.withdrawalNft = withdrawalNft
        if (stakePool != null) {
          updateStakePoolDelegable(basePool, stakePool)
        }
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
        assert(session.worker)
        assert(session.worker.id === workerId)
        worker.session = null
        worker.shares = null
        session.isBound = false
        break
      }
      case 'PhalaComputation.SessionSettled': {
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
      case 'PhalaComputation.WorkerStarted': {
        const {sessionId, initP, initV} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
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
        updateStakePoolAprMultiplier(basePool, stakePool)
        break
      }
      case 'PhalaComputation.WorkerStopped': {
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
            worker.shares
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            worker.shares
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
          stakePool.idleWorkerCount--
        }
        session.state = WorkerState.WorkerCoolingDown
        session.coolingDownStartTime = blockTime
        basePool.releasingValue = basePool.releasingValue.plus(session.stake)
        break
      }
      case 'PhalaComputation.WorkerEnterUnresponsive': {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        if (session.state === WorkerState.WorkerIdle) {
          session.state = WorkerState.WorkerUnresponsive
          stakePool.idleWorkerCount--
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            worker.shares
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.minus(
            worker.shares
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        break
      }
      case 'PhalaComputation.WorkerExitUnresponsive': {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.stakePool)
        const basePool = assertGet(basePoolMap, session.stakePool.id)
        const stakePool = assertGet(stakePoolMap, session.stakePool.id)
        if (session.state === WorkerState.WorkerUnresponsive) {
          stakePool.idleWorkerCount++
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
            worker.shares
          )
          stakePool.idleWorkerShares = stakePool.idleWorkerShares.plus(
            worker.shares
          )
          updateStakePoolAprMultiplier(basePool, stakePool)
        }
        session.state = WorkerState.WorkerIdle
        break
      }
      case 'PhalaComputation.BenchmarkUpdated': {
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
      case 'PhalaComputation.TokenomicParametersChanged': {
        await updateTokenomicParameters(ctx, block, globalState)
        break
      }
      case 'PhalaRegistry.WorkerAdded': {
        const {workerId, confidenceLevel} = args
        const worker = new Worker({id: workerId, confidenceLevel})
        workerMap.set(workerId, worker)
        await ctx.store.insert(worker)
        break
      }
      case 'PhalaRegistry.WorkerUpdated': {
        const {workerId, confidenceLevel} = args
        const worker = assertGet(workerMap, workerId)
        worker.confidenceLevel = confidenceLevel
        break
      }
      case 'PhalaRegistry.InitialScoreSet': {
        const {workerId, initialScore} = args
        const worker = assertGet(workerMap, workerId)
        worker.initialScore = initialScore
        break
      }
      case 'RmrkCore.NftMinted': {
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
      // case 'RmrkCore.PropertySet': {
      //   break
      // }
      case 'RmrkCore.NFTBurned': {
        const {cid, nftId} = args
        const nft = assertGet(nftMap, join(cid, nftId))
        nft.burned = true
        break
      }
    }
    updateAverageBlockTime(block, globalState)
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
    nftMap,
    delegationMap,
    basePoolWhitelistMap,
  ]) {
    if (x instanceof Map) {
      await ctx.store.save([...x.values()])
    } else if (Array.isArray(x)) {
      // Bypass type check
      await ctx.store.save(x)
    } else {
      await ctx.store.save(x)
    }
  }

  await postUpdate(ctx)
  await updateGlobalAverageAprMultiplier(ctx)
})
