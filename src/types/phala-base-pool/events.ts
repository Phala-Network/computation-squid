import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1199 from '../v1199'
import * as v1254 from '../v1254'

export const nftCreated =  {
    name: 'PhalaBasePool.NftCreated' as const,
    /**
     * A Nft is created to contain pool shares
     */
    v1199: new EventType(
        'PhalaBasePool.NftCreated',
        sts.struct({
            pid: sts.bigint(),
            cid: sts.number(),
            nftId: sts.number(),
            owner: v1199.AccountId32,
            shares: sts.bigint(),
        })
    ),
}

export const withdrawalQueued =  {
    name: 'PhalaBasePool.WithdrawalQueued' as const,
    /**
     * A withdrawal request is inserted to a queue
     * 
     * Affected states:
     * - a new item is inserted to or an old item is being replaced by the new item in the
     *   withdraw queue in [`Pools`]
     */
    v1199: new EventType(
        'PhalaBasePool.WithdrawalQueued',
        sts.struct({
            pid: sts.bigint(),
            user: v1199.AccountId32,
            shares: sts.bigint(),
            nftId: sts.number(),
            asVault: sts.option(() => sts.bigint()),
        })
    ),
    /**
     * A withdrawal request is inserted to a queue
     * 
     * Affected states:
     * - a new item is inserted to or an old item is being replaced by the new item in the
     *   withdraw queue in [`Pools`]
     */
    v1254: new EventType(
        'PhalaBasePool.WithdrawalQueued',
        sts.struct({
            pid: sts.bigint(),
            user: v1254.AccountId32,
            shares: sts.bigint(),
            /**
             * Target NFT to withdraw
             */
            nftId: sts.number(),
            asVault: sts.option(() => sts.bigint()),
            /**
             * Splitted NFT for withdrawing
             */
            withdrawingNftId: sts.number(),
        })
    ),
}

export const withdrawal =  {
    name: 'PhalaBasePool.Withdrawal' as const,
    /**
     * Some stake was withdrawn from a pool
     * 
     * The lock in [`Balances`](pallet_balances::pallet::Pallet) is updated to release the
     * locked stake.
     * 
     * Affected states:
     * - the stake related fields in [`Pools`]
     * - the user staking asset account
     */
    v1199: new EventType(
        'PhalaBasePool.Withdrawal',
        sts.struct({
            pid: sts.bigint(),
            user: v1199.AccountId32,
            amount: sts.bigint(),
            shares: sts.bigint(),
        })
    ),
    /**
     * Some stake was withdrawn from a pool
     * 
     * The lock in [`Balances`](pallet_balances::pallet::Pallet) is updated to release the
     * locked stake.
     * 
     * Affected states:
     * - the stake related fields in [`Pools`]
     * - the user staking asset account
     */
    v1254: new EventType(
        'PhalaBasePool.Withdrawal',
        sts.struct({
            pid: sts.bigint(),
            user: v1254.AccountId32,
            amount: sts.bigint(),
            shares: sts.bigint(),
            burntShares: sts.bigint(),
        })
    ),
}

export const poolWhitelistCreated =  {
    name: 'PhalaBasePool.PoolWhitelistCreated' as const,
    /**
     * A pool contribution whitelist is added
     * 
     * - lazy operated when the first staker is added to the whitelist
     */
    v1199: new EventType(
        'PhalaBasePool.PoolWhitelistCreated',
        sts.struct({
            pid: sts.bigint(),
        })
    ),
}

export const poolWhitelistDeleted =  {
    name: 'PhalaBasePool.PoolWhitelistDeleted' as const,
    /**
     * The pool contribution whitelist is deleted
     * 
     * - lazy operated when the last staker is removed from the whitelist
     */
    v1199: new EventType(
        'PhalaBasePool.PoolWhitelistDeleted',
        sts.struct({
            pid: sts.bigint(),
        })
    ),
}

export const poolWhitelistStakerAdded =  {
    name: 'PhalaBasePool.PoolWhitelistStakerAdded' as const,
    /**
     * A staker is added to the pool contribution whitelist
     */
    v1199: new EventType(
        'PhalaBasePool.PoolWhitelistStakerAdded',
        sts.struct({
            pid: sts.bigint(),
            staker: v1199.AccountId32,
        })
    ),
}

export const poolWhitelistStakerRemoved =  {
    name: 'PhalaBasePool.PoolWhitelistStakerRemoved' as const,
    /**
     * A staker is removed from the pool contribution whitelist
     */
    v1199: new EventType(
        'PhalaBasePool.PoolWhitelistStakerRemoved',
        sts.struct({
            pid: sts.bigint(),
            staker: v1199.AccountId32,
        })
    ),
}
