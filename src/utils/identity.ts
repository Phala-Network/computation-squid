import {decodeHex} from '@subsquid/substrate-processor'
import {type Account, IdentityJudgement} from '../model'
import {type SubstrateBlock} from '../processor'
import {identity} from '../types/storage'
import {getAccount} from './common'
import {decodeAddress} from './converter'

const decoder = new TextDecoder()

export const queryIdentities = async (
  block: SubstrateBlock,
  accountIds: string[],
  accountMap: Map<string, Account>,
): Promise<void> => {
  const res = await identity.identityOf.v1.getMany(
    block,
    accountIds.map(decodeAddress),
  )
  for (let i = 0; i < res.length; i++) {
    const account = getAccount(accountMap, accountIds[i])
    const registration = res[i]
    if (registration != null) {
      if ('value' in registration.info.display) {
        account.identityDisplay = decoder
          .decode(decodeHex(registration.info.display.value))
          .replace(/\0/g, '')
      } else {
        account.identityDisplay = null
      }
      if (registration.judgements.length > 0) {
        const judgements = registration.judgements.map(
          (j) => IdentityJudgement[j[1].__kind],
        )
        account.identityJudgements = judgements
        account.identityLevel = judgements[judgements.length - 1]
      }
    } else {
      account.identityLevel = null
      account.identityDisplay = null
      account.identityJudgements = null
    }
  }
}
