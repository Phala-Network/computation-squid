import {BigDecimal} from '@subsquid/big-decimal'
import {In} from 'typeorm'
import {Account, BasePool, BasePoolKind} from '../model'
import {Ctx} from '../processor'
import {updateSharePrice} from './basePool'
import {assertGet, toMap} from './common'
import {getAvgAprMultiplier, updateDelegationValue} from './delegation'

const handlePriceChange = async (ctx: Ctx, pids: string[]): Promise<void> => {
  const updatedAccounts = await ctx.store.find(Account, {
    where: {delegations: {basePool: {id: In(pids)}}},
    relations: {
      delegations: {
        account: true,
        basePool: true,
        delegationNft: true,
        withdrawalNft: true,
      },
    },
  })
  const accountMap = toMap(updatedAccounts)

  const delegations = []

  for (const account of updatedAccounts) {
    account.vaultValue = BigDecimal(0)
    account.stakePoolValue = BigDecimal(0)
    for (const delegation of account.delegations) {
      if (pids.includes(delegation.basePool.id)) {
        updateDelegationValue(delegation, delegation.basePool)
        delegations.push(delegation)
      }
      if (delegation.basePool.kind === BasePoolKind.Vault) {
        account.vaultValue = account.vaultValue.plus(delegation.value)
      } else {
        account.stakePoolValue = account.stakePoolValue.plus(delegation.value)
      }
    }
    account.vaultAvgAprMultiplier = getAvgAprMultiplier(
      account.delegations.filter((x) => x.basePool.kind === BasePoolKind.Vault)
    )

    account.stakePoolAvgAprMultiplier = getAvgAprMultiplier(
      account.delegations.filter(
        (x) => x.basePool.kind === BasePoolKind.StakePool
      )
    )
  }

  const updatedVaults = await ctx.store.find(BasePool, {
    where: {
      kind: BasePoolKind.Vault,
      account: {id: In([...accountMap.keys()])},
    },
    relations: {owner: true, account: true},
  })

  for (const vault of updatedVaults) {
    const account = assertGet(accountMap, vault.account.id)
    vault.aprMultiplier = account.stakePoolAvgAprMultiplier
    vault.totalValue = vault.freeValue.plus(account.stakePoolValue)
    updateSharePrice(vault)
  }
  await ctx.store.save(delegations)
  await ctx.store.save(updatedAccounts)
  await ctx.store.save(updatedVaults)

  const updatedVaultDelegations = []
  const updatedVaultDelegatedAccountIds = updatedVaults.map((x) => x.id)
  const vaultDelegatedAccounts = await ctx.store.find(Account, {
    where: {delegations: {basePool: {id: In(updatedVaultDelegatedAccountIds)}}},
    relations: {
      delegations: {
        account: true,
        basePool: true,
        delegationNft: true,
        withdrawalNft: true,
      },
    },
  })

  for (const account of vaultDelegatedAccounts) {
    account.vaultValue = BigDecimal(0)
    for (const delegation of account.delegations) {
      if (updatedVaultDelegatedAccountIds.includes(delegation.basePool.id)) {
        updateDelegationValue(delegation, delegation.basePool)
        updatedVaultDelegations.push(delegation)
      }
      if (delegation.basePool.kind === BasePoolKind.Vault) {
        account.vaultValue = account.vaultValue.plus(delegation.value)
      }
    }

    account.vaultAvgAprMultiplier = getAvgAprMultiplier(
      account.delegations.filter((x) => x.basePool.kind === BasePoolKind.Vault)
    )
  }

  await ctx.store.save(updatedVaultDelegations)
  await ctx.store.save(vaultDelegatedAccounts)
}

export default handlePriceChange
