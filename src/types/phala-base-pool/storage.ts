import {sts, Block, Bytes, Option, Result, StorageType, RuntimeCtx} from '../support'
import * as v1240 from '../v1240'

export const pools =  {
    /**
     *  Mapping from pids to pools (including stake pools and vaults)
     */
    v1240: new StorageType('PhalaBasePool.Pools', 'Optional', [sts.bigint()], v1240.PoolProxy) as PoolsV1240,
}

/**
 *  Mapping from pids to pools (including stake pools and vaults)
 */
export interface PoolsV1240  {
    is(block: RuntimeCtx): boolean
    get(block: Block, key: bigint): Promise<(v1240.PoolProxy | undefined)>
    getMany(block: Block, keys: bigint[]): Promise<(v1240.PoolProxy | undefined)[]>
    getKeys(block: Block): Promise<bigint[]>
    getKeys(block: Block, key: bigint): Promise<bigint[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<bigint[]>
    getKeysPaged(pageSize: number, block: Block, key: bigint): AsyncIterable<bigint[]>
    getPairs(block: Block): Promise<[k: bigint, v: (v1240.PoolProxy | undefined)][]>
    getPairs(block: Block, key: bigint): Promise<[k: bigint, v: (v1240.PoolProxy | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: bigint, v: (v1240.PoolProxy | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: bigint): AsyncIterable<[k: bigint, v: (v1240.PoolProxy | undefined)][]>
}
