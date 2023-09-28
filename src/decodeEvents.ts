import {BigDecimal} from '@subsquid/big-decimal'
import {toHex, type SubstrateBlock} from '@subsquid/substrate-processor'
import {type Store} from '@subsquid/typeorm-store'
import {type ProcessorContext} from './processor'
import {
  IdentityIdentityClearedEvent,
  IdentityIdentitySetEvent,
  IdentityJudgementGivenEvent,
  PhalaBasePoolNftCreatedEvent,
  PhalaBasePoolPoolWhitelistCreatedEvent,
  PhalaBasePoolPoolWhitelistDeletedEvent,
  PhalaBasePoolPoolWhitelistStakerAddedEvent,
  PhalaBasePoolPoolWhitelistStakerRemovedEvent,
  PhalaBasePoolWithdrawalEvent,
  PhalaBasePoolWithdrawalQueuedEvent,
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
  PhalaStakePoolv2OwnerRewardsWithdrawnEvent,
  PhalaStakePoolv2PoolCapacitySetEvent,
  PhalaStakePoolv2PoolCommissionSetEvent,
  PhalaStakePoolv2PoolCreatedEvent,
  PhalaStakePoolv2PoolWorkerAddedEvent,
  PhalaStakePoolv2PoolWorkerRemovedEvent,
  PhalaStakePoolv2RewardReceivedEvent,
  PhalaStakePoolv2WorkerReclaimedEvent,
  PhalaStakePoolv2WorkingStartedEvent,
  PhalaVaultContributionEvent,
  PhalaVaultOwnerSharesClaimedEvent,
  PhalaVaultOwnerSharesGainedEvent,
  PhalaVaultPoolCreatedEvent,
  PhalaVaultVaultCommissionSetEvent,
  RmrkCoreNftBurnedEvent,
  RmrkCoreNftMintedEvent,
} from './types/events'
import {encodeAddress, fromBits, toBalance} from './utils/converter'

