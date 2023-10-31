import {type Store} from '@subsquid/typeorm-store'
import {IdentityJudgement, type Account} from '../model'
import {type ProcessorContext} from '../processor'
import {IdentityIdentityOfStorage} from '../types/storage'
import {getAccount} from './common'
import {decodeAddress} from './converter'

const decoder = new TextDecoder()

export const queryIdentities = async (
  ctx: ProcessorContext<Store>,
  accountIds: string[],
  accountMap: Map<string, Account>,
): Promise<void> => {
  const identityOf = new IdentityIdentityOfStorage(
    ctx,
    ctx.blocks[ctx.blocks.length - 1].header,
  )
  const res = await identityOf.asV1.getMany(accountIds.map(decodeAddress))
  for (let i = 0; i < res.length; i++) {
    const account = getAccount(accountMap, accountIds[i])
    const registration = res[i]
    if (registration != null) {
      if ('value' in registration.info.display) {
        account.identityDisplay = decoder
          .decode(registration.info.display.value)
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
