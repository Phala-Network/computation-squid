// import {lookupArchive} from '@subsquid/archive-registry'
import {BlockRangeOption, DataSource} from '@subsquid/substrate-processor'

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {from: 48001},
  dataSource: {
    archive: 'http://10.86.1.5:8888/graphql',
    chain: 'wss://pc-test-3.phala.network/khala/ws',
  },
}

export default config
