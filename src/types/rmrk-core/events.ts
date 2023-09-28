import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1150 from '../v1150'
import * as v1170 from '../v1170'
import * as v1181 from '../v1181'

export const collectionCreated =  {
    name: 'RmrkCore.CollectionCreated' as const,
    v1150: new EventType(
        'RmrkCore.CollectionCreated',
        sts.struct({
            issuer: v1150.AccountId32,
            collectionId: sts.number(),
        })
    ),
}

export const nftMinted =  {
    name: 'RmrkCore.NftMinted' as const,
    v1150: new EventType(
        'RmrkCore.NftMinted',
        sts.struct({
            owner: v1150.AccountId32,
            collectionId: sts.number(),
            nftId: sts.number(),
        })
    ),
    v1170: new EventType(
        'RmrkCore.NftMinted',
        sts.struct({
            owner: v1170.AccountIdOrCollectionNftTuple,
            collectionId: sts.number(),
            nftId: sts.number(),
        })
    ),
}

export const nftBurned =  {
    name: 'RmrkCore.NFTBurned' as const,
    v1150: new EventType(
        'RmrkCore.NFTBurned',
        sts.struct({
            owner: v1150.AccountId32,
            nftId: sts.number(),
        })
    ),
    v1181: new EventType(
        'RmrkCore.NFTBurned',
        sts.struct({
            owner: v1181.AccountId32,
            nftId: sts.number(),
            collectionId: sts.number(),
        })
    ),
}

export const propertySet =  {
    name: 'RmrkCore.PropertySet' as const,
    v1150: new EventType(
        'RmrkCore.PropertySet',
        sts.struct({
            collectionId: sts.number(),
            maybeNftId: sts.option(() => sts.number()),
            key: sts.bytes(),
            value: sts.bytes(),
        })
    ),
}
