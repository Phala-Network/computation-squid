import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {
  Account,
  BasePool,
  BasePoolAprRecord,
  BasePoolKind,
  Delegation,
  DelegationValueRecord,
  GlobalState,
} from '../model'
import {Ctx} from '../processor'
import {PhalaComputationTokenomicParametersStorage} from '../types/storage'
import {updateSharePrice} from './basePool'
import {createBasePoolAprRecord} from './basePoolAprRecord'
import {assertGet, sum, toMap} from './common'
import {fromBits} from './converter'
import {
  getDelegationAvgAprMultiplier,
  updateDelegationValue,
} from './delegation'
import {createDelegationValueRecord} from './delegationValueRecord'

const ONE_DAY = 24 * 60 * 60 * 1000
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000

const postUpdate = async (ctx: Ctx): Promise<void> => {
  const lastBlock = ctx.blocks.at(-1)
  assert(lastBlock)
  const updatedTime = new Date(lastBlock.header.timestamp)
  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})
  const tokenomicParameters =
    await new PhalaComputationTokenomicParametersStorage(
      ctx,
      lastBlock.header
    ).asV1191
      .get()
      .then((value) => {
        assert(value)
        return {
          phaRate: fromBits(value.phaRate),
          budgetPerBlock: fromBits(value.budgetPerBlock),
          vMax: fromBits(value.vMax),
          treasuryRatio: fromBits(value.treasuryRatio),
          re: fromBits(value.re),
          k: fromBits(value.k),
        }
      })

  const recordAccountTotalValue = async (
    account: Account,
    value: BigDecimal
  ): Promise<void> => {
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

  const recordApr = async (basePool: BasePool): Promise<void> => {
    const lastRecord = await ctx.store.findOne(BasePoolAprRecord, {
      order: {updatedTime: 'DESC'},
      where: {basePool: {id: basePool.id}},
      relations: {basePool: true},
    })
    const {budgetPerBlock, treasuryRatio} = tokenomicParameters
    const {averageBlockTime, idleWorkerShares} = globalState
    const value = basePool.aprMultiplier
      .times(budgetPerBlock)
      .times(BigDecimal(1).minus(treasuryRatio))
      .times(ONE_YEAR)
      .div(averageBlockTime)
      .div(idleWorkerShares)
    if (
      lastRecord == null ||
      lastRecord.updatedTime.getTime() < updatedTime.getTime() - ONE_DAY
    ) {
      const basePoolAprRecord = createBasePoolAprRecord({
        basePool,
        value,
        updatedTime,
      })
      await ctx.store.save(basePoolAprRecord)
    } else {
      lastRecord.value = value
      await ctx.store.save(lastRecord)
    }
  }

  const basePoolMap = await ctx.store
    .find(BasePool, {
      relations: {owner: true, account: true},
    })
    .then(toMap)

  const delegations = await ctx.store.find(Delegation, {
    relations: {
      account: true,
      basePool: true,
      delegationNft: true,
      withdrawalNft: true,
    },
  })

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.StakePool) {
      updateDelegationValue(
        delegation,
        assertGet(basePoolMap, delegation.basePool.id)
      )
    }
  }

  const accountMap = await ctx.store.find(Account).then(toMap)

  for (const [, account] of accountMap) {
    const accountStakePoolDelegations = delegations.filter(
      (x) =>
        x.basePool.kind === BasePoolKind.StakePool &&
        x.account.id === account.id
    )
    account.stakePoolValue = sum(
      ...accountStakePoolDelegations.map((x) => x.value)
    )
    account.stakePoolAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountStakePoolDelegations
    )
  }

  for (const [, basePool] of basePoolMap) {
    const account = assertGet(accountMap, basePool.account.id)
    if (basePool.kind === BasePoolKind.Vault) {
      const totalValue = basePool.freeValue.plus(account.stakePoolValue)
      basePool.aprMultiplier = account.stakePoolAvgAprMultiplier
        .times(BigDecimal(1).minus(basePool.commission))
        .times(account.stakePoolValue)
        .div(totalValue)
      basePool.totalValue = totalValue
      updateSharePrice(basePool)
    }
    await recordApr(basePool)
  }

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.Vault) {
      updateDelegationValue(
        delegation,
        assertGet(basePoolMap, delegation.basePool.id)
      )
    }
  }

  for (const [, account] of accountMap) {
    const accountVaultDelegations = delegations.filter(
      (x) =>
        x.basePool.kind === BasePoolKind.Vault && x.account.id === account.id
    )
    account.vaultValue = sum(...accountVaultDelegations.map((x) => x.value))

    await recordAccountTotalValue(
      account,
      account.vaultValue.plus(account.stakePoolValue)
    )

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations
    )
  }

  await ctx.store.save(delegations)
  await ctx.store.save([...accountMap.values()])
  await ctx.store.save([...basePoolMap.values()])
}

export default postUpdate
