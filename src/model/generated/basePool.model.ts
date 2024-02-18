import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {BasePoolKind} from "./_basePoolKind"
import {Vault} from "./vault.model"
import {StakePool} from "./stakePool.model"
import {BasePoolWhitelist} from "./basePoolWhitelist.model"
import {Delegation} from "./delegation.model"

@Entity_()
export class BasePool {
    constructor(props?: Partial<BasePool>) {
        Object.assign(this, props)
    }

    /**
     * pid
     */
    @PrimaryColumn_()
    id!: string

    /**
     * numeric pid for sorting
     */
    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    pid!: bigint

    /**
     * NFT collection id
     */
    @Column_("int4", {nullable: false})
    cid!: number

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    owner!: Account

    @Index_({unique: true})
    @OneToOne_(() => Account, {nullable: true})
    @JoinColumn_()
    account!: Account

    @Index_()
    @Column_("varchar", {length: 9, nullable: false})
    kind!: BasePoolKind

    /**
     * decimal percentage, 1 means 100%
     */
    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    commission!: BigDecimal



    @Index_()
    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    aprMultiplier!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    totalShares!: BigDecimal

    @Index_()
    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    totalValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    sharePrice!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    freeValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    releasingValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    withdrawingValue!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    withdrawingShares!: BigDecimal

    @Column_("int4", {nullable: false})
    delegatorCount!: number

    @Index_()
    @Column_("bool", {nullable: false})
    whitelistEnabled!: boolean

    @OneToMany_(() => BasePoolWhitelist, e => e.basePool)
    whitelists!: BasePoolWhitelist[]

    @OneToMany_(() => Delegation, e => e.basePool)
    delegations!: Delegation[]

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeOwnerRewards!: BigDecimal
}
