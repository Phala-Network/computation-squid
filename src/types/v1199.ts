import {sts, Result, Option, Bytes, BitSequence} from './support'

export type PoolProxy = PoolProxy_StakePool | PoolProxy_Vault

export interface PoolProxy_StakePool {
    __kind: 'StakePool'
    value: StakePool
}

export interface PoolProxy_Vault {
    __kind: 'Vault'
    value: Vault
}

export interface Vault {
    basepool: BasePool
    lastSharePriceCheckpoint: bigint
    commission?: (Permill | undefined)
    ownerShares: bigint
    investPools: bigint[]
}

export type Permill = number

export interface BasePool {
    pid: bigint
    owner: AccountId32
    totalShares: bigint
    totalValue: bigint
    withdrawQueue: Type_598[]
    valueSubscribers: bigint[]
    cid: number
    poolAccountId: AccountId32
}

export interface Type_598 {
    user: AccountId32
    startTime: bigint
    nftId: number
}

export type AccountId32 = Bytes

export interface StakePool {
    basepool: BasePool
    payoutCommission?: (Permill | undefined)
    cap?: (bigint | undefined)
    workers: Public[]
    cdWorkers: Public[]
    lockAccount: AccountId32
    ownerRewardAccount: AccountId32
}

export type Public = Bytes

export const PoolProxy: sts.Type<PoolProxy> = sts.closedEnum(() => {
    return  {
        StakePool: StakePool,
        Vault: Vault,
    }
})

export const Vault: sts.Type<Vault> = sts.struct(() => {
    return  {
        basepool: BasePool,
        lastSharePriceCheckpoint: sts.bigint(),
        commission: sts.option(() => Permill),
        ownerShares: sts.bigint(),
        investPools: sts.array(() => sts.bigint()),
    }
})

export const Permill = sts.number()

export const BasePool: sts.Type<BasePool> = sts.struct(() => {
    return  {
        pid: sts.bigint(),
        owner: AccountId32,
        totalShares: sts.bigint(),
        totalValue: sts.bigint(),
        withdrawQueue: sts.array(() => Type_598),
        valueSubscribers: sts.array(() => sts.bigint()),
        cid: sts.number(),
        poolAccountId: AccountId32,
    }
})

export const Type_598: sts.Type<Type_598> = sts.struct(() => {
    return  {
        user: AccountId32,
        startTime: sts.bigint(),
        nftId: sts.number(),
    }
})

export const StakePool: sts.Type<StakePool> = sts.struct(() => {
    return  {
        basepool: BasePool,
        payoutCommission: sts.option(() => Permill),
        cap: sts.option(() => sts.bigint()),
        workers: sts.array(() => Public),
        cdWorkers: sts.array(() => Public),
        lockAccount: AccountId32,
        ownerRewardAccount: AccountId32,
    }
})

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
