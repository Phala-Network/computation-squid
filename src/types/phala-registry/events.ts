import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1240 from '../v1240'
import * as v1260 from '../v1260'

export const workerAdded =  {
    name: 'PhalaRegistry.WorkerAdded' as const,
    v1240: new EventType(
        'PhalaRegistry.WorkerAdded',
        sts.struct({
            pubkey: v1240.Public,
            attestationProvider: sts.option(() => v1240.AttestationProvider),
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
    v1240: new EventType(
        'PhalaRegistry.WorkerUpdated',
        sts.struct({
            pubkey: v1240.Public,
            attestationProvider: sts.option(() => v1240.AttestationProvider),
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
    v1240: new EventType(
        'PhalaRegistry.InitialScoreSet',
        sts.struct({
            pubkey: v1240.Public,
            initScore: sts.number(),
        })
    ),
}
