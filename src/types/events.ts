import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result, Option} from './support'
import * as v1191 from './v1191'

export class IdentityIdentityClearedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'Identity.IdentityCleared')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A name was cleared, and the given balance returned.
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('Identity.IdentityCleared') === '569627bf2a8105e3949fd62dcaae8174fb02f8afedb8e5d8a7fecda5d63b25c3'
  }

  /**
   * A name was cleared, and the given balance returned.
   */
  get asV1191(): {who: Uint8Array, deposit: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class IdentityIdentitySetEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'Identity.IdentitySet')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A name was set or reset (which will remove all judgements).
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('Identity.IdentitySet') === 'b8a0d2208835f6ada60dd21cd93533d703777b3779109a7c6a2f26bad68c2f3b'
  }

  /**
   * A name was set or reset (which will remove all judgements).
   */
  get asV1191(): {who: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class IdentityJudgementGivenEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'Identity.JudgementGiven')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A judgement was given by a registrar.
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('Identity.JudgementGiven') === '0771fa05d0977d28db0dee420efa5c006fa01a48edbd0b5b50cba5ea1d98b1b8'
  }

  /**
   * A judgement was given by a registrar.
   */
  get asV1191(): {target: Uint8Array, registrarIndex: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaBasePoolWithdrawalEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaBasePool.Withdrawal')
    this._chain = ctx._chain
    this.event = event
  }

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
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaBasePool.Withdrawal') === '9505ed8255acf2383138ec1d4bc2e9340bcfad91006cfdf9f1bb16911b7e8dcd'
  }

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
  get asV1191(): {pid: bigint, user: Uint8Array, amount: bigint, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaBasePoolWithdrawalQueuedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaBasePool.WithdrawalQueued')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A withdrawal request is inserted to a queue
   * 
   * Affected states:
   * - a new item is inserted to or an old item is being replaced by the new item in the
   *   withdraw queue in [`Pools`]
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaBasePool.WithdrawalQueued') === '1a90b37fe35b57535681edf54bc9a7b3c018e99bc657c379f89e9e2e3f46780e'
  }

  /**
   * A withdrawal request is inserted to a queue
   * 
   * Affected states:
   * - a new item is inserted to or an old item is being replaced by the new item in the
   *   withdraw queue in [`Pools`]
   */
  get asV1191(): {pid: bigint, user: Uint8Array, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationBenchmarkUpdatedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.BenchmarkUpdated')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Benchmark Updated
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.BenchmarkUpdated') === 'bf11f26c57bc5a22fb034fbf2a7aeee05ab0bc45f2a8a333f9e31eae55391087'
  }

  /**
   * Benchmark Updated
   */
  get asV1191(): {session: Uint8Array, pInstant: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationSessionBoundEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.SessionBound')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker & session are bounded.
   * 
   * Affected states:
   * - [`SessionBindings`] for the session account is pointed to the worker
   * - [`WorkerBindings`] for the worker is pointed to the session account
   * - the worker info at [`Sessions`] is updated with `Ready` state
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.SessionBound') === 'f46e4c120214de2ad267cd7a520409879e8f20c8fed92bda090ef495de03ca3d'
  }

  /**
   * Worker & session are bounded.
   * 
   * Affected states:
   * - [`SessionBindings`] for the session account is pointed to the worker
   * - [`WorkerBindings`] for the worker is pointed to the session account
   * - the worker info at [`Sessions`] is updated with `Ready` state
   */
  get asV1191(): {session: Uint8Array, worker: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationSessionSettledEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.SessionSettled')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker settled successfully.
   * 
   * It results in the v in [`Sessions`] being updated. It also indicates the downstream
   * stake pool has received the computing reward (payout), and the treasury has received the
   * tax.
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.SessionSettled') === 'ffc821674f60c9133eb49c3cf9ce9042e58fca0d906787401561ee8f598b62a4'
  }

  /**
   * Worker settled successfully.
   * 
   * It results in the v in [`Sessions`] being updated. It also indicates the downstream
   * stake pool has received the computing reward (payout), and the treasury has received the
   * tax.
   */
  get asV1191(): {session: Uint8Array, vBits: bigint, payoutBits: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationSessionUnboundEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.SessionUnbound')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker & worker are unbound.
   * 
   * Affected states:
   * - [`SessionBindings`] for the session account is removed
   * - [`WorkerBindings`] for the worker is removed
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.SessionUnbound') === 'f46e4c120214de2ad267cd7a520409879e8f20c8fed92bda090ef495de03ca3d'
  }

  /**
   * Worker & worker are unbound.
   * 
   * Affected states:
   * - [`SessionBindings`] for the session account is removed
   * - [`WorkerBindings`] for the worker is removed
   */
  get asV1191(): {session: Uint8Array, worker: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationTokenomicParametersChangedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.TokenomicParametersChanged')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Tokenomic parameter changed.
   * 
   * Affected states:
   * - [`TokenomicParameters`] is updated.
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.TokenomicParametersChanged') === '01f2f9c28aa1d4d36a81ff042620b6677d25bf07c2bf4acc37b58658778a4fca'
  }

  /**
   * Tokenomic parameter changed.
   * 
   * Affected states:
   * - [`TokenomicParameters`] is updated.
   */
  get asV1191(): null {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationWorkerEnterUnresponsiveEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.WorkerEnterUnresponsive')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker enters unresponsive state.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated from `WorkerIdle` to `WorkerUnresponsive`
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.WorkerEnterUnresponsive') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
  }

  /**
   * Worker enters unresponsive state.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated from `WorkerIdle` to `WorkerUnresponsive`
   */
  get asV1191(): {session: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationWorkerExitUnresponsiveEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.WorkerExitUnresponsive')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker returns to responsive state.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated from `WorkerUnresponsive` to `WorkerIdle`
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.WorkerExitUnresponsive') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
  }

  /**
   * Worker returns to responsive state.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated from `WorkerUnresponsive` to `WorkerIdle`
   */
  get asV1191(): {session: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationWorkerReclaimedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.WorkerReclaimed')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker is reclaimed, with its slash settled.
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.WorkerReclaimed') === '2acf61fd8096c1c9e960d99c92081c668a3e12bf02faf545a8412185ed26c1c3'
  }

  /**
   * Worker is reclaimed, with its slash settled.
   */
  get asV1191(): {session: Uint8Array, originalStake: bigint, slashed: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationWorkerStartedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.WorkerStarted')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A worker starts computing.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated with `WorkerIdle` state
   * - [`NextSessionId`] for the session is incremented
   * - [`Stakes`] for the session is updated
   * - [`OnlineWorkers`] is incremented
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.WorkerStarted') === '012bfc0408798da4d4b2bfbbc98beeb36833493fa36125d9ec82eedf5f1a8874'
  }

  /**
   * A worker starts computing.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated with `WorkerIdle` state
   * - [`NextSessionId`] for the session is incremented
   * - [`Stakes`] for the session is updated
   * - [`OnlineWorkers`] is incremented
   */
  get asV1191(): {session: Uint8Array, initV: bigint, initP: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaComputationWorkerStoppedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaComputation.WorkerStopped')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Worker stops computing.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated with `WorkerCoolingDown` state
   * - [`OnlineWorkers`] is decremented
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaComputation.WorkerStopped') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
  }

  /**
   * Worker stops computing.
   * 
   * Affected states:
   * - the worker info at [`Sessions`] is updated with `WorkerCoolingDown` state
   * - [`OnlineWorkers`] is decremented
   */
  get asV1191(): {session: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaRegistryInitialScoreSetEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaRegistry.InitialScoreSet')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaRegistry.InitialScoreSet') === '9178da6c60711edb6a539f26f333d754493f4e28ed8719c2f7892f1fe44e9b03'
  }

  get asV1191(): {pubkey: Uint8Array, initScore: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaRegistryWorkerAddedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaRegistry.WorkerAdded')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaRegistry.WorkerAdded') === '62aabfc3b7ad514db79224f111b8a77d10eec5bfb10570491e4ae9114115d90c'
  }

  get asV1191(): {pubkey: Uint8Array, attestationProvider: (v1191.AttestationProvider | undefined), confidenceLevel: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaRegistryWorkerUpdatedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaRegistry.WorkerUpdated')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaRegistry.WorkerUpdated') === '62aabfc3b7ad514db79224f111b8a77d10eec5bfb10570491e4ae9114115d90c'
  }

  get asV1191(): {pubkey: Uint8Array, attestationProvider: (v1191.AttestationProvider | undefined), confidenceLevel: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2ContributionEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.Contribution')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Someone contributed to a pool
   * 
   * Affected states:
   * - the stake related fields in [`Pools`]
   * - the user P-PHA balance reduced
   * - the user recive ad share NFT once contribution succeeded
   * - when there was any request in the withdraw queue, the action may trigger withdrawals
   *   ([`Withdrawal`](#variant.Withdrawal) event)
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.Contribution') === '9505ed8255acf2383138ec1d4bc2e9340bcfad91006cfdf9f1bb16911b7e8dcd'
  }

  /**
   * Someone contributed to a pool
   * 
   * Affected states:
   * - the stake related fields in [`Pools`]
   * - the user P-PHA balance reduced
   * - the user recive ad share NFT once contribution succeeded
   * - when there was any request in the withdraw queue, the action may trigger withdrawals
   *   ([`Withdrawal`](#variant.Withdrawal) event)
   */
  get asV1191(): {pid: bigint, user: Uint8Array, amount: bigint, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolCapacitySetEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolCapacitySet')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * The stake capacity of the pool is updated
   * 
   * Affected states:
   * - the `cap` field in [`Pools`] is updated
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolCapacitySet') === 'a87d0aee1155f25dee021b1bbfe934015082d92b9cb56be362d0c7f8c6b91215'
  }

  /**
   * The stake capacity of the pool is updated
   * 
   * Affected states:
   * - the `cap` field in [`Pools`] is updated
   */
  get asV1191(): {pid: bigint, cap: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolCommissionSetEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolCommissionSet')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * The commission of a pool is updated
   * 
   * The commission ratio is represented by an integer. The real value is
   * `commission / 1_000_000u32`.
   * 
   * Affected states:
   * - the `payout_commission` field in [`Pools`] is updated
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolCommissionSet') === 'f9fd566d432542f7d455c2c329ace5fed0f06ab260c0f1a71f38b55f59535a53'
  }

  /**
   * The commission of a pool is updated
   * 
   * The commission ratio is represented by an integer. The real value is
   * `commission / 1_000_000u32`.
   * 
   * Affected states:
   * - the `payout_commission` field in [`Pools`] is updated
   */
  get asV1191(): {pid: bigint, commission: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolCreatedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolCreated')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A stake pool is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolCreated') === '443db31f743a70c8cb7b298e12205d1672956da603edac4d4439cd0cb47151ce'
  }

  /**
   * A stake pool is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get asV1191(): {owner: Uint8Array, pid: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }

  /**
   * A stake pool is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get isV1192(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolCreated') === '77d054f2895355205eee58ebebc81d6f921ee3fd49397b9b45e24c063a210cd1'
  }

  /**
   * A stake pool is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get asV1192(): {owner: Uint8Array, pid: bigint, cid: number} {
    assert(this.isV1192)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolWhitelistCreatedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolWhitelistCreated')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A pool contribution whitelist is added
   * 
   * - lazy operated when the first staker is added to the whitelist
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolWhitelistCreated') === '15b8ba175316d055bb1de5f91f6ab44e684ba1a815854b2993f0826794d4be6f'
  }

  /**
   * A pool contribution whitelist is added
   * 
   * - lazy operated when the first staker is added to the whitelist
   */
  get asV1191(): {pid: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolWhitelistDeletedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolWhitelistDeleted')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * The pool contribution whitelist is deleted
   * 
   * - lazy operated when the last staker is removed from the whitelist
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolWhitelistDeleted') === '15b8ba175316d055bb1de5f91f6ab44e684ba1a815854b2993f0826794d4be6f'
  }

  /**
   * The pool contribution whitelist is deleted
   * 
   * - lazy operated when the last staker is removed from the whitelist
   */
  get asV1191(): {pid: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolWhitelistStakerAddedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolWhitelistStakerAdded')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A staker is added to the pool contribution whitelist
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolWhitelistStakerAdded') === '878e163cf2bf9490c1cc3cd41821175e05b15c1873eef6163ce7ef9cecb30b12'
  }

  /**
   * A staker is added to the pool contribution whitelist
   */
  get asV1191(): {pid: bigint, staker: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolWhitelistStakerRemovedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolWhitelistStakerRemoved')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A staker is removed from the pool contribution whitelist
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolWhitelistStakerRemoved') === '878e163cf2bf9490c1cc3cd41821175e05b15c1873eef6163ce7ef9cecb30b12'
  }

  /**
   * A staker is removed from the pool contribution whitelist
   */
  get asV1191(): {pid: bigint, staker: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolWorkerAddedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolWorkerAdded')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A worker is added to the pool
   * 
   * Affected states:
   * - the `worker` is added to the vector `workers` in [`Pools`]
   * - the worker in the [`WorkerAssignments`] is pointed to `pid`
   * - the worker-session binding is updated in `computation` pallet ([`WorkerBindings`](computation::pallet::WorkerBindings),
   *   [`SessionBindings`](computation::pallet::SessionBindings))
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolWorkerAdded') === '8d75aa5902ff40e3a60cd8b7965380236366ed31cdea19f4c680163bd2d08301'
  }

  /**
   * A worker is added to the pool
   * 
   * Affected states:
   * - the `worker` is added to the vector `workers` in [`Pools`]
   * - the worker in the [`WorkerAssignments`] is pointed to `pid`
   * - the worker-session binding is updated in `computation` pallet ([`WorkerBindings`](computation::pallet::WorkerBindings),
   *   [`SessionBindings`](computation::pallet::SessionBindings))
   */
  get asV1191(): {pid: bigint, worker: Uint8Array, session: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2PoolWorkerRemovedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.PoolWorkerRemoved')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A worker is removed from a pool.
   * 
   * Affected states:
   * - the worker item in [`WorkerAssignments`] is removed
   * - the worker is removed from the [`Pools`] item
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.PoolWorkerRemoved') === '3eddad70bc8df6b13283af1a5095e74f20ea2ecaeb63ab0291ae1f7f937c817b'
  }

  /**
   * A worker is removed from a pool.
   * 
   * Affected states:
   * - the worker item in [`WorkerAssignments`] is removed
   * - the worker is removed from the [`Pools`] item
   */
  get asV1191(): {pid: bigint, worker: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2RewardReceivedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.RewardReceived')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * The amount of reward that distributed to owner and stakers
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.RewardReceived') === 'ae6b7d16510f97a08b26da4e220f708f64330be952422280b4486922498b1e73'
  }

  /**
   * The amount of reward that distributed to owner and stakers
   */
  get asV1191(): {pid: bigint, toOwner: bigint, toStakers: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2WithdrawalEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.Withdrawal')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Some stake was withdrawn from a pool
   * 
   * Affected states:
   * - the stake related fields in [`Pools`]
   * - the user asset account
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.Withdrawal') === '9505ed8255acf2383138ec1d4bc2e9340bcfad91006cfdf9f1bb16911b7e8dcd'
  }

  /**
   * Some stake was withdrawn from a pool
   * 
   * Affected states:
   * - the stake related fields in [`Pools`]
   * - the user asset account
   */
  get asV1191(): {pid: bigint, user: Uint8Array, amount: bigint, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2WithdrawalQueuedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.WithdrawalQueued')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A withdrawal request is inserted to a queue
   * 
   * Affected states:
   * - a new item is inserted to or an old item is being replaced by the new item in the
   *   withdraw queue in [`Pools`]
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.WithdrawalQueued') === '1a90b37fe35b57535681edf54bc9a7b3c018e99bc657c379f89e9e2e3f46780e'
  }

  /**
   * A withdrawal request is inserted to a queue
   * 
   * Affected states:
   * - a new item is inserted to or an old item is being replaced by the new item in the
   *   withdraw queue in [`Pools`]
   */
  get asV1191(): {pid: bigint, user: Uint8Array, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2WorkerReclaimedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.WorkerReclaimed')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A worker is reclaimed from the pool
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.WorkerReclaimed') === '3eddad70bc8df6b13283af1a5095e74f20ea2ecaeb63ab0291ae1f7f937c817b'
  }

  /**
   * A worker is reclaimed from the pool
   */
  get asV1191(): {pid: bigint, worker: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaStakePoolv2WorkingStartedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaStakePoolv2.WorkingStarted')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * The amount of stakes for a worker to start computing
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaStakePoolv2.WorkingStarted') === '3fc05699bb0352c7a8b8388ecc2140be70e6e6943d5df40c853f148bad7835bc'
  }

  /**
   * The amount of stakes for a worker to start computing
   */
  get asV1191(): {pid: bigint, worker: Uint8Array, amount: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaVaultContributionEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaVault.Contribution')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Someone contributed to a vault
   * 
   * Affected states:
   * - the stake related fields in [`Pools`]
   * - the user P-PHA balance reduced
   * - the user recive ad share NFT once contribution succeeded
   * - when there was any request in the withdraw queue, the action may trigger withdrawals
   *   ([`Withdrawal`](#variant.Withdrawal) event)
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaVault.Contribution') === '9505ed8255acf2383138ec1d4bc2e9340bcfad91006cfdf9f1bb16911b7e8dcd'
  }

  /**
   * Someone contributed to a vault
   * 
   * Affected states:
   * - the stake related fields in [`Pools`]
   * - the user P-PHA balance reduced
   * - the user recive ad share NFT once contribution succeeded
   * - when there was any request in the withdraw queue, the action may trigger withdrawals
   *   ([`Withdrawal`](#variant.Withdrawal) event)
   */
  get asV1191(): {pid: bigint, user: Uint8Array, amount: bigint, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaVaultOwnerSharesClaimedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaVault.OwnerSharesClaimed')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Owner shares is claimed by pool owner
   * Affected states:
   * - the shares related fields in [`Pools`]
   * - the nft related storages in rmrk and pallet unique
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaVault.OwnerSharesClaimed') === '1a90b37fe35b57535681edf54bc9a7b3c018e99bc657c379f89e9e2e3f46780e'
  }

  /**
   * Owner shares is claimed by pool owner
   * Affected states:
   * - the shares related fields in [`Pools`]
   * - the nft related storages in rmrk and pallet unique
   */
  get asV1191(): {pid: bigint, user: Uint8Array, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaVaultOwnerSharesGainedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaVault.OwnerSharesGained')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * Additional owner shares are mint into the pool
   * 
   * Affected states:
   * - the shares related fields in [`Pools`]
   * - last_share_price_checkpoint in [`Pools`]
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaVault.OwnerSharesGained') === '024befbdc0c5a0701ba3fae4994bcae359ebc500401b49addf76df720feae73c'
  }

  /**
   * Additional owner shares are mint into the pool
   * 
   * Affected states:
   * - the shares related fields in [`Pools`]
   * - last_share_price_checkpoint in [`Pools`]
   */
  get asV1191(): {pid: bigint, shares: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaVaultPoolCreatedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaVault.PoolCreated')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * A vault is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaVault.PoolCreated') === '443db31f743a70c8cb7b298e12205d1672956da603edac4d4439cd0cb47151ce'
  }

  /**
   * A vault is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get asV1191(): {owner: Uint8Array, pid: bigint} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }

  /**
   * A vault is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get isV1192(): boolean {
    return this._chain.getEventHash('PhalaVault.PoolCreated') === '720a4e6563b16af792d1a1fbbaddf69e57bccbbacc67267e9bbf437a48598f92'
  }

  /**
   * A vault is created by `owner`
   * 
   * Affected states:
   * - a new entry in [`Pools`] with the pid
   */
  get asV1192(): {owner: Uint8Array, pid: bigint, cid: number, poolAccountId: Uint8Array} {
    assert(this.isV1192)
    return this._chain.decodeEvent(this.event)
  }
}

export class PhalaVaultVaultCommissionSetEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'PhalaVault.VaultCommissionSet')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   * The commission of a vault is updated
   * 
   * The commission ratio is represented by an integer. The real value is
   * `commission / 1_000_000u32`.
   * 
   * Affected states:
   * - the `commission` field in [`Pools`] is updated
   */
  get isV1191(): boolean {
    return this._chain.getEventHash('PhalaVault.VaultCommissionSet') === 'f9fd566d432542f7d455c2c329ace5fed0f06ab260c0f1a71f38b55f59535a53'
  }

  /**
   * The commission of a vault is updated
   * 
   * The commission ratio is represented by an integer. The real value is
   * `commission / 1_000_000u32`.
   * 
   * Affected states:
   * - the `commission` field in [`Pools`] is updated
   */
  get asV1191(): {pid: bigint, commission: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class RmrkCoreCollectionCreatedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'RmrkCore.CollectionCreated')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('RmrkCore.CollectionCreated') === 'dc958f691410878b0d793639bd3f9fb3a8ce970a28347e92a46206ced4d8a51e'
  }

  get asV1191(): {issuer: Uint8Array, collectionId: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class RmrkCoreNftBurnedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'RmrkCore.NFTBurned')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('RmrkCore.NFTBurned') === 'fc5ff9c4111d52305604880c94a64db0356edd3340b9caa01f2f6c908badc224'
  }

  get asV1191(): {owner: Uint8Array, nftId: number, collectionId: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class RmrkCoreNftMintedEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'RmrkCore.NftMinted')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('RmrkCore.NftMinted') === '32be929f2001709c6bcec6083e9bd994b08d551dfcc516fd7efe7d2e2c858a63'
  }

  get asV1191(): {owner: v1191.AccountIdOrCollectionNftTuple, collectionId: number, nftId: number} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}

export class RmrkCorePropertySetEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'RmrkCore.PropertySet')
    this._chain = ctx._chain
    this.event = event
  }

  get isV1191(): boolean {
    return this._chain.getEventHash('RmrkCore.PropertySet') === '5df520dfc9fcf5fd8f05069053efac0b3b7a3e6a2685d9775346a147d3371d9e'
  }

  get asV1191(): {collectionId: number, maybeNftId: (number | undefined), key: Uint8Array, value: Uint8Array} {
    assert(this.isV1191)
    return this._chain.decodeEvent(this.event)
  }
}
