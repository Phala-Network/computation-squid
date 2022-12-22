import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Account} from "./account.model"
import {BasePool} from "./basePool.model"

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

    @Index_()
    @ManyToOne_(() => BasePool, {nullable: true})
    basePool!: BasePool

    @Column_("timestamp with time zone", {nullable: false})
    createTime!: Date
}
