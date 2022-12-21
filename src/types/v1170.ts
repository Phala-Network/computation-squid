import type {Result, Option} from './support'

export type AccountIdOrCollectionNftTuple = AccountIdOrCollectionNftTuple_AccountId | AccountIdOrCollectionNftTuple_CollectionAndNftTuple

export interface AccountIdOrCollectionNftTuple_AccountId {
    __kind: 'AccountId'
    value: Uint8Array
}

export interface AccountIdOrCollectionNftTuple_CollectionAndNftTuple {
    __kind: 'CollectionAndNftTuple'
    value: [number, number]
}
