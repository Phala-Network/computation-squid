import assert from 'assert'
import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {isHex} from '@subsquid/util-internal-hex'

export const assertGet = <T, U>(map: Map<U, T>, key: U): T => {
  const value = map.get(key)
  assert(value)
  return value
}

export const join = (...args: Array<string | number | bigint>): string =>
  args.map((x) => x.toString()).join('-')

export const toMap = <T extends {id: string}>(
  a: T[],
  fn: (a: T) => string = (a) => a.id,
): Map<string, T> => new Map(a.map((a) => [fn(a), a]))

export const max = (a: BigDecimal, b: BigDecimal): BigDecimal =>
  a.gt(b) ? a : b

export const min = (a: BigDecimal, b: BigDecimal): BigDecimal =>
  a.lt(b) ? a : b

export const sum = (...args: BigDecimal[]): BigDecimal =>
  args.reduce((a, b) => a.plus(b), BigDecimal(0))

export type JsonBigInt = string | number // Polkadot.js toJSON() BigInt type

export const toBigDecimal = (value: JsonBigInt | bigint): BigDecimal => {
  let convertedValue = value
  if (isHex(value)) {
    convertedValue = BigInt(value)
  }
  return BigDecimal(convertedValue)
}

export const toBalance = (value: JsonBigInt | bigint): BigDecimal =>
  toBigDecimal(value).div(1e12)

// divide by 2^64
export const fromBits = (value: JsonBigInt | bigint): BigDecimal =>
  toBigDecimal(value)
    .div(2n ** 64n)
    .round(6)

export const encodeAddress = (bytes: ss58.Bytes | Uint8Array): string =>
  ss58.codec('phala').encode(bytes)

export const decodeAddress = (address: string): ss58.Bytes =>
  ss58.codec('phala').decode(address)
