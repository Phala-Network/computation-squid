import {sts, Result, Option, Bytes, BitSequence} from './support'

export const AccountIdOrCollectionNftTuple: sts.Type<AccountIdOrCollectionNftTuple> = sts.closedEnum(() => {
    return  {
        AccountId: AccountId32,
        CollectionAndNftTuple: sts.tuple(() => [sts.number(), sts.number()]),
    }
})

export const AccountId32 = sts.bytes()

export type AccountIdOrCollectionNftTuple = AccountIdOrCollectionNftTuple_AccountId | AccountIdOrCollectionNftTuple_CollectionAndNftTuple

export interface AccountIdOrCollectionNftTuple_AccountId {
    __kind: 'AccountId'
    value: AccountId32
}

export interface AccountIdOrCollectionNftTuple_CollectionAndNftTuple {
    __kind: 'CollectionAndNftTuple'
    value: [number, number]
}

export type AccountId32 = Bytes
