import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, Index as Index_, IntColumn as IntColumn_, ManyToOne as ManyToOne_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, BigDecimalColumn as BigDecimalColumn_, BooleanColumn as BooleanColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
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
    @BigIntColumn_({nullable: false})
    pid!: bigint

    /**
     * NFT collection id
     */
    @IntColumn_({nullable: false})
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
    @BigDecimalColumn_({nullable: false})
    commission!: BigDecimal

    @OneToOne_(() => Vault, e => e.basePool)
    vault!: Vault | undefined | null

    @OneToOne_(() => StakePool, e => e.basePool)
    stakePool!: StakePool | undefined | null

    @Index_()
    @BigDecimalColumn_({nullable: false})
    aprMultiplier!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    totalShares!: BigDecimal

    @Index_()
    @BigDecimalColumn_({nullable: false})
    totalValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    sharePrice!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    freeValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    releasingValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    withdrawingValue!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    withdrawingShares!: BigDecimal

    @IntColumn_({nullable: false})
    delegatorCount!: number

    @Index_()
    @BooleanColumn_({nullable: false})
    whitelistEnabled!: boolean

    @OneToMany_(() => BasePoolWhitelist, e => e.basePool)
    whitelists!: BasePoolWhitelist[]

    @OneToMany_(() => Delegation, e => e.basePool)
    delegations!: Delegation[]

    @BigDecimalColumn_({nullable: false})
    cumulativeOwnerRewards!: BigDecimal
}
