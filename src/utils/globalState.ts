import {type SubstrateBlock} from '@subsquid/substrate-processor'
import {type GlobalState} from '../model'

export const updateAverageBlockTime = (
  block: SubstrateBlock,
  globalState: GlobalState
): void => {
  const blockCount = block.height - globalState.averageBlockTimeUpdatedHeight
  if (blockCount < 500) return
  const duration =
    block.timestamp - globalState.averageBlockTimeUpdatedTime.getTime()

  globalState.averageBlockTime = Math.floor(duration / blockCount)
  globalState.averageBlockTimeUpdatedHeight = block.height
  globalState.averageBlockTimeUpdatedTime = new Date(block.timestamp)
}
