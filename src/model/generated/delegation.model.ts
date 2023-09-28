import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {BasePool} from "./basePool.model"
import {Nft} from "./nft.model"
import {DelegationSnapshot} from "./delegationSnapshot.model"

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

    @Index_()
    @ManyToOne_(() => BasePool, {nullable: true})
    basePool!: BasePool

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    value!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cost!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    shares!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    withdrawingValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    withdrawingShares!: BigDecimal

    @Column_("timestamp with time zone", {nullable: true})
    withdrawalStartTime!: Date | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Nft, {nullable: true})
    @JoinColumn_()
    delegationNft!: Nft

    @Index_()
    @ManyToOne_(() => Nft, {nullable: true})
    withdrawalNft!: Nft | undefined | null

    @OneToMany_(() => DelegationSnapshot, e => e.delegation)
    snapshots!: DelegationSnapshot[]
}
