import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_, BigDecimalColumn as BigDecimalColumn_, IntColumn as IntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {BasePool} from "./basePool.model"
import {Worker} from "./worker.model"

@Entity_()
export class StakePool {
    constructor(props?: Partial<StakePool>) {
        Object.assign(this, props)
    }

    /**
     * pid
     */
    @PrimaryColumn_()
    id!: string

    @Index_({unique: true})
    @OneToOne_(() => BasePool, {nullable: true})
    @JoinColumn_()
    basePool!: BasePool

    /**
     * null means infinite
     */
    @BigDecimalColumn_({nullable: true})
    capacity!: BigDecimal | undefined | null

    /**
     * null means infinite
     */
    @BigDecimalColumn_({nullable: true})
    delegable!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: false})
    ownerReward!: BigDecimal

    @IntColumn_({nullable: false})
    workerCount!: number

    @IntColumn_({nullable: false})
    idleWorkerCount!: number

    @BigDecimalColumn_({nullable: false})
    idleWorkerShares!: BigDecimal

    @OneToMany_(() => Worker, e => e.stakePool)
    workers!: Worker[]
}
