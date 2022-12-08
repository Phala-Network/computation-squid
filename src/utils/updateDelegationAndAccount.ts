import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {In} from 'typeorm'
import {
  Account,
  BasePool,
  BasePoolKind,
  Delegation,
  DelegationValueRecord,
} from '../model'
import {Ctx} from '../processor'
import {updateSharePrice} from './basePool'
import {sum} from './common'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './delegation'
import {createDelegationValueRecord} from './delegationValueRecord'

const updateDelegationAndAccount = async (
  ctx: Ctx,
  sharePriceUpdatedVaultIds: string[],
  sharePriceUpdatedStakePoolIds: string[],
  aprMultiplierUpdatedBasePoolIds: string[]
): Promise<void> => {
  const lastBlock = ctx.blocks.at(-1)
  assert(lastBlock)
  const updatedTime = new Date(lastBlock.header.timestamp)

  const recordAccountTotalValue = async (
    account: Account,
    value: BigDecimal
  ): Promise<void> => {
    const ONE_DAY = 24 * 60 * 60 * 1000
    const lastRecord = await ctx.store.findOne(DelegationValueRecord, {
      order: {updatedTime: 'DESC'},
      where: {account: {id: account.id}},
      relations: {account: true},
    })
    if (
      lastRecord == null ||
      lastRecord.updatedTime.getTime() < updatedTime.getTime() - ONE_DAY
    ) {
      const delegationValueRecord = createDelegationValueRecord({
        account,
        value,
        updatedTime,
      })
      await ctx.store.save(delegationValueRecord)
    } else {
      lastRecord.value = value
      await ctx.store.save(lastRecord)
    }
  }

  const accountIdsAffectedByStakePool = new Set<string>()
  const delegationsAffectedByStakePool = await ctx.store.find(Delegation, {
    where: {
      basePool: {
        id: In([
          ...new Set(
            ...sharePriceUpdatedStakePoolIds,
            ...aprMultiplierUpdatedBasePoolIds
          ),
        ]),
      },
    },
    relations: {
      account: true,
      basePool: true,
      delegationNft: true,
      withdrawalNft: true,
    },
  })

  const valueUpdatedDelegations = []

  for (const delegation of delegationsAffectedByStakePool) {
    if (sharePriceUpdatedStakePoolIds.includes(delegation.basePool.id)) {
      updateDelegationValue(delegation, delegation.basePool)
      valueUpdatedDelegations.push(delegation)
    }
    accountIdsAffectedByStakePool.add(delegation.account.id)
  }

  await ctx.store.save(valueUpdatedDelegations)

  const accountsAffectedByStakePool = await ctx.store.find(Account, {
    where: {id: In([...accountIdsAffectedByStakePool])},
    relations: {basePool: true, delegations: {basePool: true}},
  })
  const vaultIdsAffectedByAccount = new Set<string>()

  for (const account of accountsAffectedByStakePool) {
    const newStakePoolValue = sum(
      ...account.delegations
        .filter((x) => x.basePool.kind === BasePoolKind.StakePool)
        .map((x) => x.value)
    )

    await recordAccountTotalValue(
      account,
      newStakePoolValue.plus(account.vaultValue)
    )

    if (!account.stakePoolValue.eq(newStakePoolValue)) {
      account.stakePoolValue = newStakePoolValue
      if (account.basePool != null) {
        vaultIdsAffectedByAccount.add(account.basePool.id)
      }
    }
    account.stakePoolAvgAprMultiplier = getDelegationAvgAprMultiplier(
      account.delegations.filter(
        (x) => x.basePool.kind === BasePoolKind.StakePool
      )
    )
  }

  await ctx.store.save(accountsAffectedByStakePool)

  const vaultsAffectedByAccount = await ctx.store.find(BasePool, {
    where: {id: In([...vaultIdsAffectedByAccount])},
    relations: {owner: true, account: true},
  })

  for (const vault of vaultsAffectedByAccount) {
    vault.aprMultiplier = vault.account.stakePoolAvgAprMultiplier.times(
      BigDecimal(1).minus(vault.commission)
    )
    vault.totalValue = vault.freeValue.plus(vault.account.stakePoolValue)
    updateSharePrice(vault)
  }

  await ctx.store.save(vaultsAffectedByAccount)

  const accountIdsAffectedByVault = new Set<string>()
  const delegationsAffectedByVault = await ctx.store.find(Delegation, {
    where: {
      basePool: {
        id: In([
          ...new Set(
            ...vaultIdsAffectedByAccount,
            ...sharePriceUpdatedVaultIds
          ),
        ]),
      },
    },
    relations: {
      account: true,
      basePool: true,
      delegationNft: true,
      withdrawalNft: true,
    },
  })

  for (const delegation of delegationsAffectedByVault) {
    updateDelegationValue(delegation, delegation.basePool)
    accountIdsAffectedByVault.add(delegation.account.id)
  }

  await ctx.store.save(delegationsAffectedByVault)

  const accountsAffectedByVault = await ctx.store.find(Account, {
    where: {id: In([...accountIdsAffectedByVault])},
    relations: {delegations: {basePool: true}},
  })

  for (const account of accountsAffectedByVault) {
    const newVaultValue = sum(
      ...account.delegations
        .filter((x) => x.basePool.kind === BasePoolKind.Vault)
        .map((x) => x.value)
    )

    await recordAccountTotalValue(
      account,
      newVaultValue.plus(account.stakePoolValue)
    )

    if (!account.vaultValue.eq(newVaultValue)) {
      account.vaultValue = newVaultValue
    }

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      account.delegations.filter((x) => x.basePool.kind === BasePoolKind.Vault)
    )
  }

  await ctx.store.save(accountsAffectedByVault)
}

export default updateDelegationAndAccount
