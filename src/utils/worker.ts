import {BigDecimal} from '@subsquid/big-decimal'
import {type Session, type Worker} from '../model'

type ConfidenceLevel = 1 | 2 | 3 | 4 | 5
const validateConfidenceLevel = (n: number): n is ConfidenceLevel =>
  n === 1 || n === 2 || n === 3 || n === 4 || n === 5

const confidenceScoreMap: Record<ConfidenceLevel, string> = {
  1: '1',
  2: '1',
  3: '1',
  4: '0.8',
  5: '0.7',
}

export function updateWorkerShares(
  worker: Worker,
  session: Session
): asserts worker is Worker & {shares: BigDecimal} {
  const {v, pInstant} = session
  const {confidenceLevel} = worker
  if (validateConfidenceLevel(confidenceLevel)) {
    const confidenceScore = confidenceScoreMap[confidenceLevel]
    const shares = v
      .pow(2)
      .add(BigDecimal(2).mul(pInstant).mul(confidenceScore).pow(2))
      .sqrt()

    worker.shares = shares
  }
}
