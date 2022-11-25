import assert from 'assert'
import {GlobalState} from '../model'
import {Ctx} from '../processor'

export const updateBlockState = (ctx: Ctx, globalState: GlobalState): void => {
  const latestBlock = ctx.blocks.at(-1)?.header
  assert(latestBlock)
  globalState.height = latestBlock.height
  const blockCount = latestBlock.height - globalState.lastRecordedBlockHeight

  if (blockCount < 100) return
  const duration =
    latestBlock.timestamp - globalState.lastRecordedBlockTime.getTime()

  globalState.averageBlockTime = Math.floor(duration / blockCount)
  globalState.lastRecordedBlockHeight = latestBlock.height
  globalState.lastRecordedBlockTime = new Date(latestBlock.timestamp)
}
