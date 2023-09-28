import {lookupArchive} from '@subsquid/archive-registry'
import {assertNotNull, type DataSource} from '@subsquid/substrate-processor'
import {type Range} from '@subsquid/util-internal-processor-tools'

export const DUMP_BLOCK = 3000000

const config: {
  dataSource: DataSource
  blockRange: Range
} = {
  blockRange: {
    from: DUMP_BLOCK + 1,
    to:
      process.env.TO_BLOCK != null ? parseInt(process.env.TO_BLOCK) : undefined,
  },
  dataSource: {
    archive: lookupArchive('khala', {release: 'ArrowSquid'}),
    chain: {
      url: assertNotNull(process.env.RPC_ENDPOINT),
      rateLimit: 100,
    },
  },
}

export const BASE_POOL_ACCOUNT =
  '42qnPyfw3sbWMGGtTPPc2YFNZRKPGXswRszyQQjGs2FDxdim'

export default config
