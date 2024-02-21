import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

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
    @Column_("timestamp with time zone", {nullable: false})
    updatedTime!: Date

    @Column_("text", {nullable: false})
    delegation!: string

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cost!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    value!: BigDecimal
}
