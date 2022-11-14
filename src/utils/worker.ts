import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {TokenomicParameters, Session, Worker} from '../model'

type ConfidenceLevel = 1 | 2 | 3 | 4 | 5
function assertConfidenceLevel(n: number): asserts n is ConfidenceLevel {
  assert(n === 1 || n === 2 || n === 3 || n === 4 || n === 5)
}
const confidenceScoreMap: Record<ConfidenceLevel, string> = {
  1: '1',
  2: '1',
  3: '1',
  4: '0.8',
  5: '0.7',
}

export const updateWorkerSMinAndSMax = (
  worker: Worker,
  tokenomicParameters: TokenomicParameters
): void => {
  const {vMax, phaRate, re, k} = tokenomicParameters
  const {initialScore, confidenceLevel} = worker
  if (typeof initialScore === 'number') {
    worker.sMin = k.times(BigDecimal(initialScore).sqrt()).round(12, 0)
    assertConfidenceLevel(confidenceLevel)
    const confidenceScore = confidenceScoreMap[confidenceLevel]
    worker.sMax = vMax
      .div(re.minus(1).times(confidenceScore).add(1))
      .minus(BigDecimal(initialScore).mul('0.3').div(phaRate))
      .round(12, 0)
  }
}

export function updateWorkerShares(
  worker: Worker,
  session: Session
): asserts worker is Worker & {shares: BigDecimal} {
  const {v, pInstant} = session
  const {confidenceLevel} = worker
  assertConfidenceLevel(confidenceLevel)
  const confidenceScore = confidenceScoreMap[confidenceLevel]
  const shares = v
    .pow(2)
    .add(BigDecimal(2).mul(pInstant).mul(confidenceScore).pow(2))
    .sqrt()

  worker.shares = shares
}
