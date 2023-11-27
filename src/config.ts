import {lookupArchive} from '@subsquid/archive-registry'
import {
  type BlockRangeOption,
  type DataSource,
} from '@subsquid/substrate-processor'

export const DUMP_BLOCK = 3000000

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {
    from: DUMP_BLOCK + 1,
    to:
      process.env.TO_BLOCK != null ? parseInt(process.env.TO_BLOCK) : undefined,
  },
  dataSource: {
    archive: lookupArchive('khala', {release: 'FireSquid'}),
    chain: 'wss://priv-api.phala.network/khala/ws',
  },
}

export const BASE_POOL_ACCOUNT =
  '42qnPyfw3sbWMGGtTPPc2YFNZRKPGXswRszyQQjGs2FDxdim'

export default config
