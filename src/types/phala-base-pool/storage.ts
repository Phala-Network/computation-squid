import {sts, Block, Bytes, Option, Result, StorageType, RuntimeCtx} from '../support'
import * as v1199 from '../v1199'

export const pools =  {
    /**
     *  Mapping from pids to pools (including stake pools and vaults)
     */
    v1199: new StorageType('PhalaBasePool.Pools', 'Optional', [sts.bigint()], v1199.PoolProxy) as PoolsV1199,
}

/**
 *  Mapping from pids to pools (including stake pools and vaults)
 */
export interface PoolsV1199  {
    is(block: RuntimeCtx): boolean
    get(block: Block, key: bigint): Promise<(v1199.PoolProxy | undefined)>
    getMany(block: Block, keys: bigint[]): Promise<(v1199.PoolProxy | undefined)[]>
    getKeys(block: Block): Promise<bigint[]>
    getKeys(block: Block, key: bigint): Promise<bigint[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<bigint[]>
    getKeysPaged(pageSize: number, block: Block, key: bigint): AsyncIterable<bigint[]>
    getPairs(block: Block): Promise<[k: bigint, v: (v1199.PoolProxy | undefined)][]>
    getPairs(block: Block, key: bigint): Promise<[k: bigint, v: (v1199.PoolProxy | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: bigint, v: (v1199.PoolProxy | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: bigint): AsyncIterable<[k: bigint, v: (v1199.PoolProxy | undefined)][]>
}
