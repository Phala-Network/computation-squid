// import {lookupArchive} from '@subsquid/archive-registry'
import {BlockRangeOption, DataSource} from '@subsquid/substrate-processor'

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {from: 102001},
  dataSource: {
    archive: 'http://51.210.116.29:8888/graphql',
    chain: 'wss://pc-test-3.phala.network/khala/ws',
  },
}

export default config
