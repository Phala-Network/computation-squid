import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

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
    @Column_("timestamp with time zone", {nullable: false})
    updatedTime!: Date

    @Column_("text", {nullable: false})
    account!: string

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    delegationValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeStakePoolOwnerRewards!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeVaultOwnerRewards!: BigDecimal
}
