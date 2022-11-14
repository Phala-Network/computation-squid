import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {BasePoolKind} from "./_basePoolKind"
import {Vault} from "./vault.model"
import {StakePool} from "./stakePool.model"

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

  @OneToOne_(() => Vault)
  vault!: Vault | undefined | null

  @OneToOne_(() => StakePool)
  stakePool!: StakePool | undefined | null

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  totalShares!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  totalValue!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  totalWithdrawalValue!: BigDecimal

  /**
   * any string, usually a stringified json
   */
  @Column_("text", {nullable: true})
  description!: string | undefined | null
}
