import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {WorkerState} from "./_workerState"

@Index_(["worker", "updatedTime"], {unique: true})
@Entity_()
export class WorkerSnapshot {
    constructor(props?: Partial<WorkerSnapshot>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * block time
     */
    @Column_("timestamp with time zone", {nullable: false})
    updatedTime!: Date

    @Column_("text", {nullable: false})
    worker!: string

    @Column_("text", {nullable: false})
    stakePool!: string

    @Column_("text", {nullable: false})
    session!: string

    @Column_("int4", {nullable: false})
    confidenceLevel!: number

    @Column_("int4", {nullable: true})
    initialScore!: number | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    stake!: BigDecimal

    @Column_("varchar", {length: 18, nullable: false})
    state!: WorkerState

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    v!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    ve!: BigDecimal

    @Column_("int4", {nullable: false})
    pInit!: number

    @Column_("int4", {nullable: false})
    pInstant!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    totalReward!: BigDecimal
}
