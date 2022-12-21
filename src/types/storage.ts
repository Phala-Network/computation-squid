import assert from 'assert'
import {Block, BlockContext, Chain, ChainContext, Option, Result, StorageBase} from './support'
import * as v1 from './v1'
import * as v1199 from './v1199'

export class IdentityIdentityOfStorage extends StorageBase {
    protected getPrefix() {
        return 'Identity'
    }

    protected getName() {
        return 'IdentityOf'
    }

    /**
     *  Information that is pertinent to identify the entity behind an account.
     * 
     *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
     */
    get isV1(): boolean {
        return this.getTypeHash() === 'eee9529c5197f7a5f8200e155d78bab0a612de49bd6c8941e539265edf54c3aa'
    }

    /**
     *  Information that is pertinent to identify the entity behind an account.
     * 
     *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
     */
    get asV1(): IdentityIdentityOfStorageV1 {
        assert(this.isV1)
        return this as any
    }
}

/**
 *  Information that is pertinent to identify the entity behind an account.
 * 
 *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
 */
export interface IdentityIdentityOfStorageV1 {
    get(key: Uint8Array): Promise<(v1.Registration | undefined)>
    getAll(): Promise<v1.Registration[]>
    getMany(keys: Uint8Array[]): Promise<(v1.Registration | undefined)[]>
    getKeys(): Promise<Uint8Array[]>
    getKeys(key: Uint8Array): Promise<Uint8Array[]>
    getKeysPaged(pageSize: number): AsyncIterable<Uint8Array[]>
    getKeysPaged(pageSize: number, key: Uint8Array): AsyncIterable<Uint8Array[]>
    getPairs(): Promise<[k: Uint8Array, v: v1.Registration][]>
    getPairs(key: Uint8Array): Promise<[k: Uint8Array, v: v1.Registration][]>
    getPairsPaged(pageSize: number): AsyncIterable<[k: Uint8Array, v: v1.Registration][]>
    getPairsPaged(pageSize: number, key: Uint8Array): AsyncIterable<[k: Uint8Array, v: v1.Registration][]>
}

export class PhalaComputationTokenomicParametersStorage extends StorageBase {
    protected getPrefix() {
        return 'PhalaComputation'
    }

    protected getName() {
        return 'TokenomicParameters'
    }

    /**
     *  Tokenomic parameters used by Gatekeepers to compute the V promote.
     */
    get isV1199(): boolean {
        return this.getTypeHash() === '7e29f4ae3d65a80220e0c0baf372e7ffb44fb3981aa27fe6a83ce02eb0f439d9'
    }

    /**
     *  Tokenomic parameters used by Gatekeepers to compute the V promote.
     */
    get asV1199(): PhalaComputationTokenomicParametersStorageV1199 {
        assert(this.isV1199)
        return this as any
    }
}

/**
 *  Tokenomic parameters used by Gatekeepers to compute the V promote.
 */
export interface PhalaComputationTokenomicParametersStorageV1199 {
    get(): Promise<(v1199.TokenomicParameters | undefined)>
}
