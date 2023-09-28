import {sts, Result, Option, Bytes, BitSequence} from './support'

export const AttestationProvider: sts.Type<AttestationProvider> = sts.closedEnum(() => {
    return  {
        Dcap: sts.unit(),
        Ias: sts.unit(),
        Root: sts.unit(),
    }
})

export type AttestationProvider = AttestationProvider_Dcap | AttestationProvider_Ias | AttestationProvider_Root

export interface AttestationProvider_Dcap {
    __kind: 'Dcap'
}

export interface AttestationProvider_Ias {
    __kind: 'Ias'
}

export interface AttestationProvider_Root {
    __kind: 'Root'
}

export const Public = sts.bytes()
