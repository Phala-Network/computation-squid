import {BigDecimal} from '@subsquid/big-decimal'
import {In} from 'typeorm'
import {Account, BasePool, BasePoolKind} from '../model'
import {Ctx} from '../processor'
import {updateDelegationValue} from './delegation'

const handlePriceChange = async (ctx: Ctx, pids: string[]): Promise<void> => {
  const updatedAccounts = await ctx.store.find(Account, {
    where: {
      delegations: {basePool: {id: In(pids)}},
    },
    relations: {
      delegations: {
        account: true,
        basePool: true,
        delegationNft: true,
        withdrawalNft: true,
      },
    },
  })

  const delegations = []

  for (const account of updatedAccounts) {
    for (const delegation of account.delegations) {
      updateDelegationValue(delegation, delegation.basePool)
      delegations.push(delegation)
    }
    account.vaultValue = account.delegations
      .filter((x) => x.basePool.kind === BasePoolKind.Vault)
      .reduce((a, b) => a.plus(b.value), BigDecimal(0))
    account.stakePoolValue = account.delegations
      .filter((x) => x.basePool.kind === BasePoolKind.StakePool)
      .reduce((a, b) => a.plus(b.value), BigDecimal(0))

    account.stakePoolAvgAprMultiplier = account.stakePoolValue.eq(0)
      ? BigDecimal(0)
      : account.delegations
          .filter((x) => x.basePool.kind === BasePoolKind.StakePool)
          .reduce(
            (a, b) => a.plus(b.value.times(b.basePool.aprMultiplier)),
            BigDecimal(0)
          )
          .div(account.stakePoolValue)
  }

  await ctx.store.save(delegations)
  await ctx.store.save(updatedAccounts)

  const vaults = await ctx.store.find(BasePool, {
    where: {kind: BasePoolKind.Vault},
    relations: {owner: true, account: true},
  })

  for (const vault of vaults) {
    vault.aprMultiplier = vault.account.stakePoolAvgAprMultiplier
  }
  await ctx.store.save(vaults)
}

export default handlePriceChange
