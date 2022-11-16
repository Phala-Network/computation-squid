import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Vault} from "./vault.model"
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

  @OneToOne_(() => Vault)
  vault!: Vault | undefined | null

  @Column_("text", {nullable: true})
  identityDisplay!: string | undefined | null

  @Column_("varchar", {length: 10, nullable: false})
  identityLevel!: IdentityLevel

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  stakePoolValue!: BigDecimal

  @Column_("int4", {nullable: false})
  stakePoolNftCount!: number

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  vaultValue!: BigDecimal

  @Column_("int4", {nullable: false})
  vaultNftCount!: number
}