const decodeEvent = (
  ctx: ProcessorContext<Store>,
  item: ProcessorContext<Store>['blocks'][number]['items'][number],
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const {name} = item
  switch (name) {
    case 'PhalaStakePoolv2.PoolCreated': {
      const e = new PhalaStakePoolv2PoolCreatedEvent(ctx, item.event)
      const {owner, pid, cid, poolAccountId} = e.asV1199
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
    case 'PhalaStakePoolv2.PoolCommissionSet': {
      const e = new PhalaStakePoolv2PoolCommissionSetEvent(ctx, item.event)
      const {pid, commission} = e.asV1199
      return {
        name,
        args: {pid: String(pid), commission: BigDecimal(commission).div(1e6)},
      }
    }
    case 'PhalaStakePoolv2.PoolCapacitySet': {
      const e = new PhalaStakePoolv2PoolCapacitySetEvent(ctx, item.event)
      const {pid, cap} = e.asV1199
      return {name, args: {pid: String(pid), cap: toBalance(cap)}}
    }
    case 'PhalaStakePoolv2.PoolWorkerAdded': {
      const e = new PhalaStakePoolv2PoolWorkerAddedEvent(ctx, item.event)
      const {pid, worker} = e.asV1199
      return {
        name,
        args: {pid: String(pid), workerId: toHex(worker)},
      }
    }
    case 'PhalaStakePoolv2.PoolWorkerRemoved': {
      const e = new PhalaStakePoolv2PoolWorkerRemovedEvent(ctx, item.event)
      const {pid, worker} = e.asV1199
      return {
        name,
        args: {pid: String(pid), workerId: toHex(worker)},
      }
    }
    case 'PhalaStakePoolv2.WorkingStarted': {
      const e = new PhalaStakePoolv2WorkingStartedEvent(ctx, item.event)
      const {pid, worker, amount} = e.asV1199
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
      const {pid, toOwner, toStakers} = e.asV1199
      return {
        name,
        args: {
          pid: String(pid),
          toOwner: toBalance(toOwner),
          toStakers: toBalance(toStakers),
        },
      }
    }
    case 'PhalaStakePoolv2.OwnerRewardsWithdrawn': {
      const e = new PhalaStakePoolv2OwnerRewardsWithdrawnEvent(ctx, item.event)
      const {pid, user, amount} = e.asV1199
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
        },
      }
    }
    case 'PhalaStakePoolv2.Contribution': {
      const e = new PhalaStakePoolv2ContributionEvent(ctx, item.event)
      const {pid, user, amount, shares, asVault} = e.asV1199
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          amount: toBalance(amount),
          shares: toBalance(shares),
          asVault: asVault?.toString(),
        },
      }
    }
    case 'PhalaStakePoolv2.WorkerReclaimed': {
      const e = new PhalaStakePoolv2WorkerReclaimedEvent(ctx, item.event)
      const {pid, worker} = e.asV1199
      return {
        name,
        args: {pid: String(pid), workerId: toHex(worker)},
      }
    }
    case 'PhalaVault.PoolCreated': {
      const e = new PhalaVaultPoolCreatedEvent(ctx, item.event)
      const {owner, pid, cid, poolAccountId} = e.asV1199
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
      const {pid, commission} = e.asV1199
      return {
        name,
        args: {pid: String(pid), commission: BigDecimal(commission).div(1e6)},
      }
    }
    case 'PhalaVault.OwnerSharesGained': {
      const e = new PhalaVaultOwnerSharesGainedEvent(ctx, item.event)
      const {pid, shares} = e.asV1199
      return {name, args: {pid: String(pid), shares: toBalance(shares)}}
    }
    case 'PhalaVault.OwnerSharesClaimed': {
      const e = new PhalaVaultOwnerSharesClaimedEvent(ctx, item.event)
      const {pid, user, shares} = e.asV1199
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaVault.Contribution': {
      const e = new PhalaVaultContributionEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1199
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
    case 'PhalaBasePool.NftCreated': {
      const e = new PhalaBasePoolNftCreatedEvent(ctx, item.event)
      const {pid, cid, nftId, owner, shares} = e.asV1199
      return {
        name,
        args: {
          pid: String(pid),
          cid,
          nftId,
          owner: encodeAddress(owner),
          shares: toBalance(shares),
        },
      }
    }
    case 'PhalaBasePool.Withdrawal': {
      const e = new PhalaBasePoolWithdrawalEvent(ctx, item.event)
      const {pid, user, amount, shares} = e.asV1199
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
      const e = new PhalaBasePoolWithdrawalQueuedEvent(ctx, item.event)
      const {pid, user, shares, nftId, asVault} = e.asV1199
      return {
        name,
        args: {
          pid: String(pid),
          accountId: encodeAddress(user),
          shares: toBalance(shares),
          nftId,
          asVault: asVault?.toString(),
        },
      }
    }
    case 'PhalaBasePool.PoolWhitelistCreated': {
      const e = new PhalaBasePoolPoolWhitelistCreatedEvent(ctx, item.event)
      const {pid} = e.asV1199
      return {name, args: {pid: String(pid)}}
    }
    case 'PhalaBasePool.PoolWhitelistDeleted': {
      const e = new PhalaBasePoolPoolWhitelistDeletedEvent(ctx, item.event)
      const {pid} = e.asV1199
      return {name, args: {pid: String(pid)}}
    }
    case 'PhalaBasePool.PoolWhitelistStakerAdded': {
      const e = new PhalaBasePoolPoolWhitelistStakerAddedEvent(ctx, item.event)
      const {pid, staker} = e.asV1199
      return {name, args: {pid: String(pid), accountId: encodeAddress(staker)}}
    }
    case 'PhalaBasePool.PoolWhitelistStakerRemoved': {
      const e = new PhalaBasePoolPoolWhitelistStakerRemovedEvent(
        ctx,
        item.event,
      )
      const {pid, staker} = e.asV1199
      return {name, args: {pid: String(pid), accountId: encodeAddress(staker)}}
    }
    case 'PhalaComputation.SessionBound': {
      const e = new PhalaComputationSessionBoundEvent(ctx, item.event)
      const {session, worker} = e.asV1199
      return {
        name,
        args: {sessionId: encodeAddress(session), workerId: toHex(worker)},
      }
    }
    case 'PhalaComputation.SessionUnbound': {
      const e = new PhalaComputationSessionUnboundEvent(ctx, item.event)
      const {session, worker} = e.asV1199
      return {
        name,
        args: {sessionId: encodeAddress(session), workerId: toHex(worker)},
      }
    }
    case 'PhalaComputation.SessionSettled': {
      const e = new PhalaComputationSessionSettledEvent(ctx, item.event)
      const {session, vBits, payoutBits} = e.asV1199
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
      const {session, initV, initP} = e.asV1199
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
      const {session} = e.asV1199
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.WorkerReclaimed': {
      const e = new PhalaComputationWorkerReclaimedEvent(ctx, item.event)
      const {session, originalStake, slashed} = e.asV1199
      return {
        name,
        args: {
          sessionId: encodeAddress(session),
          originalStake: toBalance(originalStake),
          slashed: toBalance(slashed),
        },
      }
    }
    case 'PhalaComputation.WorkerEnterUnresponsive': {
      const e = new PhalaComputationWorkerEnterUnresponsiveEvent(
        ctx,
        item.event,
      )
      const {session} = e.asV1199
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.WorkerExitUnresponsive': {
      const e = new PhalaComputationWorkerExitUnresponsiveEvent(ctx, item.event)
      const {session} = e.asV1199
      return {name, args: {sessionId: encodeAddress(session)}}
    }
    case 'PhalaComputation.BenchmarkUpdated': {
      const e = new PhalaComputationBenchmarkUpdatedEvent(ctx, item.event)
      const {session, pInstant} = e.asV1199
      return {name, args: {sessionId: encodeAddress(session), pInstant}}
    }
    case 'PhalaComputation.TokenomicParametersChanged': {
      return {name, args: {}}
    }
    case 'PhalaRegistry.WorkerAdded': {
      const e = new PhalaRegistryWorkerAddedEvent(ctx, item.event)
      const {pubkey, confidenceLevel} = e.asV1199
      return {
        name,
        args: {workerId: toHex(pubkey), confidenceLevel},
      }
    }
    case 'PhalaRegistry.WorkerUpdated': {
      const e = new PhalaRegistryWorkerUpdatedEvent(ctx, item.event)
      const {pubkey, confidenceLevel} = e.asV1199
      return {
        name,
        args: {workerId: toHex(pubkey), confidenceLevel},
      }
    }
    case 'PhalaRegistry.InitialScoreSet': {
      const e = new PhalaRegistryInitialScoreSetEvent(ctx, item.event)
      const {pubkey, initScore} = e.asV1182
      return {
        name,
        args: {workerId: toHex(pubkey), initialScore: initScore},
      }
    }
    case 'RmrkCore.NftMinted': {
      const e = new RmrkCoreNftMintedEvent(ctx, item.event)
      const {owner, collectionId, nftId} = e.asV1170
      if (owner.__kind !== 'AccountId') return
      return {
        name,
        args: {owner: encodeAddress(owner.value), cid: collectionId, nftId},
      }
    }
    // case 'RmrkCore.PropertySet': {
    //   const e = new RmrkCorePropertySetEvent(ctx, item.event)
    //   const {collectionId, maybeNftId, key, value} = e.asV1150
    //   const keyString = u8aToString(key)
    //   // MEMO: only filter stake-info event
    //   if (maybeNftId === undefined || keyString !== 'stake-info') return
    //   return {
    //     name,
    //     args: {
    //       cid: collectionId,
    //       nftId: maybeNftId,
    //       key: keyString,
    //       value: u8aToBigInt(value, {isLe: true}),
    //     },
    //   }
    // }
    case 'RmrkCore.NFTBurned': {
      const e = new RmrkCoreNftBurnedEvent(ctx, item.event)
      const {owner, collectionId, nftId} = e.asV1199
      return {
        name,
        args: {owner: encodeAddress(owner), cid: collectionId, nftId},
      }
    }
    case 'Identity.IdentitySet': {
      const e = new IdentityIdentitySetEvent(ctx, item.event)
      const {who} = e.asV1090
      return {name, args: {accountId: encodeAddress(who)}}
    }
    case 'Identity.IdentityCleared': {
      const e = new IdentityIdentityClearedEvent(ctx, item.event)
      const {who} = e.asV1090
      return {name, args: {accountId: encodeAddress(who)}}
    }
    case 'Identity.JudgementGiven': {
      const e = new IdentityJudgementGivenEvent(ctx, item.event)
      const {target} = e.asV1090
      return {name, args: {accountId: encodeAddress(target)}}
    }
  }
}

const decodeEvents = (
  ctx: ProcessorContext<Store>,
): Array<
  Exclude<ReturnType<typeof decodeEvent>, undefined> & {
    block: SubstrateBlock
  }
> => {
  const decodedEvents = []

  for (const block of ctx.blocks) {
    for (const item of block.items) {
      const decoded = decodeEvent(ctx, item)
      if (decoded != null) {
        decodedEvents.push({...decoded, block: block.header})
      }
    }
  }

  return decodedEvents
}

export default decodeEvents
