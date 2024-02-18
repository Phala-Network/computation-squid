import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Worker} from "./worker.model"
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

    @ManyToOne_(() => Worker, {nullable: true})
    worker!: Worker

    @Column_("text", {nullable: true})
    stakePoolId!: string | undefined | null

    @Column_("text", {nullable: true})
    sessionId!: string | undefined | null

    @Column_("int4", {nullable: false})
    confidenceLevel!: number

    @Column_("int4", {nullable: true})
    initialScore!: number | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
    stake!: BigDecimal | undefined | null

    @Column_("varchar", {length: 18, nullable: true})
    state!: WorkerState | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
    v!: BigDecimal | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
    ve!: BigDecimal | undefined | null

    @Column_("int4", {nullable: true})
    pInit!: number | undefined | null

    @Column_("int4", {nullable: true})
    pInstant!: number | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
    totalReward!: BigDecimal | undefined | null
}
