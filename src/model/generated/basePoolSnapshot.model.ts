import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {BasePool} from "./basePool.model"

@Entity_()
export class BasePoolSnapshot {
    constructor(props?: Partial<BasePoolSnapshot>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * block time
     */
    @Column_("timestamp with time zone", {nullable: false})
    updatedTime!: Date

    @Index_()
    @ManyToOne_(() => BasePool, {nullable: true})
    basePool!: BasePool

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    commission!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    apr!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    totalValue!: BigDecimal

    @Column_("int4", {nullable: false})
    delegatorCount!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    sharePrice!: BigDecimal

    @Column_("int4", {nullable: true})
    workerCount!: number | undefined | null

    @Column_("int4", {nullable: true})
    idleWorkerCount!: number | undefined | null

    @Column_("int4", {nullable: true})
    stakePoolCount!: number | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeOwnerRewards!: BigDecimal
}
