import {sts, Block, Bytes, Option, Result, StorageType, RuntimeCtx} from '../support'
import * as v1240 from '../v1240'

export const tokenomicParameters =  {
    /**
     *  Tokenomic parameters used by Gatekeepers to compute the V promote.
     */
    v1240: new StorageType('PhalaComputation.TokenomicParameters', 'Optional', [], v1240.TokenomicParameters) as TokenomicParametersV1240,
}

/**
 *  Tokenomic parameters used by Gatekeepers to compute the V promote.
 */
export interface TokenomicParametersV1240  {
    is(block: RuntimeCtx): boolean
    get(block: Block): Promise<(v1240.TokenomicParameters | undefined)>
}
