import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {Account} from '../model'

export const getAccount = (m: Map<string, Account>, id: string): Account => {
  let acc = m.get(id)
  if (acc == null) {
    acc = new Account({
      id,
      stakePoolValue: BigDecimal(0),
      stakePoolNftCount: 0,
      stakePoolAvgAprMultiplier: BigDecimal(0),
      stakePoolOwnerReward: BigDecimal(0),
      vaultValue: BigDecimal(0),
      vaultNftCount: 0,
      vaultAvgAprMultiplier: BigDecimal(0),
    })
    m.set(id, acc)
  }
  return acc
}

export const assertGet = <T, U>(map: Map<U, T>, key: U): T => {
  const value = map.get(key)
  assert(value)
  return value
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

export const sum = (...args: BigDecimal[]): BigDecimal =>
  args.reduce((a, b) => a.plus(b), BigDecimal(0))
