import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, OneToOne as OneToOne_} from "@subsquid/typeorm-store"
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

    @IntColumn_({nullable: false})
    cid!: number

    @IntColumn_({nullable: false})
    nftId!: number

    @DateTimeColumn_({nullable: true})
    mintTime!: Date | undefined | null

    @OneToOne_(() => Delegation, e => e.delegationNft)
    delegation!: Delegation | undefined | null
}
