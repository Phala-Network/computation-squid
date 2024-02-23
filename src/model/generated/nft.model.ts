import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import {Account} from "./account.model"
import {Delegation} from "./delegation.model"

@Index_(["cid", "nftId"], {unique: true})
@Entity_()
export class Nft {
    constructor(props?: Partial<Nft>) {
        Object.assign(this, props)
    }

    /**
     * ${cid}-${nftId}
     */
    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    owner!: Account

    @Column_("int4", {nullable: false})
    cid!: number

    @Column_("int4", {nullable: false})
    nftId!: number

    @Column_("timestamp with time zone", {nullable: true})
    mintTime!: Date | undefined | null

}
