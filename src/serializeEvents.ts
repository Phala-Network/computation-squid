import {BigDecimal} from '@subsquid/big-decimal'
import {SubstrateBlock, toHex} from '@subsquid/substrate-processor'
import {Ctx} from './processor'
import {
  IdentityIdentityClearedEvent,
  IdentityIdentitySetEvent,
  IdentityJudgementGivenEvent,
  PhalaBasePoolWithdrawalEvent,
  PhalaComputationBenchmarkUpdatedEvent,
  PhalaComputationSessionBoundEvent,
  PhalaComputationSessionSettledEvent,
  PhalaComputationSessionUnboundEvent,
  PhalaComputationWorkerEnterUnresponsiveEvent,
  PhalaComputationWorkerExitUnresponsiveEvent,
  PhalaComputationWorkerReclaimedEvent,
  PhalaComputationWorkerStartedEvent,
  PhalaComputationWorkerStoppedEvent,
  PhalaRegistryInitialScoreSetEvent,
  PhalaRegistryWorkerAddedEvent,
  PhalaRegistryWorkerUpdatedEvent,
  PhalaStakePoolv2ContributionEvent,
  PhalaStakePoolv2PoolCapacitySetEvent,
  PhalaStakePoolv2PoolCommissionSetEvent,
  PhalaStakePoolv2PoolCreatedEvent,
  PhalaStakePoolv2PoolWhitelistCreatedEvent,
  PhalaStakePoolv2PoolWhitelistDeletedEvent,
  PhalaStakePoolv2PoolWhitelistStakerAddedEvent,
  PhalaStakePoolv2PoolWhitelistStakerRemovedEvent,
  PhalaStakePoolv2PoolWorkerAddedEvent,
  PhalaStakePoolv2PoolWorkerRemovedEvent,
  PhalaStakePoolv2RewardReceivedEvent,
  PhalaStakePoolv2WithdrawalEvent,
  PhalaStakePoolv2WithdrawalQueuedEvent,
  PhalaStakePoolv2WorkerReclaimedEvent,
  PhalaStakePoolv2WorkingStartedEvent,
  PhalaVaultContributionEvent,
  PhalaVaultOwnerSharesClaimedEvent,
  PhalaVaultOwnerSharesGainedEvent,
  PhalaVaultPoolCreatedEvent,
  PhalaVaultVaultCommissionSetEvent,
  RmrkCoreNftBurnedEvent,
  RmrkCoreNftMintedEvent,
  RmrkCorePropertySetEvent,
} from './types/events'
import {encodeAddress, fromBits, toBalance} from './utils/converters'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const serializeEvent = (
  ctx: Ctx,
  item: Ctx['blocks'][number]['items'][number]
) => {
  const {name} = item
  switch (name) {
    case 'PhalaStakePoolv2.PoolCreated': {
      const e = new PhalaStakePoolv2PoolCreatedEvent(ctx, item.event)
      const {owner, pid, cid} = e.asV1192
      return {name, args: {pid: String(pid), owner: encodeAddress(owner), cid}}
    }
    case 'PhalaStakePoolv2.PoolCommissionSet': {
      const e = new PhalaStakePoolv2PoolCommissionSetEvent(ctx, item.event)
      const {pid, commission} = e.asV1191
      return {
        name,
        args: {pid: String(pid), commission: BigDecimal(commission).div(1e6)},
      }
    }
    case 'PhalaStakePoolv2.PoolCapacitySet': {
      const e = new PhalaStakePoolv2PoolCapacitySetEvent(ctx, item.event)
      const {pid, cap} = e.asV1191
      return {name, args: {pid: String(pid), cap: toBalance(cap)}}
    }
    case 'PhalaStakePoolv2.PoolWorkerAdded': {
      const e = new PhalaStakePoolv2PoolWorkerAddedEvent(ctx, item.event)
      const {pid, worker} = e.asV1191
      return {
        name,
        args: {pid: String(pid), workerId: toHex(worker)},
      }
    }
    case 'PhalaStakePoolv2.PoolWorkerRemoved': {
      const e = new PhalaStakePoolv2PoolWorkerRemovedEvent(ctx, item.event)
      const {pid, worker} = e.asV1191
      return {
        name,
        args: {pid: String(pid), workerId: toHex(worker)},
      }
    }
    case 'PhalaStakePoolv2.WorkingStarted': {
      const e = new PhalaStakePoolv2WorkingStartedEvent(ctx, item.event)
      const {pid, worker, amount} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          workerId: toHex(worker),
          amount: toBalance(amount),
        },
      }
    }
    case 'PhalaStakePoolv2.RewardReceived': {
      const e = new PhalaStakePoolv2RewardReceivedEvent(ctx, item.event)
      const {pid, toOwner, toStakers} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          toOwner: toBalance(toOwner),
          toStakers: toBalance(toStakers),
        },
      }
    }
    case 'PhalaStakePoolv2.Contribution': {
      const e = new PhalaStakePoolv2ContributionEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaStakePoolv2.Withdrawal': {
      const e = new PhalaStakePoolv2WithdrawalEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaStakePoolv2.WithdrawalQueued': {
      const e = new PhalaStakePoolv2WithdrawalQueuedEvent(ctx, item.event)
      const {pid, user, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaStakePoolv2.WorkerReclaimed': {
      const e = new PhalaStakePoolv2WorkerReclaimedEvent(ctx, item.event)
      const {pid, worker} = e.asV1191
      return {
        name,
        args: {pid: String(pid), workerId: toHex(worker)},
      }
    }
    case 'PhalaStakePoolv2.PoolWhitelistCreated': {
      const e = new PhalaStakePoolv2PoolWhitelistCreatedEvent(ctx, item.event)
      const {pid} = e.asV1191
      return {name, args: {pid: String(pid)}}
    }
    case 'PhalaStakePoolv2.PoolWhitelistDeleted': {
      const e = new PhalaStakePoolv2PoolWhitelistDeletedEvent(ctx, item.event)
      const {pid} = e.asV1191
      return {name, args: {pid: String(pid)}}
    }
    case 'PhalaStakePoolv2.PoolWhitelistStakerAdded': {
      const e = new PhalaStakePoolv2PoolWhitelistStakerAddedEvent(
        ctx,
        item.event
      )
      const {pid, staker} = e.asV1191
      return {name, args: {pid: String(pid), accountId: encodeAddress(staker)}}
    }
    case 'PhalaStakePoolv2.PoolWhitelistStakerRemoved': {
      const e = new PhalaStakePoolv2PoolWhitelistStakerRemovedEvent(
        ctx,
        item.event
      )
      const {pid, staker} = e.asV1191
      return {name, args: {pid: String(pid), accountId: encodeAddress(staker)}}
    }
    case 'PhalaVault.PoolCreated': {
      const e = new PhalaVaultPoolCreatedEvent(ctx, item.event)
      const {owner, pid, cid, poolAccountId} = e.asV1192
      return {
        name,
        args: {
          pid: String(pid),
          owner: encodeAddress(owner),
          cid,
          poolAccountId: encodeAddress(poolAccountId),
        },
      }
    }
    case 'PhalaVault.VaultCommissionSet': {
      const e = new PhalaVaultVaultCommissionSetEvent(ctx, item.event)
      const {pid, commission} = e.asV1191
      return {
        name,
        args: {pid: String(pid), commission: BigDecimal(commission).div(1e6)},
      }
    }
    case 'PhalaVault.OwnerSharesClaimed': {
      const e = new PhalaVaultOwnerSharesClaimedEvent(ctx, item.event)
      const {pid, user, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaVault.OwnerSharesGained': {
      const e = new PhalaVaultOwnerSharesGainedEvent(ctx, item.event)
      const {pid, shares} = e.asV1191
      return {name, args: {pid: String(pid), shares: toBalance(shares)}}
    }
    case 'PhalaVault.Contribution': {
      const e = new PhalaVaultContributionEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaBasePool.Withdrawal': {
      const e = new PhalaBasePoolWithdrawalEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaBasePool.WithdrawalQueued': {
      const e = new PhalaBasePoolWithdrawalEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1191
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaComputation.SessionBound': {
      const e = new PhalaComputationSessionBoundEvent(ctx, item.event)
      const {session, worker} = e.asV1191
      return {
        name,
        args: {sessionId: encodeAddress(session), workerId: toHex(worker)},
      }
    }
    case 'PhalaComputation.SessionUnbound': {
      const e = new PhalaComputationSessionUnboundEvent(ctx, item.event)
      const {session, worker} = e.asV1191
      return {
        name,
        args: {sessionId: encodeAddress(session), workerId: toHex(worker)},
      }
    }
    case 'PhalaComputation.SessionSettled': {
      const e = new PhalaComputationSessionSettledEvent(ctx, item.event)
      const {session, vBits, payoutBits} = e.asV1191
      return {
        name,
        args: {
          sessionId: encodeAddress(session),
          v: fromBits(vBits),
          payout: fromBits(payoutBits).round(12, 0),
        },
      }
    }
    case 'PhalaComputation.WorkerStarted': {
      const e = new PhalaComputationWorkerStartedEvent(ctx, item.event)
      const {session, initV, initP} = e.asV1191
      return {
        name,
        args: {
          sessionId: encodeAddress(session),
          initV: fromBits(initV),
          initP,
        },
      }
    }
    case 'PhalaComputation.WorkerStopped': {
      const e = new PhalaComputationWorkerStoppedEvent(ctx, item.event)
      const {session} = e.asV1191
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.WorkerReclaimed': {
      const e = new PhalaComputationWorkerReclaimedEvent(ctx, item.event)
      const {session} = e.asV1191
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.WorkerEnterUnresponsive': {
      const e = new PhalaComputationWorkerEnterUnresponsiveEvent(
        ctx,
        item.event
      )
      const {session} = e.asV1191
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.WorkerExitUnresponsive': {
      const e = new PhalaComputationWorkerExitUnresponsiveEvent(ctx, item.event)
      const {session} = e.asV1191
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.BenchmarkUpdated': {
      const e = new PhalaComputationBenchmarkUpdatedEvent(ctx, item.event)
      const {session, pInstant} = e.asV1191
      return {name, args: {sessionId: encodeAddress(session), pInstant}}
    }
    case 'PhalaComputation.TokenomicParametersChanged':
      return {name, args: {}}
    case 'PhalaRegistry.WorkerAdded': {
      const e = new PhalaRegistryWorkerAddedEvent(ctx, item.event)
      const {pubkey, confidenceLevel} = e.asV1191
      return {
        name,
        args: {workerId: toHex(pubkey), confidenceLevel},
      }
    }
    case 'PhalaRegistry.WorkerUpdated': {
      const e = new PhalaRegistryWorkerUpdatedEvent(ctx, item.event)
      const {pubkey, confidenceLevel} = e.asV1191
      return {
        name,
        args: {workerId: toHex(pubkey), confidenceLevel},
      }
    }
    case 'PhalaRegistry.InitialScoreSet': {
      const e = new PhalaRegistryInitialScoreSetEvent(ctx, item.event)
      const {pubkey, initScore} = e.asV1191
      return {
        name,
        args: {workerId: toHex(pubkey), initialScore: initScore},
      }
    }
    case 'RmrkCore.NftMinted': {
      const e = new RmrkCoreNftMintedEvent(ctx, item.event)
      const {owner, collectionId, nftId} = e.asV1191
      if (owner.__kind !== 'AccountId') return
      return {
        name,
        args: {owner: encodeAddress(owner.value), collectionId, nftId},
      }
    }
    case 'RmrkCore.PropertySet': {
      const e = new RmrkCorePropertySetEvent(ctx, item.event)
      const {collectionId, maybeNftId, key, value} = e.asV1191
      if (maybeNftId === undefined) return
      return {
        name,
        args: {collectionId, nftId: maybeNftId, key, value},
      }
    }
    case 'RmrkCore.NFTBurned': {
      const e = new RmrkCoreNftBurnedEvent(ctx, item.event)
      const {owner, collectionId, nftId} = e.asV1191
      return {
        name,
        args: {owner: encodeAddress(owner), collectionId, nftId},
      }
    }
    case 'Identity.IdentitySet': {
      const e = new IdentityIdentitySetEvent(ctx, item.event)
      const {who} = e.asV1191
      return {name, args: {accountId: encodeAddress(who)}}
    }
    case 'Identity.IdentityCleared': {
      const e = new IdentityIdentityClearedEvent(ctx, item.event)
      const {who} = e.asV1191
      return {name, args: {accountId: encodeAddress(who)}}
    }
    case 'Identity.JudgementGiven': {
      const e = new IdentityJudgementGivenEvent(ctx, item.event)
      const {target} = e.asV1191
      return {name, args: {accountId: encodeAddress(target)}}
    }
  }
}

const serializeEvents = (
  ctx: Ctx
): Array<
  Exclude<ReturnType<typeof serializeEvent>, undefined> & {
    block: SubstrateBlock
  }
> => {
  const serializedEvents = []

  for (const block of ctx.blocks) {
    for (const item of block.items) {
      const serialized = serializeEvent(ctx, item)
      if (serialized != null) {
        serializedEvents.push({...serialized, block: block.header})
      }
    }
  }

  return serializedEvents
}

export default serializeEvents
