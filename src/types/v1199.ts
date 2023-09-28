import {sts, Result, Option, Bytes, BitSequence} from './support'

export interface TokenomicParameters {
    phaRate: bigint
    rho: bigint
    budgetPerBlock: bigint
    vMax: bigint
    costK: bigint
    costB: bigint
    slashRate: bigint
    treasuryRatio: bigint
    heartbeatWindow: number
    rigK: bigint
    rigB: bigint
    re: bigint
    k: bigint
    kappa: bigint
}

export const TokenomicParameters: sts.Type<TokenomicParameters> = sts.struct(() => {
    return  {
        phaRate: sts.bigint(),
        rho: sts.bigint(),
        budgetPerBlock: sts.bigint(),
        vMax: sts.bigint(),
        costK: sts.bigint(),
        costB: sts.bigint(),
        slashRate: sts.bigint(),
        treasuryRatio: sts.bigint(),
        heartbeatWindow: sts.number(),
        rigK: sts.bigint(),
        rigB: sts.bigint(),
        re: sts.bigint(),
        k: sts.bigint(),
        kappa: sts.bigint(),
    }
})

export const AccountId32 = sts.bytes()

export const AttestationProvider: sts.Type<AttestationProvider> = sts.closedEnum(() => {
    return  {
        Ias: sts.unit(),
        Root: sts.unit(),
    }
})

export type AttestationProvider = AttestationProvider_Ias | AttestationProvider_Root

export interface AttestationProvider_Ias {
    __kind: 'Ias'
}

export interface AttestationProvider_Root {
    __kind: 'Root'
}

export const Public = sts.bytes()
