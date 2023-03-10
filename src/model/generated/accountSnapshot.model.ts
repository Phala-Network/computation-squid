import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"

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

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    account!: Account

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    delegationValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeStakePoolOwnerRewards!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeVaultOwnerRewards!: BigDecimal
}
