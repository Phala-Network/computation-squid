import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {BasePool} from "./basePool.model"
import {IdentityLevel} from "./_identityLevel"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    /**
     * account address
     */
    @PrimaryColumn_()
    id!: string


    @Column_("text", {nullable: true})
    identityDisplay!: string | undefined | null

    @Column_("varchar", {length: 10, nullable: true})
    identityLevel!: IdentityLevel | undefined | null

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    stakePoolValue!: BigDecimal

    @Column_("int4", {nullable: false})
    stakePoolNftCount!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    stakePoolAvgAprMultiplier!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    vaultValue!: BigDecimal

    @Column_("int4", {nullable: false})
    vaultNftCount!: number

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    vaultAvgAprMultiplier!: BigDecimal

    @OneToMany_(() => BasePool, e => e.owner)
    ownedPools!: BasePool[]

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeStakePoolOwnerRewards!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    cumulativeVaultOwnerRewards!: BigDecimal
}
