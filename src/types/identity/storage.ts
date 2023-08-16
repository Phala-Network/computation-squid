import {sts, Block, Bytes, Option, Result, StorageType, RuntimeCtx} from '../support'
import * as v1090 from '../v1090'

export const identityOf =  {
    /**
     *  Information that is pertinent to identify the entity behind an account.
     * 
     *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
     */
    v1090: new StorageType('Identity.IdentityOf', 'Optional', [v1090.AccountId32], v1090.Registration) as IdentityOfV1090,
}

/**
 *  Information that is pertinent to identify the entity behind an account.
 * 
 *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
 */
export interface IdentityOfV1090  {
    is(block: RuntimeCtx): boolean
    get(block: Block, key: v1090.AccountId32): Promise<(v1090.Registration | undefined)>
    getMany(block: Block, keys: v1090.AccountId32[]): Promise<(v1090.Registration | undefined)[]>
    getKeys(block: Block): Promise<v1090.AccountId32[]>
    getKeys(block: Block, key: v1090.AccountId32): Promise<v1090.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v1090.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block, key: v1090.AccountId32): AsyncIterable<v1090.AccountId32[]>
    getPairs(block: Block): Promise<[k: v1090.AccountId32, v: (v1090.Registration | undefined)][]>
    getPairs(block: Block, key: v1090.AccountId32): Promise<[k: v1090.AccountId32, v: (v1090.Registration | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v1090.AccountId32, v: (v1090.Registration | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v1090.AccountId32): AsyncIterable<[k: v1090.AccountId32, v: (v1090.Registration | undefined)][]>
}
