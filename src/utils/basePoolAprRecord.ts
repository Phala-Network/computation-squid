import {BigDecimal} from '@subsquid/big-decimal'
import {BasePool, BasePoolAprRecord} from '../model'
import {join} from './common'

export const createBasePoolAprRecord = ({
  basePool,
  value,
  updatedTime,
}: {
  basePool: BasePool
  value: BigDecimal
  updatedTime: Date
}): BasePoolAprRecord => {
  const dateString = updatedTime.toISOString().slice(0, 10)
  return new BasePoolAprRecord({
    id: join(basePool.id, dateString),
    basePool,
    value,
    updatedTime: new Date(`${dateString}T00:00:00.000Z`),
  })
}
