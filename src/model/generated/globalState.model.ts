import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, BigDecimalColumn as BigDecimalColumn_, DateTimeColumn as DateTimeColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

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

    @IntColumn_({nullable: false})
    height!: number

    @BigDecimalColumn_({nullable: false})
    totalValue!: BigDecimal

    @IntColumn_({nullable: false})
    averageBlockTimeUpdatedHeight!: number

    @DateTimeColumn_({nullable: false})
    averageBlockTimeUpdatedTime!: Date

    @DateTimeColumn_({nullable: false})
    snapshotUpdatedTime!: Date

    @IntColumn_({nullable: false})
    averageBlockTime!: number

    @BigDecimalColumn_({nullable: false})
    averageAprMultiplier!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    averageApr!: BigDecimal

    /**
     * for apr calculation
     */
    @BigDecimalColumn_({nullable: false})
    idleWorkerShares!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    cumulativeRewards!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    phaRate!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    budgetPerBlock!: BigDecimal

    @DateTimeColumn_({nullable: false})
    tokenomicUpdatedTime!: Date

    @BigDecimalColumn_({nullable: false})
    vMax!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    treasuryRatio!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    re!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    k!: BigDecimal

    @IntColumn_({nullable: false})
    workerCount!: number

    @IntColumn_({nullable: false})
    idleWorkerCount!: number

    @BigDecimalColumn_({nullable: false})
    budgetPerShare!: BigDecimal

    @IntColumn_({nullable: false})
    delegatorCount!: number

    @IntColumn_({nullable: false})
    idleWorkerPInit!: number

    @IntColumn_({nullable: false})
    idleWorkerPInstant!: number

    @BooleanColumn_({nullable: true})
    withdrawalDustCleared!: boolean | undefined | null
}
