import {lookupArchive} from '@subsquid/archive-registry'
import {
  type BlockHeader,
  type DataHandlerContext,
  SubstrateBatchProcessor,
  type SubstrateBatchProcessorFields,
} from '@subsquid/substrate-processor'
import {type Store} from '@subsquid/typeorm-store'
import {INITIAL_BLOCK, RPC_ENDPOINT, TO_BLOCK} from './constants'
import {
  identity,
  phalaBasePool,
  phalaComputation,
  phalaRegistry,
  phalaStakePoolv2,
  phalaVault,
  rmrkCore,
} from './types/events'

export const processor = new SubstrateBatchProcessor()
  .setGateway(lookupArchive('khala', {release: 'ArrowSquid'}))
  .setRpcEndpoint(RPC_ENDPOINT)
  .setBlockRange({
    from: INITIAL_BLOCK + 1,
    to: TO_BLOCK,
  })

  .addEvent({
    name: [
      phalaStakePoolv2.poolCreated.name,
      phalaStakePoolv2.poolCommissionSet.name,
      phalaStakePoolv2.poolCapacitySet.name,
      phalaStakePoolv2.poolWorkerAdded.name,
      phalaStakePoolv2.poolWorkerRemoved.name,
      phalaStakePoolv2.workingStarted.name,
      phalaStakePoolv2.rewardReceived.name,
      phalaStakePoolv2.ownerRewardsWithdrawn.name,
      phalaStakePoolv2.contribution.name,
      // phalaStakePoolv2.workerReclaimed.name,

      phalaVault.poolCreated.name,
      phalaVault.vaultCommissionSet.name,
      phalaVault.ownerSharesGained.name,
      phalaVault.ownerSharesClaimed.name,
      phalaVault.contribution.name,

      phalaBasePool.nftCreated.name,
      phalaBasePool.withdrawal.name,
      phalaBasePool.withdrawalQueued.name,
      phalaBasePool.poolWhitelistCreated.name,
      phalaBasePool.poolWhitelistDeleted.name,
      phalaBasePool.poolWhitelistStakerAdded.name,
      phalaBasePool.poolWhitelistStakerRemoved.name,

      phalaComputation.workerStarted.name,
      phalaComputation.workerStopped.name,
      phalaComputation.workerReclaimed.name,
      phalaComputation.sessionBound.name,
      phalaComputation.sessionUnbound.name,
      phalaComputation.workerEnterUnresponsive.name,
      phalaComputation.workerExitUnresponsive.name,
      phalaComputation.sessionSettled.name,
      phalaComputation.benchmarkUpdated.name,
      phalaComputation.tokenomicParametersChanged.name,

      phalaRegistry.workerAdded.name,
      phalaRegistry.workerUpdated.name,
      phalaRegistry.initialScoreSet.name,

      rmrkCore.nftMinted.name,
      rmrkCore.nftBurned.name,

      identity.identitySet.name,
      identity.identityCleared.name,
      identity.judgementGiven.name,
    ],
  })

  .setFields({
    block: {timestamp: true},
    event: {name: true, args: true},
  })

export type Fields = SubstrateBatchProcessorFields<typeof processor>
export type Ctx = DataHandlerContext<Store, Fields>
export type SubstrateBlock = BlockHeader<Fields>
