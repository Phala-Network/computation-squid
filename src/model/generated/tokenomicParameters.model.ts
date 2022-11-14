import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class TokenomicParameters {
  constructor(props?: Partial<TokenomicParameters>) {
    Object.assign(this, props)
  }

  /**
   * constant 0
   */
  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  phaRate!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  budgetPerBlock!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  vMax!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  treasuryRatio!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  re!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  k!: BigDecimal
}
