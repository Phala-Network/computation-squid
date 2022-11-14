import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_} from "typeorm"
import * as marshal from "./marshal"
import {BasePool} from "./basePool.model"

@Entity_()
export class Vault {
  constructor(props?: Partial<Vault>) {
    Object.assign(this, props)
  }

  /**
   * pid
   */
  @PrimaryColumn_()
  id!: string

  @Index_({unique: true})
  @OneToOne_(() => BasePool, {nullable: false})
  @JoinColumn_()
  basePool!: BasePool

  /**
   * decimal percentage, 1 means 100%
   */
  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  commission!: BigDecimal
}
