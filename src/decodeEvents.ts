import {BigDecimal} from '@subsquid/big-decimal'
import {type Ctx, type SubstrateBlock} from './processor'
import {encodeAddress, fromBits, toBalance} from './utils/converter'
import {
  phalaStakePoolv2,
  identity,
  phalaBasePool,
  phalaComputation,
  phalaRegistry,
  phalaVault,
  rmrkCore,
} from './types/events'

const decodeEvent = (
  event: Ctx['blocks'][number]['events'][number],
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const {name} = event
  const error = new Error(
    `Unsupported spec: ${event.name} v${event.block.specVersion}`,
  )
  switch (name) {
    case phalaStakePoolv2.poolCreated.name: {
      if (phalaStakePoolv2.poolCreated.v1199.is(event)) {
        const {owner, pid, cid, poolAccountId} =
          phalaStakePoolv2.poolCreated.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            owner: encodeAddress(owner),
            cid,
            poolAccountId: encodeAddress(poolAccountId),
          },
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.poolCommissionSet.name: {
      if (phalaStakePoolv2.poolCommissionSet.v1199.is(event)) {
        const {pid, commission} =
          phalaStakePoolv2.poolCommissionSet.v1199.decode(event)
        return {
          name,
          args: {pid: String(pid), commission: BigDecimal(commission).div(1e6)},
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.poolCapacitySet.name: {
      if (phalaStakePoolv2.poolCapacitySet.v1199.is(event)) {
        const {pid, cap} = phalaStakePoolv2.poolCapacitySet.v1199.decode(event)
        return {name, args: {pid: String(pid), cap: toBalance(cap)}}
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.poolWorkerAdded.name: {
      if (phalaStakePoolv2.poolWorkerAdded.v1199.is(event)) {
        const {pid, worker} =
          phalaStakePoolv2.poolWorkerAdded.v1199.decode(event)
        return {
          name,
          args: {pid: String(pid), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.poolWorkerRemoved.name: {
      if (phalaStakePoolv2.poolWorkerRemoved.v1199.is(event)) {
        const {pid, worker} =
          phalaStakePoolv2.poolWorkerRemoved.v1199.decode(event)

        return {
          name,
          args: {pid: String(pid), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.workingStarted.name: {
      if (phalaStakePoolv2.workingStarted.v1199.is(event)) {
        const {pid, worker, amount} =
          phalaStakePoolv2.workingStarted.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            workerId: worker,
            amount: toBalance(amount),
          },
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.rewardReceived.name: {
      if (phalaStakePoolv2.rewardReceived.v1199.is(event)) {
        const {pid, toOwner, toStakers} =
          phalaStakePoolv2.rewardReceived.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            toOwner: toBalance(toOwner),
            toStakers: toBalance(toStakers),
          },
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.ownerRewardsWithdrawn.name: {
      if (phalaStakePoolv2.ownerRewardsWithdrawn.v1199.is(event)) {
        const {pid, user, amount} =
          phalaStakePoolv2.ownerRewardsWithdrawn.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            accountId: encodeAddress(user),
            amount: toBalance(amount),
          },
        }
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.contribution.name: {
      if (phalaStakePoolv2.contribution.v1199.is(event)) {
        const {pid, user, amount, shares, asVault} =
          phalaStakePoolv2.contribution.v1199.decode(event)
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
      } else {
        throw error
      }
    }
    case phalaStakePoolv2.workerReclaimed.name: {
      if (phalaStakePoolv2.workerReclaimed.v1199.is(event)) {
        const {pid, worker} =
          phalaStakePoolv2.workerReclaimed.v1199.decode(event)
        return {
          name,
          args: {pid: String(pid), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaVault.poolCreated.name: {
      if (phalaVault.poolCreated.v1199.is(event)) {
        const {owner, pid, cid, poolAccountId} =
          phalaVault.poolCreated.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            owner: encodeAddress(owner),
            cid,
            poolAccountId: encodeAddress(poolAccountId),
          },
        }
      } else {
        throw error
      }
    }
    case phalaVault.vaultCommissionSet.name: {
      if (phalaVault.vaultCommissionSet.v1199.is(event)) {
        const {pid, commission} =
          phalaVault.vaultCommissionSet.v1199.decode(event)
        return {
          name,
          args: {pid: String(pid), commission: BigDecimal(commission).div(1e6)},
        }
      } else {
        throw error
      }
    }
    case phalaVault.ownerSharesGained.name: {
      if (phalaVault.ownerSharesGained.v1199.is(event)) {
        const {pid, shares} = phalaVault.ownerSharesGained.v1199.decode(event)
        return {name, args: {pid: String(pid), shares: toBalance(shares)}}
      } else {
        throw error
      }
    }
    case phalaVault.ownerSharesClaimed.name: {
      if (phalaVault.ownerSharesClaimed.v1199.is(event)) {
        const {pid, user, shares} =
          phalaVault.ownerSharesClaimed.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            accountId: encodeAddress(user),
            shares: toBalance(shares),
          },
        }
      } else {
        throw error
      }
    }
    case phalaVault.contribution.name: {
      if (phalaVault.contribution.v1199.is(event)) {
        const {pid, user, amount, shares} =
          phalaVault.contribution.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            accountId: encodeAddress(user),
            amount: toBalance(amount),
            shares: toBalance(shares),
          },
        }
      } else {
        throw error
      }
    }
    case phalaBasePool.nftCreated.name: {
      if (phalaBasePool.nftCreated.v1199.is(event)) {
        const {pid, cid, nftId, owner, shares} =
          phalaBasePool.nftCreated.v1199.decode(event)
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
      } else {
        throw error
      }
    }
    case phalaBasePool.withdrawal.name: {
      if (phalaBasePool.withdrawal.v1254.is(event)) {
        const {pid, user, amount, shares, burntShares} =
          phalaBasePool.withdrawal.v1254.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            accountId: encodeAddress(user),
            amount: toBalance(amount),
            shares: toBalance(shares),
            burntShares: toBalance(burntShares),
          },
        }
      } else if (phalaBasePool.withdrawal.v1199.is(event)) {
        const {pid, user, amount, shares} =
          phalaBasePool.withdrawal.v1199.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            accountId: encodeAddress(user),
            amount: toBalance(amount),
            shares: toBalance(shares),
          },
        }
      } else {
        throw error
      }
    }
    case phalaBasePool.withdrawalQueued.name: {
      if (phalaBasePool.withdrawalQueued.v1254.is(event)) {
        const {pid, user, shares, nftId, asVault, withdrawingNftId} =
          phalaBasePool.withdrawalQueued.v1254.decode(event)
        return {
          name,
          args: {
            pid: String(pid),
            accountId: encodeAddress(user),
            shares: toBalance(shares),
            nftId,
            asVault: asVault?.toString(),
            withdrawingNftId,
          },
        }
      } else if (phalaBasePool.withdrawalQueued.v1199.is(event)) {
        const {pid, user, shares, nftId, asVault} =
          phalaBasePool.withdrawalQueued.v1199.decode(event)

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
      } else {
        throw error
      }
    }
    case phalaBasePool.poolWhitelistCreated.name: {
      if (phalaBasePool.poolWhitelistCreated.v1199.is(event)) {
        const {pid} = phalaBasePool.poolWhitelistCreated.v1199.decode(event)
        return {name, args: {pid: String(pid)}}
      } else {
        throw error
      }
    }
    case phalaBasePool.poolWhitelistDeleted.name: {
      if (phalaBasePool.poolWhitelistDeleted.v1199.is(event)) {
        const {pid} = phalaBasePool.poolWhitelistDeleted.v1199.decode(event)
        return {name, args: {pid: String(pid)}}
      } else {
        throw error
      }
    }
    case phalaBasePool.poolWhitelistStakerAdded.name: {
      if (phalaBasePool.poolWhitelistStakerAdded.v1199.is(event)) {
        const {pid, staker} =
          phalaBasePool.poolWhitelistStakerAdded.v1199.decode(event)
        return {
          name,
          args: {pid: String(pid), accountId: encodeAddress(staker)},
        }
      } else {
        throw error
      }
    }
    case phalaBasePool.poolWhitelistStakerRemoved.name: {
      if (phalaBasePool.poolWhitelistStakerRemoved.v1199.is(event)) {
        const {pid, staker} =
          phalaBasePool.poolWhitelistStakerRemoved.v1199.decode(event)
        return {
          name,
          args: {pid: String(pid), accountId: encodeAddress(staker)},
        }
      } else {
        throw error
      }
    }
    case phalaComputation.sessionBound.name: {
      if (phalaComputation.sessionBound.v1199.is(event)) {
        const {session, worker} =
          phalaComputation.sessionBound.v1199.decode(event)
        return {
          name,
          args: {sessionId: encodeAddress(session), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaComputation.sessionUnbound.name: {
      if (phalaComputation.sessionUnbound.v1199.is(event)) {
        const {session, worker} =
          phalaComputation.sessionUnbound.v1199.decode(event)
        return {
          name,
          args: {sessionId: encodeAddress(session), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaComputation.sessionSettled.name: {
      if (phalaComputation.sessionSettled.v1199.is(event)) {
        const {session, vBits, payoutBits} =
          phalaComputation.sessionSettled.v1199.decode(event)
        return {
          name,
          args: {
            sessionId: encodeAddress(session),
            v: fromBits(vBits),
            payout: fromBits(payoutBits).round(12, 0),
          },
        }
      } else {
        throw error
      }
    }
    case phalaComputation.workerStarted.name: {
      if (phalaComputation.workerStarted.v1199.is(event)) {
        const {session, initV, initP} =
          phalaComputation.workerStarted.v1199.decode(event)
        return {
          name,
          args: {
            sessionId: encodeAddress(session),
            initV: fromBits(initV),
            initP,
          },
        }
      } else {
        throw error
      }
    }
    case phalaComputation.workerStopped.name: {
      if (phalaComputation.workerStopped.v1199.is(event)) {
        const {session} = phalaComputation.workerStopped.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session)}}
      } else {
        throw error
      }
    }
    case phalaComputation.workerReclaimed.name: {
      if (phalaComputation.workerReclaimed.v1199.is(event)) {
        const {session, originalStake, slashed} =
          phalaComputation.workerReclaimed.v1199.decode(event)
        return {
          name,
          args: {
            sessionId: encodeAddress(session),
            originalStake: toBalance(originalStake),
            slashed: toBalance(slashed),
          },
        }
      } else {
        throw error
      }
    }
    case phalaComputation.workerEnterUnresponsive.name: {
      if (phalaComputation.workerEnterUnresponsive.v1199.is(event)) {
        const {session} =
          phalaComputation.workerEnterUnresponsive.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session)}}
      } else {
        throw error
      }
    }
    case phalaComputation.workerExitUnresponsive.name: {
      if (phalaComputation.workerExitUnresponsive.v1199.is(event)) {
        const {session} =
          phalaComputation.workerExitUnresponsive.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session)}}
      } else {
        throw error
      }
    }
    case phalaComputation.benchmarkUpdated.name: {
      if (phalaComputation.benchmarkUpdated.v1199.is(event)) {
        const {session, pInstant} =
          phalaComputation.benchmarkUpdated.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session), pInstant}}
      } else {
        throw error
      }
    }
    case phalaComputation.tokenomicParametersChanged.name: {
      return {name, args: {}}
    }
    case phalaRegistry.workerAdded.name: {
      if (phalaRegistry.workerAdded.v1260.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerAdded.v1260.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else if (phalaRegistry.workerAdded.v1199.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerAdded.v1199.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else {
        throw error
      }
    }
    case phalaRegistry.workerUpdated.name: {
      if (phalaRegistry.workerUpdated.v1260.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerUpdated.v1260.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else if (phalaRegistry.workerUpdated.v1199.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerUpdated.v1199.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else {
        throw error
      }
    }
    case phalaRegistry.initialScoreSet.name: {
      if (phalaRegistry.initialScoreSet.v1182.is(event)) {
        const {pubkey, initScore} =
          phalaRegistry.initialScoreSet.v1182.decode(event)
        return {
          name,
          args: {workerId: pubkey, initialScore: initScore},
        }
      } else {
        throw error
      }
    }
    case rmrkCore.nftMinted.name: {
      // if (rmrkCore.nftMinted.v1170.is(event)) {
      // FIXME: v1170 is not supported
      const {owner, collectionId, nftId} =
        rmrkCore.nftMinted.v1170.decode(event)
      if (owner.__kind !== 'AccountId') return
      return {
        name,
        args: {owner: encodeAddress(owner.value), cid: collectionId, nftId},
      }
      // } else {
      //   throw error
      // }
    }
    case rmrkCore.nftBurned.name: {
      if (rmrkCore.nftBurned.v1181.is(event)) {
        const {owner, collectionId, nftId} =
          rmrkCore.nftBurned.v1181.decode(event)
        return {
          name,
          args: {owner: encodeAddress(owner), cid: collectionId, nftId},
        }
      } else {
        throw error
      }
    }
    case identity.identitySet.name: {
      if (identity.identitySet.v1090.is(event)) {
        const {who} = identity.identitySet.v1090.decode(event)
        return {name, args: {accountId: encodeAddress(who)}}
      } else {
        throw error
      }
    }
    case identity.identityCleared.name: {
      if (identity.identityCleared.v1090.is(event)) {
        const {who} = identity.identityCleared.v1090.decode(event)
        return {name, args: {accountId: encodeAddress(who)}}
      } else {
        throw error
      }
    }
    case identity.judgementGiven.name: {
      if (identity.judgementGiven.v1090.is(event)) {
        const {target} = identity.judgementGiven.v1090.decode(event)
        return {name, args: {accountId: encodeAddress(target)}}
      } else {
        throw error
      }
    }
  }
}

const decodeEvents = (
  ctx: Ctx,
): Array<
  Exclude<ReturnType<typeof decodeEvent>, undefined> & {
    block: SubstrateBlock
  }
> => {
  const decodedEvents = []

  for (const block of ctx.blocks) {
    for (const event of block.events) {
      const decoded = decodeEvent(event)
      if (decoded != null) {
        decodedEvents.push({...decoded, block: block.header})
      }
    }
  }

  return decodedEvents
}

export default decodeEvents
