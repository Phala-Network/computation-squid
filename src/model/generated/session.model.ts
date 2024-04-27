import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_, BigDecimalColumn as BigDecimalColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_} from "@subsquid/typeorm-store"
import {Worker} from "./worker.model"
import {WorkerState} from "./_workerState"

@Entity_()
export class Session {
    constructor(props?: Partial<Session>) {
        Object.assign(this, props)
    }

    /**
     * session account address
     */
    @PrimaryColumn_()
    id!: string

    @Index_({unique: true})
    @OneToOne_(() => Worker, {nullable: true})
    @JoinColumn_()
    worker!: Worker | undefined | null

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

    @DateTimeColumn_({nullable: true})
    coolingDownStartTime!: Date | undefined | null

    @BigDecimalColumn_({nullable: false})
    shares!: BigDecimal
}
