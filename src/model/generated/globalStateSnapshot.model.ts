import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"

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
    @IntColumn_({nullable: false})
    height!: number

    @Index_()
    @DateTimeColumn_({nullable: false})
    updatedTime!: Date

    @BigDecimalColumn_({nullable: false})
    totalValue!: BigDecimal

    @IntColumn_({nullable: false})
    averageBlockTime!: number

    @BigDecimalColumn_({nullable: false})
    averageApr!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    idleWorkerShares!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    cumulativeRewards!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    budgetPerBlock!: BigDecimal

    @IntColumn_({nullable: false})
    workerCount!: number

    @IntColumn_({nullable: false})
    idleWorkerCount!: number

    @BigDecimalColumn_({nullable: false})
    budgetPerShare!: BigDecimal

    @IntColumn_({nullable: false})
    delegatorCount!: number
}
