import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
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

  @Column_("text", {nullable: true})
  identityDisplay!: string | undefined | null

  @Column_("varchar", {length: 10, nullable: false})
  identityLevel!: IdentityLevel

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  totalStakePoolValue!: BigDecimal
}
