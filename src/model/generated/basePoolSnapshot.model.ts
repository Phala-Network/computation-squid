import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, BigDecimalColumn as BigDecimalColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Index_(["basePool", "updatedTime"], {unique: true})
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
    @DateTimeColumn_({nullable: false})
    updatedTime!: Date

    @StringColumn_({nullable: false})
    basePool!: string

    @BigDecimalColumn_({nullable: false})
    commission!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    apr!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    totalShares!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    totalValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    sharePrice!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    freeValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    releasingValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    withdrawingValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    withdrawingShares!: BigDecimal

    @IntColumn_({nullable: false})
    delegatorCount!: number

    @IntColumn_({nullable: true})
    workerCount!: number | undefined | null

    @IntColumn_({nullable: true})
    idleWorkerCount!: number | undefined | null

    @IntColumn_({nullable: true})
    stakePoolCount!: number | undefined | null

    @BigDecimalColumn_({nullable: false})
    cumulativeOwnerRewards!: BigDecimal
}
