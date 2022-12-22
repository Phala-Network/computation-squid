import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class RewardRecord {
    constructor(props?: Partial<RewardRecord>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * block time
     */
    @Column_("timestamp with time zone", {nullable: false})
    time!: Date

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    value!: BigDecimal
}
