import {
  SubstrateBatchProcessor,
  assertNotNull,
  type BlockHeader,
  type DataHandlerContext,
  type SubstrateBatchProcessorFields,
} from '@subsquid/substrate-processor'
import {type Store} from '@subsquid/typeorm-store'
import {
  identity,
  phalaBasePool,
  phalaComputation,
  phalaRegistry,
  phalaStakePoolv2,
  phalaVault,
  rmrkCore,
} from './types/events'
import {lookupArchive} from '@subsquid/archive-registry'
import {DUMP_BLOCK} from './constants'

export const processor = new SubstrateBatchProcessor()
  .setGateway(lookupArchive('khala', {release: 'ArrowSquid'}))
  .setRpcEndpoint(assertNotNull(process.env.RPC_ENDPOINT))
  .setBlockRange({
    from: DUMP_BLOCK + 1,
    to:
      process.env.TO_BLOCK != null ? parseInt(process.env.TO_BLOCK) : undefined,
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
      phalaStakePoolv2.workerReclaimed.name,

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

      // rmrkCore.collectionCreated.name,
      rmrkCore.nftMinted.name,
      // rmrkCore.propertySet.name,
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
