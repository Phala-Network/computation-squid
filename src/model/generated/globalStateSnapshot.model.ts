import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class GlobalStateSnapshot {
    constructor(props?: Partial<GlobalStateSnapshot>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * block time
     */
    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    updatedTime!: Date

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    totalValue!: BigDecimal

    @Column_("int4", {nullable: false})
    averageBlockTime!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    averageApr!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    idleWorkerShares!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeRewards!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    budgetPerBlock!: BigDecimal

    @Column_("int4", {nullable: false})
    workerCount!: number

    @Column_("int4", {nullable: false})
    idleWorkerCount!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    budgetPerShare!: BigDecimal

    @Column_("int4", {nullable: false})
    delegatorCount!: number
}
