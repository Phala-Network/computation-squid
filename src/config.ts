import {lookupArchive} from '@subsquid/archive-registry'
import {
  type BlockRangeOption,
  type DataSource,
} from '@subsquid/substrate-processor'

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {from: 3250001},
  dataSource: {
    archive: lookupArchive('khala', {release: 'FireSquid'}),
    chain: 'wss://priv-api.phala.network/khala/ws',
  },
}

export const BASE_POOL_ACCOUNT =
  '42qnPyfw3sbWMGGtTPPc2YFNZRKPGXswRszyQQjGs2FDxdim'

export default config
