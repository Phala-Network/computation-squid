import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"

@Index_(["account", "updatedTime"], {unique: true})
@Entity_()
export class AccountSnapshot {
    constructor(props?: Partial<AccountSnapshot>) {
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
    account!: string

    @BigDecimalColumn_({nullable: false})
    delegationValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    cumulativeStakePoolOwnerRewards!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    cumulativeVaultOwnerRewards!: BigDecimal
}
