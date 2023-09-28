import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1 from '../v1'
import * as v1090 from '../v1090'

export const identitySet =  {
    name: 'Identity.IdentitySet' as const,
    /**
     *  A name was set or reset (which will remove all judgements). \[who\]
     */
    v1: new EventType(
        'Identity.IdentitySet',
        v1.AccountId
    ),
    /**
     * A name was set or reset (which will remove all judgements).
     */
    v1090: new EventType(
        'Identity.IdentitySet',
        sts.struct({
            who: v1090.AccountId32,
        })
    ),
}

export const identityCleared =  {
    name: 'Identity.IdentityCleared' as const,
    /**
     *  A name was cleared, and the given balance returned. \[who, deposit\]
     */
    v1: new EventType(
        'Identity.IdentityCleared',
        sts.tuple([v1.AccountId, v1.Balance])
    ),
    /**
     * A name was cleared, and the given balance returned.
     */
    v1090: new EventType(
        'Identity.IdentityCleared',
        sts.struct({
            who: v1090.AccountId32,
            deposit: sts.bigint(),
        })
    ),
}

export const judgementGiven =  {
    name: 'Identity.JudgementGiven' as const,
    /**
     *  A judgement was given by a registrar. \[target, registrar_index\]
     */
    v1: new EventType(
        'Identity.JudgementGiven',
        sts.tuple([v1.AccountId, v1.RegistrarIndex])
    ),
    /**
     * A judgement was given by a registrar.
     */
    v1090: new EventType(
        'Identity.JudgementGiven',
        sts.struct({
            target: v1090.AccountId32,
            registrarIndex: sts.number(),
        })
    ),
}
