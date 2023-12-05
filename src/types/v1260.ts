import type {Result, Option} from './support'

export type AttestationProvider = AttestationProvider_Root | AttestationProvider_Ias | AttestationProvider_Dcap

export interface AttestationProvider_Root {
    __kind: 'Root'
}

export interface AttestationProvider_Ias {
    __kind: 'Ias'
}

export interface AttestationProvider_Dcap {
    __kind: 'Dcap'
}
