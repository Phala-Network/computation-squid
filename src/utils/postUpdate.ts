import {BigDecimal} from '@subsquid/big-decimal'
import assert from 'assert'
import {groupBy} from 'lodash'
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

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000

const postUpdate = async (ctx: Ctx): Promise<void> => {
  ctx.log.info(`1 ${new Date().toISOString()}`)
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

  const delegationValueRecords: DelegationValueRecord[] = []
  const basePoolAprRecords: BasePoolAprRecord[] = []

  const getApr = (basePool: BasePool): BasePoolAprRecord => {
    const {budgetPerBlock, treasuryRatio} = tokenomicParameters
    const {averageBlockTime, idleWorkerShares} = globalState
    const value = basePool.aprMultiplier
      .times(budgetPerBlock)
      .times(BigDecimal(1).minus(treasuryRatio))
      .times(ONE_YEAR)
      .div(averageBlockTime)
      .div(idleWorkerShares)

    return createBasePoolAprRecord({
      basePool,
      value,
      updatedTime,
    })
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
  const delegationMap = groupBy(delegations, (x) => x.account.id)

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.StakePool) {
      updateDelegationValue(
        delegation,
        assertGet(basePoolMap, delegation.basePool.id)
      )
    }
  }

  ctx.log.info(`2 ${new Date().toISOString()}`)

  const accountMap = await ctx.store.find(Account).then(toMap)

  for (const [, account] of accountMap) {
    const accountDelegations = delegationMap[account.id]
    if (accountDelegations === undefined) continue
    const accountStakePoolDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.StakePool
    )
    account.stakePoolValue = sum(
      ...accountStakePoolDelegations.map((x) => x.value)
    )
    account.stakePoolAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountStakePoolDelegations
    )
  }
  ctx.log.info(`2-1 ${new Date().toISOString()}`)

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
    basePoolAprRecords.push(getApr(basePool))
  }
  ctx.log.info(`3 ${new Date().toISOString()}`)

  for (const delegation of delegations) {
    if (delegation.basePool.kind === BasePoolKind.Vault) {
      updateDelegationValue(
        delegation,
        assertGet(basePoolMap, delegation.basePool.id)
      )
    }
  }
  ctx.log.info(`4 ${new Date().toISOString()}`)

  for (const [, account] of accountMap) {
    const accountDelegations = delegationMap[account.id]
    if (accountDelegations === undefined) continue
    const accountVaultDelegations = accountDelegations.filter(
      (x) => x.basePool.kind === BasePoolKind.Vault
    )
    account.vaultValue = sum(...accountVaultDelegations.map((x) => x.value))

    delegationValueRecords.push(
      createDelegationValueRecord({
        account,
        value: account.vaultValue.plus(account.stakePoolValue),
        updatedTime,
      })
    )

    account.vaultAvgAprMultiplier = getDelegationAvgAprMultiplier(
      accountVaultDelegations
    )
  }
  ctx.log.info(`5 ${new Date().toISOString()}`)

  await ctx.store.save(delegations)
  await ctx.store.save([...accountMap.values()])
  await ctx.store.save([...basePoolMap.values()])
  await ctx.store.save(delegationValueRecords)
  await ctx.store.save(basePoolAprRecords)
}

export default postUpdate
