import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {BasePoolKind} from "./_basePoolKind"
import {Vault} from "./vault.model"
import {StakePool} from "./stakePool.model"
import {BasePoolWhitelist} from "./basePoolWhitelist.model"

@Entity_()
export class BasePool {
  constructor(props?: Partial<BasePool>) {
    Object.assign(this, props)
  }

  /**
   * pid
   */
  @PrimaryColumn_()
  id!: string

  /**
   * numeric pid for sorting
   */
  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  pid!: bigint

  /**
   * NFT collection id
   */
  @Column_("int4", {nullable: false})
  cid!: number

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  owner!: Account

  @Column_("varchar", {length: 9, nullable: false})
  kind!: BasePoolKind

  /**
   * decimal percentage, 1 means 100%
   */
  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  commission!: BigDecimal

  @OneToOne_(() => Vault)
  vault!: Vault | undefined | null

  @OneToOne_(() => StakePool)
  stakePool!: StakePool | undefined | null

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  totalShares!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  totalValue!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  sharePrice!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  freeValue!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  releasingValue!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  withdrawalValue!: BigDecimal

  @Column_("int4", {nullable: false})
  delegatorCount!: number

  @Column_("bool", {nullable: false})
  whitelistEnabled!: boolean

  @OneToMany_(() => BasePoolWhitelist, e => e.basePool)
  whitelists!: BasePoolWhitelist[]
}
