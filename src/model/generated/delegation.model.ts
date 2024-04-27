import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, BigDecimalColumn as BigDecimalColumn_, DateTimeColumn as DateTimeColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_} from "@subsquid/typeorm-store"
import {Account} from "./account.model"
import {BasePool} from "./basePool.model"
import {Nft} from "./nft.model"

@Index_(["basePool", "account"], {unique: true})
@Entity_()
export class Delegation {
    constructor(props?: Partial<Delegation>) {
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

    @BigDecimalColumn_({nullable: false})
    value!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    cost!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    shares!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    withdrawingValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    withdrawingShares!: BigDecimal

    @DateTimeColumn_({nullable: true})
    withdrawalStartTime!: Date | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Nft, {nullable: true})
    @JoinColumn_()
    delegationNft!: Nft | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Nft, {nullable: true})
    @JoinColumn_()
    withdrawalNft!: Nft | undefined | null
}
