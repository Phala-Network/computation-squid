import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1199 from '../v1199'

export const poolCreated =  {
    name: 'PhalaStakePoolv2.PoolCreated' as const,
    /**
     * A stake pool is created by `owner`
     * 
     * Affected states:
     * - a new entry in [`Pools`] with the pid
     */
    v1199: new EventType(
        'PhalaStakePoolv2.PoolCreated',
        sts.struct({
            owner: v1199.AccountId32,
            pid: sts.bigint(),
            cid: sts.number(),
            poolAccountId: v1199.AccountId32,
        })
    ),
}

export const poolCommissionSet =  {
    name: 'PhalaStakePoolv2.PoolCommissionSet' as const,
    /**
     * The commission of a pool is updated
     * 
     * The commission ratio is represented by an integer. The real value is
     * `commission / 1_000_000u32`.
     * 
     * Affected states:
     * - the `payout_commission` field in [`Pools`] is updated
     */
    v1199: new EventType(
        'PhalaStakePoolv2.PoolCommissionSet',
        sts.struct({
            pid: sts.bigint(),
            commission: sts.number(),
        })
    ),
}

export const poolCapacitySet =  {
    name: 'PhalaStakePoolv2.PoolCapacitySet' as const,
    /**
     * The stake capacity of the pool is updated
     * 
     * Affected states:
     * - the `cap` field in [`Pools`] is updated
     */
    v1199: new EventType(
        'PhalaStakePoolv2.PoolCapacitySet',
        sts.struct({
            pid: sts.bigint(),
            cap: sts.bigint(),
        })
    ),
}

export const poolWorkerAdded =  {
    name: 'PhalaStakePoolv2.PoolWorkerAdded' as const,
    /**
     * A worker is added to the pool
     * 
     * Affected states:
     * - the `worker` is added to the vector `workers` in [`Pools`]
     * - the worker in the [`WorkerAssignments`] is pointed to `pid`
     * - the worker-session binding is updated in `computation` pallet ([`WorkerBindings`](computation::pallet::WorkerBindings),
     *   [`SessionBindings`](computation::pallet::SessionBindings))
     */
    v1199: new EventType(
        'PhalaStakePoolv2.PoolWorkerAdded',
        sts.struct({
            pid: sts.bigint(),
            worker: v1199.Public,
            session: v1199.AccountId32,
        })
    ),
}

export const contribution =  {
    name: 'PhalaStakePoolv2.Contribution' as const,
    /**
     * Someone contributed to a pool
     * 
     * Affected states:
     * - the stake related fields in [`Pools`]
     * - the user W-PHA balance reduced
     * - the user recive ad share NFT once contribution succeeded
     * - when there was any request in the withdraw queue, the action may trigger withdrawals
     *   ([`Withdrawal`](#variant.Withdrawal) event)
     */
    v1199: new EventType(
        'PhalaStakePoolv2.Contribution',
        sts.struct({
            pid: sts.bigint(),
            user: v1199.AccountId32,
            amount: sts.bigint(),
            shares: sts.bigint(),
            asVault: sts.option(() => sts.bigint()),
        })
    ),
}

export const ownerRewardsWithdrawn =  {
    name: 'PhalaStakePoolv2.OwnerRewardsWithdrawn' as const,
    /**
     * Owner rewards were withdrawn by pool owner
     * 
     * Affected states:
     * - the stake related fields in [`Pools`]
     * - the owner asset account
     */
    v1199: new EventType(
        'PhalaStakePoolv2.OwnerRewardsWithdrawn',
        sts.struct({
            pid: sts.bigint(),
            user: v1199.AccountId32,
            amount: sts.bigint(),
        })
    ),
}

export const poolWorkerRemoved =  {
    name: 'PhalaStakePoolv2.PoolWorkerRemoved' as const,
    /**
     * A worker is removed from a pool.
     * 
     * Affected states:
     * - the worker item in [`WorkerAssignments`] is removed
     * - the worker is removed from the [`Pools`] item
     */
    v1199: new EventType(
        'PhalaStakePoolv2.PoolWorkerRemoved',
        sts.struct({
            pid: sts.bigint(),
            worker: v1199.Public,
        })
    ),
}

export const workerReclaimed =  {
    name: 'PhalaStakePoolv2.WorkerReclaimed' as const,
    /**
     * A worker is reclaimed from the pool
     */
    v1199: new EventType(
        'PhalaStakePoolv2.WorkerReclaimed',
        sts.struct({
            pid: sts.bigint(),
            worker: v1199.Public,
        })
    ),
}

export const rewardReceived =  {
    name: 'PhalaStakePoolv2.RewardReceived' as const,
    /**
     * The amount of reward that distributed to owner and stakers
     */
    v1199: new EventType(
        'PhalaStakePoolv2.RewardReceived',
        sts.struct({
            pid: sts.bigint(),
            toOwner: sts.bigint(),
            toStakers: sts.bigint(),
        })
    ),
}

export const workingStarted =  {
    name: 'PhalaStakePoolv2.WorkingStarted' as const,
    /**
     * The amount of stakes for a worker to start computing
     */
    v1199: new EventType(
        'PhalaStakePoolv2.WorkingStarted',
        sts.struct({
            pid: sts.bigint(),
            worker: v1199.Public,
            amount: sts.bigint(),
        })
    ),
}
