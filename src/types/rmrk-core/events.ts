import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1240 from '../v1240'

export const collectionCreated =  {
    name: 'RmrkCore.CollectionCreated' as const,
    v1240: new EventType(
        'RmrkCore.CollectionCreated',
        sts.struct({
            issuer: v1240.AccountId32,
            collectionId: sts.number(),
        })
    ),
}

export const nftMinted =  {
    name: 'RmrkCore.NftMinted' as const,
    v1240: new EventType(
        'RmrkCore.NftMinted',
        sts.struct({
            owner: v1240.AccountIdOrCollectionNftTuple,
            collectionId: sts.number(),
            nftId: sts.number(),
        })
    ),
}

export const nftBurned =  {
    name: 'RmrkCore.NFTBurned' as const,
    v1240: new EventType(
        'RmrkCore.NFTBurned',
        sts.struct({
            owner: v1240.AccountId32,
            collectionId: sts.number(),
            nftId: sts.number(),
        })
    ),
}

export const propertySet =  {
    name: 'RmrkCore.PropertySet' as const,
    v1240: new EventType(
        'RmrkCore.PropertySet',
        sts.struct({
            collectionId: sts.number(),
            maybeNftId: sts.option(() => sts.number()),
            key: sts.bytes(),
            value: sts.bytes(),
        })
    ),
}
