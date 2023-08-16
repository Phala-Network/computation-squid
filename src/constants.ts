export const INITIAL_BLOCK = 2426198

export const TO_BLOCK =
  process.env.TO_BLOCK != null
    ? Number.parseInt(process.env.TO_BLOCK)
    : undefined

export const BASE_POOL_ACCOUNT =
  '42qnPyfw3sbWMGGtTPPc2YFNZRKPGXswRszyQQjGs2FDxdim'

export const RPC_ENDPOINT =
  process.env.RPC_ENDPOINT || 'https://phala-rpc.dwellir.com'

export const ENABLE_SNAPSHOT = process.env.ENABLE_SNAPSHOT === '1'

export const FORCE_REFRESH_IDENTITY = process.env.FORCE_REFRESH_IDENTITY === '1'

export const CLEAR_WITHDRAWAL_DATE =
  typeof process.env.CLEAR_WITHDRAWAL_DATE === 'string'
    ? new Date(process.env.CLEAR_WITHDRAWAL_DATE)
    : undefined

export const CLEAR_WITHDRAWAL_THRESHOLD =
  process.env.CLEAR_WITHDRAWAL_THRESHOLD || '0.01'
