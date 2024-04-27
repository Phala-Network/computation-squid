import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"

@Index_(["delegation", "updatedTime"], {unique: true})
@Entity_()
export class DelegationSnapshot {
    constructor(props?: Partial<DelegationSnapshot>) {
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
    delegation!: string

    @BigDecimalColumn_({nullable: false})
    cost!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    value!: BigDecimal
}
