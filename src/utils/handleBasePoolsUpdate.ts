import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {In} from 'typeorm'
import {Account, BasePool, BasePoolKind, DelegationValueRecord} from '../model'
import {Ctx} from '../processor'
import {updateSharePrice} from './basePool'
import {assertGet, toMap} from './common'
import {getAvgAprMultiplier, updateDelegationValue} from './delegation'
import {createDelegationValueRecord} from './delegationValueRecord'

const handleBasePoolsUpdate = async (
  ctx: Ctx,
  pids: string[]
): Promise<void> => {
  const lastBlock = ctx.blocks.at(-1)
  assert(lastBlock)
  const updatedTime = new Date(lastBlock.header.timestamp)
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

  const delegationValueRecordMap = new Map<string, DelegationValueRecord>()
  const delegations = []

  for (const account of updatedAccounts) {
    let newVaultValue = BigDecimal(0)
    let newStakePoolValue = BigDecimal(0)
    for (const delegation of account.delegations) {
      if (pids.includes(delegation.basePool.id)) {
        updateDelegationValue(delegation, delegation.basePool)
        delegations.push(delegation)
      }
      if (delegation.basePool.kind === BasePoolKind.Vault) {
        newVaultValue = newVaultValue.plus(delegation.value)
      } else {
        newStakePoolValue = newStakePoolValue.plus(delegation.value)
      }
    }
    const newTotalValue = newStakePoolValue.plus(newVaultValue)
    if (!newTotalValue.eq(account.vaultValue.plus(account.stakePoolValue))) {
      const delegationValueRecord = createDelegationValueRecord({
        account,
        value: newTotalValue,
        updatedTime,
      })
      delegationValueRecordMap.set(
        delegationValueRecord.id,
        delegationValueRecord
      )
    }
    account.vaultValue = newVaultValue
    account.stakePoolValue = newStakePoolValue
    account.vaultAvgAprMultiplier = getAvgAprMultiplier(
      account.delegations.filter((x) => x.basePool.kind === BasePoolKind.Vault)
    )

    account.stakePoolAvgAprMultiplier = getAvgAprMultiplier(
      account.delegations.filter(
        (x) => x.basePool.kind === BasePoolKind.StakePool
      )
    )
  }

  await ctx.store.save(delegations)
  await ctx.store.save(updatedAccounts)

  const updatedVaults = await ctx.store.find(BasePool, {
    where: [
      {
        kind: BasePoolKind.Vault,
        account: {id: In([...accountMap.keys()])},
      },
      {
        kind: BasePoolKind.Vault,
        id: In(pids),
      },
    ],
    relations: {owner: true, account: true},
  })

  for (const vault of updatedVaults) {
    vault.aprMultiplier = vault.account.stakePoolAvgAprMultiplier.times(
      BigDecimal(1).minus(vault.commission)
    )
    vault.totalValue = vault.freeValue.plus(vault.account.stakePoolValue)
    updateSharePrice(vault)
  }

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
    let newVaultValue = BigDecimal(0)
    for (const delegation of account.delegations) {
      if (updatedVaultDelegatedAccountIds.includes(delegation.basePool.id)) {
        updateDelegationValue(delegation, delegation.basePool)
        updatedVaultDelegations.push(delegation)
      }
      if (delegation.basePool.kind === BasePoolKind.Vault) {
        newVaultValue = newVaultValue.plus(delegation.value)
      }
    }
    if (!newVaultValue.eq(account.vaultValue)) {
      account.vaultValue = newVaultValue
      const delegationValueRecord = createDelegationValueRecord({
        account,
        value: newVaultValue.plus(account.stakePoolValue),
        updatedTime,
      })
      delegationValueRecordMap.set(
        delegationValueRecord.id,
        delegationValueRecord
      )
    }

    account.vaultAvgAprMultiplier = getAvgAprMultiplier(
      account.delegations.filter((x) => x.basePool.kind === BasePoolKind.Vault)
    )
  }

  await ctx.store.save(updatedVaultDelegations)
  await ctx.store.save(vaultDelegatedAccounts)
  await ctx.store.save([...delegationValueRecordMap.values()])
}

export default handleBasePoolsUpdate
