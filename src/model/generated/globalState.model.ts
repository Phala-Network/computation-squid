import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class GlobalState {
    constructor(props?: Partial<GlobalState>) {
        Object.assign(this, props)
    }

    /**
     * constant 0
     */
    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    height!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    totalValue!: BigDecimal

    @Column_("int4", {nullable: false})
    averageBlockTimeUpdatedHeight!: number

    @Column_("timestamp with time zone", {nullable: false})
    averageBlockTimeUpdatedTime!: Date

    @Column_("int4", {nullable: false})
    averageBlockTime!: number

    @Column_("timestamp with time zone", {nullable: false})
    averageAprMultiplierUpdatedTime!: Date

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    averageAprMultiplier!: BigDecimal

    /**
     * for apr calculation
     */
    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    idleWorkerShares!: BigDecimal

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
