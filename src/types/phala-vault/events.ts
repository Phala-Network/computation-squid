import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1199 from '../v1199'

export const poolCreated =  {
    name: 'PhalaVault.PoolCreated' as const,
    /**
     * A vault is created by `owner`
     * 
     * Affected states:
     * - a new entry in [`Pools`] with the pid
     */
    v1199: new EventType(
        'PhalaVault.PoolCreated',
        sts.struct({
            owner: v1199.AccountId32,
            pid: sts.bigint(),
            cid: sts.number(),
            poolAccountId: v1199.AccountId32,
        })
    ),
}

export const vaultCommissionSet =  {
    name: 'PhalaVault.VaultCommissionSet' as const,
    /**
     * The commission of a vault is updated
     * 
     * The commission ratio is represented by an integer. The real value is
     * `commission / 1_000_000u32`.
     * 
     * Affected states:
     * - the `commission` field in [`Pools`] is updated
     */
    v1199: new EventType(
        'PhalaVault.VaultCommissionSet',
        sts.struct({
            pid: sts.bigint(),
            commission: sts.number(),
        })
    ),
}

export const ownerSharesClaimed =  {
    name: 'PhalaVault.OwnerSharesClaimed' as const,
    /**
     * Owner shares is claimed by pool owner
     * Affected states:
     * - the shares related fields in [`Pools`]
     * - the nft related storages in rmrk and pallet unique
     */
    v1199: new EventType(
        'PhalaVault.OwnerSharesClaimed',
        sts.struct({
            pid: sts.bigint(),
            user: v1199.AccountId32,
            shares: sts.bigint(),
        })
    ),
}

export const ownerSharesGained =  {
    name: 'PhalaVault.OwnerSharesGained' as const,
    /**
     * Additional owner shares are mint into the pool
     * 
     * Affected states:
     * - the shares related fields in [`Pools`]
     * - last_share_price_checkpoint in [`Pools`]
     */
    v1199: new EventType(
        'PhalaVault.OwnerSharesGained',
        sts.struct({
            pid: sts.bigint(),
            shares: sts.bigint(),
            checkoutPrice: sts.bigint(),
        })
    ),
}

export const contribution =  {
    name: 'PhalaVault.Contribution' as const,
    /**
     * Someone contributed to a vault
     * 
     * Affected states:
     * - the stake related fields in [`Pools`]
     * - the user W-PHA balance reduced
     * - the user recive ad share NFT once contribution succeeded
     * - when there was any request in the withdraw queue, the action may trigger withdrawals
     *   ([`Withdrawal`](#variant.Withdrawal) event)
     */
    v1199: new EventType(
        'PhalaVault.Contribution',
        sts.struct({
            pid: sts.bigint(),
            user: v1199.AccountId32,
            amount: sts.bigint(),
            shares: sts.bigint(),
        })
    ),
}
