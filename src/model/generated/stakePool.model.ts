import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_} from "typeorm"
import * as marshal from "./marshal"
import {BasePool} from "./basePool.model"

@Entity_()
export class StakePool {
  constructor(props?: Partial<StakePool>) {
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

  /**
   * null means infinite
   */
  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
  capacity!: BigDecimal | undefined | null

  /**
   * null means infinite
   */
  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
  delegable!: BigDecimal | undefined | null

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  freeStake!: BigDecimal

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  releasingStake!: BigDecimal

  @Column_("int4", {nullable: false})
  workerCount!: number

  @Column_("int4", {nullable: false})
  idleWorkerCount!: number

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  idleWorkerShares!: BigDecimal

  @Column_("bool", {nullable: false})
  whitelistEnabled!: boolean
}
