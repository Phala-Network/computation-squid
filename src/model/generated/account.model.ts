import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, StringColumn as StringColumn_, Index as Index_, BigDecimalColumn as BigDecimalColumn_, IntColumn as IntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {BasePool} from "./basePool.model"
import {IdentityJudgement} from "./_identityJudgement"

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

    @OneToOne_(() => BasePool, e => e.account)
    basePool!: BasePool | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    identityDisplay!: string | undefined | null

    @Column_("varchar", {length: 10, nullable: true})
    identityLevel!: IdentityJudgement | undefined | null

    @Column_("varchar", {length: 10, array: true, nullable: true})
    identityJudgements!: (IdentityJudgement)[] | undefined | null

    @BigDecimalColumn_({nullable: false})
    stakePoolValue!: BigDecimal

    @IntColumn_({nullable: false})
    stakePoolNftCount!: number

    @BigDecimalColumn_({nullable: false})
    stakePoolAvgAprMultiplier!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    vaultValue!: BigDecimal

    @IntColumn_({nullable: false})
    vaultNftCount!: number

    @BigDecimalColumn_({nullable: false})
    vaultAvgAprMultiplier!: BigDecimal

    @OneToMany_(() => BasePool, e => e.owner)
    ownedPools!: BasePool[]

    @BigDecimalColumn_({nullable: false})
    cumulativeStakePoolOwnerRewards!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    cumulativeVaultOwnerRewards!: BigDecimal
}
