import {BigDecimal} from "@subsquid/big-decimal"
import {Column as Column_, Entity as Entity_, OneToMany as OneToMany_, OneToOne as OneToOne_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import {BasePool} from "./basePool.model"
import {Delegation} from "./delegation.model"
import * as marshal from "./marshal"
import {IdentityLevel} from "./_identityLevel"

@Entity_()
export class Account {
  constructor(props?: Partial<Account>) {
    Object.assign(this, props)
  }

  /**
   * account address
   */
  @PrimaryColumn_()
  id!: string

  @OneToOne_(() => BasePool, e => e.account)
  basePool!: BasePool | undefined | null

  @OneToMany_(() => BasePool, e => e.owner)
  ownedPools!: BasePool[]

  @Column_("text", {nullable: true})
  identityDisplay!: string | undefined | null

  @Column_("varchar", {length: 10, nullable: true})
  identityLevel!: IdentityLevel | undefined | null

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  stakePoolValue!: BigDecimal

  @Column_("int4", {nullable: false})
  stakePoolNftCount!: number

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  stakePoolAvgAprMultiplier!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  vaultValue!: BigDecimal

  @Column_("int4", {nullable: false})
  vaultNftCount!: number

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  vaultAvgAprMultiplier!: BigDecimal

  @OneToMany_(() => Delegation, e => e.account)
  delegations!: Delegation[]
}
