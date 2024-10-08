import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"
import {BasePool} from "./basePool.model"

@Entity_()
export class Vault {
    constructor(props?: Partial<Vault>) {
        Object.assign(this, props)
    }

    /**
     * pid
     */
    @PrimaryColumn_()
    id!: string

    @Index_({unique: true})
    @OneToOne_(() => BasePool, {nullable: true})
    @JoinColumn_()
    basePool!: BasePool

    /**
     * share price of owner's last gain
     */
    @BigDecimalColumn_({nullable: false})
    lastSharePriceCheckpoint!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    claimableOwnerShares!: BigDecimal
}
