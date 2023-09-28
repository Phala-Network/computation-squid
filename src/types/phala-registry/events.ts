import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1160 from '../v1160'
import * as v1182 from '../v1182'
import * as v1199 from '../v1199'
import * as v1260 from '../v1260'

export const workerAdded =  {
    name: 'PhalaRegistry.WorkerAdded' as const,
    v1160: new EventType(
        'PhalaRegistry.WorkerAdded',
        sts.struct({
            pubkey: v1160.Public,
        })
    ),
    v1182: new EventType(
        'PhalaRegistry.WorkerAdded',
        sts.struct({
            pubkey: v1182.Public,
            confidenceLevel: sts.number(),
        })
    ),
    v1199: new EventType(
        'PhalaRegistry.WorkerAdded',
        sts.struct({
            pubkey: v1199.Public,
            attestationProvider: sts.option(() => v1199.AttestationProvider),
            confidenceLevel: sts.number(),
        })
    ),
    v1260: new EventType(
        'PhalaRegistry.WorkerAdded',
        sts.struct({
            pubkey: v1260.Public,
            attestationProvider: sts.option(() => v1260.AttestationProvider),
            confidenceLevel: sts.number(),
        })
    ),
}

export const workerUpdated =  {
    name: 'PhalaRegistry.WorkerUpdated' as const,
    v1160: new EventType(
        'PhalaRegistry.WorkerUpdated',
        sts.struct({
            pubkey: v1160.Public,
        })
    ),
    v1182: new EventType(
        'PhalaRegistry.WorkerUpdated',
        sts.struct({
            pubkey: v1182.Public,
            confidenceLevel: sts.number(),
        })
    ),
    v1199: new EventType(
        'PhalaRegistry.WorkerUpdated',
        sts.struct({
            pubkey: v1199.Public,
            attestationProvider: sts.option(() => v1199.AttestationProvider),
            confidenceLevel: sts.number(),
        })
    ),
    v1260: new EventType(
        'PhalaRegistry.WorkerUpdated',
        sts.struct({
            pubkey: v1260.Public,
            attestationProvider: sts.option(() => v1260.AttestationProvider),
            confidenceLevel: sts.number(),
        })
    ),
}

export const initialScoreSet =  {
    name: 'PhalaRegistry.InitialScoreSet' as const,
    v1182: new EventType(
        'PhalaRegistry.InitialScoreSet',
        sts.struct({
            pubkey: v1182.Public,
            initScore: sts.number(),
        })
    ),
}
