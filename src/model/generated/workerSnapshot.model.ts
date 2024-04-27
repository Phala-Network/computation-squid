import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"
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
    @DateTimeColumn_({nullable: false})
    updatedTime!: Date

    @StringColumn_({nullable: false})
    worker!: string

    @StringColumn_({nullable: false})
    stakePool!: string

    @StringColumn_({nullable: false})
    session!: string

    @IntColumn_({nullable: false})
    confidenceLevel!: number

    @IntColumn_({nullable: true})
    initialScore!: number | undefined | null

    @BigDecimalColumn_({nullable: false})
    stake!: BigDecimal

    @Column_("varchar", {length: 18, nullable: false})
    state!: WorkerState

    @BigDecimalColumn_({nullable: false})
    v!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    ve!: BigDecimal

    @IntColumn_({nullable: false})
    pInit!: number

    @IntColumn_({nullable: false})
    pInstant!: number

    @BigDecimalColumn_({nullable: false})
    totalReward!: BigDecimal
}
