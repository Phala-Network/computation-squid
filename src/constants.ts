export const INITIAL_BLOCK = 3000000

export const TO_BLOCK =
  Bun.env.TO_BLOCK != null ? parseInt(Bun.env.TO_BLOCK) : undefined

export const BASE_POOL_ACCOUNT =
  '42qnPyfw3sbWMGGtTPPc2YFNZRKPGXswRszyQQjGs2FDxdim'

export const RPC_ENDPOINT =
  Bun.env.RPC_ENDPOINT || 'https://khala-rpc.dwellir.com'

export const ENABLE_SNAPSHOT = Bun.env.ENABLE_SNAPSHOT === '1'

export const FORCE_REFRESH_IDENTITY = Bun.env.FORCE_REFRESH_IDENTITY === '1'

export const CLEAR_WITHDRAWAL_DATE =
  typeof Bun.env.CLEAR_WITHDRAWAL_DATE === 'string'
    ? new Date(Bun.env.CLEAR_WITHDRAWAL_DATE)
    : undefined

export const CLEAR_WITHDRAWAL_THRESHOLD =
  Bun.env.CLEAR_WITHDRAWAL_THRESHOLD || '0.01'
