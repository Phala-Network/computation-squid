import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
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


    @Column_("int4", {nullable: false})
    confidenceLevel!: number

    @Column_("int4", {nullable: true})
    initialScore!: number | undefined | null
}
