import assert from 'assert'
import {type GlobalState} from '../model'
import {type SubstrateBlock} from '../processor'
import {phalaComputation} from '../types/storage'
import {fromBits} from './converter'

export const updateAverageBlockTime = (
  block: SubstrateBlock,
  globalState: GlobalState,
): void => {
  const blockCount = block.height - globalState.averageBlockTimeUpdatedHeight
  if (blockCount < 100) return
  assert(block.timestamp)
  const duration =
    block.timestamp - globalState.averageBlockTimeUpdatedTime.getTime()

  globalState.averageBlockTime = Math.floor(duration / blockCount)
  globalState.averageBlockTimeUpdatedHeight = block.height
  globalState.averageBlockTimeUpdatedTime = new Date(block.timestamp)
}

export const updateTokenomicParameters = async (
  block: SubstrateBlock,
  globalState: GlobalState,
): Promise<void> => {
  const tokenomicParameters = await phalaComputation.tokenomicParameters.v1199
    .get(block)
    .then((value) => {
      assert(value)
      return {
        phaRate: fromBits(value.phaRate),
        budgetPerBlock: fromBits(value.budgetPerBlock),
        vMax: fromBits(value.vMax),
        treasuryRatio: fromBits(value.treasuryRatio),
        re: fromBits(value.re),
        k: fromBits(value.k),
      }
    })

  Object.assign(globalState, tokenomicParameters)
}
