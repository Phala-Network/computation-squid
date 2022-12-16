// import {lookupArchive} from '@subsquid/archive-registry'
import {BlockRangeOption, DataSource} from '@subsquid/substrate-processor'

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {from: 7801},
  dataSource: {
    archive: 'http://51.210.116.29:8889/graphql',
    chain: 'wss://pc-test-4.phala.network/khala/ws',
  },
}

export default config
