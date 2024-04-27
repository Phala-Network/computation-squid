import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, DateTimeColumn as DateTimeColumn_} from "@subsquid/typeorm-store"
import {Account} from "./account.model"
import {BasePool} from "./basePool.model"

@Index_(["basePool", "createTime"], {unique: false})
@Entity_()
export class BasePoolWhitelist {
    constructor(props?: Partial<BasePoolWhitelist>) {
        Object.assign(this, props)
    }

    /**
     * ${pid}-${accountId}
     */
    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    account!: Account

    @ManyToOne_(() => BasePool, {nullable: true})
    basePool!: BasePool

    @DateTimeColumn_({nullable: false})
    createTime!: Date
}
