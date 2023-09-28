import {sts, Block, Bytes, Option, Result, StorageType, RuntimeCtx} from '../support'
import * as v1199 from '../v1199'

export const tokenomicParameters =  {
    /**
     *  Tokenomic parameters used by Gatekeepers to compute the V promote.
     */
    v1199: new StorageType('PhalaComputation.TokenomicParameters', 'Optional', [], v1199.TokenomicParameters) as TokenomicParametersV1199,
}

/**
 *  Tokenomic parameters used by Gatekeepers to compute the V promote.
 */
export interface TokenomicParametersV1199  {
    is(block: RuntimeCtx): boolean
    get(block: Block): Promise<(v1199.TokenomicParameters | undefined)>
}
