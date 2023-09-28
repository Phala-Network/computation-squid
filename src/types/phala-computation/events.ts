import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1199 from '../v1199'

export const workerStarted =  {
    name: 'PhalaComputation.WorkerStarted' as const,
    /**
     * A worker starts computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerIdle` state
     * - [`NextSessionId`] for the session is incremented
     * - [`Stakes`] for the session is updated
     * - [`OnlineWorkers`] is incremented
     */
    v1199: new EventType(
        'PhalaComputation.WorkerStarted',
        sts.struct({
            session: v1199.AccountId32,
            initV: sts.bigint(),
            initP: sts.number(),
        })
    ),
}

export const workerStopped =  {
    name: 'PhalaComputation.WorkerStopped' as const,
    /**
     * Worker stops computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerCoolingDown` state
     * - [`OnlineWorkers`] is decremented
     */
    v1199: new EventType(
        'PhalaComputation.WorkerStopped',
        sts.struct({
            session: v1199.AccountId32,
        })
    ),
}

export const workerReclaimed =  {
    name: 'PhalaComputation.WorkerReclaimed' as const,
    /**
     * Worker is reclaimed, with its slash settled.
     */
    v1199: new EventType(
        'PhalaComputation.WorkerReclaimed',
        sts.struct({
            session: v1199.AccountId32,
            originalStake: sts.bigint(),
            slashed: sts.bigint(),
        })
    ),
}

export const sessionBound =  {
    name: 'PhalaComputation.SessionBound' as const,
    /**
     * Worker & session are bounded.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is pointed to the worker
     * - [`WorkerBindings`] for the worker is pointed to the session account
     * - the worker info at [`Sessions`] is updated with `Ready` state
     */
    v1199: new EventType(
        'PhalaComputation.SessionBound',
        sts.struct({
            session: v1199.AccountId32,
            worker: v1199.Public,
        })
    ),
}

export const sessionUnbound =  {
    name: 'PhalaComputation.SessionUnbound' as const,
    /**
     * Worker & worker are unbound.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is removed
     * - [`WorkerBindings`] for the worker is removed
     */
    v1199: new EventType(
        'PhalaComputation.SessionUnbound',
        sts.struct({
            session: v1199.AccountId32,
            worker: v1199.Public,
        })
    ),
}

export const workerEnterUnresponsive =  {
    name: 'PhalaComputation.WorkerEnterUnresponsive' as const,
    /**
     * Worker enters unresponsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerIdle` to `WorkerUnresponsive`
     */
    v1199: new EventType(
        'PhalaComputation.WorkerEnterUnresponsive',
        sts.struct({
            session: v1199.AccountId32,
        })
    ),
}

export const workerExitUnresponsive =  {
    name: 'PhalaComputation.WorkerExitUnresponsive' as const,
    /**
     * Worker returns to responsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerUnresponsive` to `WorkerIdle`
     */
    v1199: new EventType(
        'PhalaComputation.WorkerExitUnresponsive',
        sts.struct({
            session: v1199.AccountId32,
        })
    ),
}

export const sessionSettled =  {
    name: 'PhalaComputation.SessionSettled' as const,
    /**
     * Worker settled successfully.
     * 
     * It results in the v in [`Sessions`] being updated. It also indicates the downstream
     * stake pool has received the computing reward (payout), and the treasury has received the
     * tax.
     */
    v1199: new EventType(
        'PhalaComputation.SessionSettled',
        sts.struct({
            session: v1199.AccountId32,
            vBits: sts.bigint(),
            payoutBits: sts.bigint(),
        })
    ),
}

export const tokenomicParametersChanged =  {
    name: 'PhalaComputation.TokenomicParametersChanged' as const,
    /**
     * Tokenomic parameter changed.
     * 
     * Affected states:
     * - [`TokenomicParameters`] is updated.
     */
    v1199: new EventType(
        'PhalaComputation.TokenomicParametersChanged',
        sts.unit()
    ),
}

export const benchmarkUpdated =  {
    name: 'PhalaComputation.BenchmarkUpdated' as const,
    /**
     * Benchmark Updated
     */
    v1199: new EventType(
        'PhalaComputation.BenchmarkUpdated',
        sts.struct({
            session: v1199.AccountId32,
            pInstant: sts.number(),
        })
    ),
}
