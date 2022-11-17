import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result, Option} from './support'
import * as v1192 from './v1192'

export class IdentityIdentityOfStorage {
  private readonly _chain: Chain
  private readonly blockHash: string

  constructor(ctx: BlockContext)
  constructor(ctx: ChainContext, block: Block)
  constructor(ctx: BlockContext, block?: Block) {
    block = block || ctx.block
    this.blockHash = block.hash
    this._chain = ctx._chain
  }

  /**
   *  Information that is pertinent to identify the entity behind an account.
   * 
   *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
   */
  get isV1192() {
    return this._chain.getStorageItemTypeHash('Identity', 'IdentityOf') === 'eee9529c5197f7a5f8200e155d78bab0a612de49bd6c8941e539265edf54c3aa'
  }

  /**
   *  Information that is pertinent to identify the entity behind an account.
   * 
   *  TWOX-NOTE: OK ― `AccountId` is a secure hash.
   */
  async getAsV1192(key: Uint8Array): Promise<v1192.Registration | undefined> {
    assert(this.isV1192)
    return this._chain.getStorage(this.blockHash, 'Identity', 'IdentityOf', key)
  }

  async getManyAsV1192(keys: Uint8Array[]): Promise<(v1192.Registration | undefined)[]> {
    assert(this.isV1192)
    return this._chain.queryStorage(this.blockHash, 'Identity', 'IdentityOf', keys.map(k => [k]))
  }

  async getAllAsV1192(): Promise<(v1192.Registration)[]> {
    assert(this.isV1192)
    return this._chain.queryStorage(this.blockHash, 'Identity', 'IdentityOf')
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('Identity', 'IdentityOf') != null
  }
}

export class PhalaComputationTokenomicParametersStorage {
  private readonly _chain: Chain
  private readonly blockHash: string

  constructor(ctx: BlockContext)
  constructor(ctx: ChainContext, block: Block)
  constructor(ctx: BlockContext, block?: Block) {
    block = block || ctx.block
    this.blockHash = block.hash
    this._chain = ctx._chain
  }

  /**
   *  Tokenomic parameters used by Gatekeepers to compute the V promote.
   */
  get isV1192() {
    return this._chain.getStorageItemTypeHash('PhalaComputation', 'TokenomicParameters') === '7e29f4ae3d65a80220e0c0baf372e7ffb44fb3981aa27fe6a83ce02eb0f439d9'
  }

  /**
   *  Tokenomic parameters used by Gatekeepers to compute the V promote.
   */
  async getAsV1192(): Promise<v1192.TokenomicParameters | undefined> {
    assert(this.isV1192)
    return this._chain.getStorage(this.blockHash, 'PhalaComputation', 'TokenomicParameters')
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('PhalaComputation', 'TokenomicParameters') != null
  }
}
