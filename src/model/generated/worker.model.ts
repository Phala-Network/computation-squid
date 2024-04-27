import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {StakePool} from "./stakePool.model"
import {Session} from "./session.model"

@Entity_()
export class Worker {
    constructor(props?: Partial<Worker>) {
        Object.assign(this, props)
    }

    /**
     * worker public key
     */
    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => StakePool, {nullable: true})
    stakePool!: StakePool | undefined | null

    @OneToOne_(() => Session, e => e.worker)
    session!: Session | undefined | null

    @IntColumn_({nullable: false})
    confidenceLevel!: number

    @IntColumn_({nullable: true})
    initialScore!: number | undefined | null
}
