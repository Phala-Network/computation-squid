import {BigDecimal} from '@subsquid/big-decimal'
import {Account, IdentityLevel, StakePool} from '../model'

export const getAccount = (m: Map<string, Account>, id: string): Account => {
  let acc = m.get(id)
  if (acc == null) {
    acc = new Account({
      id,
      identityLevel: IdentityLevel.Unknown,
      totalStakePoolValue: BigDecimal(0),
    })
    m.set(id, acc)
  }
  return acc
}

export const getStakePool = (
  m: Map<string, StakePool>,
  stakePool: StakePool
): StakePool => {
  let acc = m.get(stakePool.id)
  if (acc == null) {
    acc = stakePool
    m.set(stakePool.id, stakePool)
  }

  return acc
}

export const combineIds = (...args: Array<string | number | bigint>): string =>
  args.map((x) => x.toString()).join('-')

export const toMap = <T extends {id: string}, U extends keyof T = 'id'>(
  a: T[],
  key: U = 'id' as U
): Map<T[U], T> => new Map(a.map((a) => [a[key], a]))

export const max = (a: BigDecimal, b: BigDecimal): BigDecimal =>
  a.gt(b) ? a : b

export const min = (a: BigDecimal, b: BigDecimal): BigDecimal =>
  a.lt(b) ? a : b
