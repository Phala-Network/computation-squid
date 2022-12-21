import type {Result, Option} from './support'

export type AttestationProvider = AttestationProvider_Root | AttestationProvider_Ias

export interface AttestationProvider_Root {
    __kind: 'Root'
}

export interface AttestationProvider_Ias {
    __kind: 'Ias'
}

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
