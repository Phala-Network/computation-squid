import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Account} from "./account.model"
import {StakePool} from "./stakePool.model"

@Entity_()
export class StakePoolWhitelist {
  constructor(props?: Partial<StakePoolWhitelist>) {
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
  @ManyToOne_(() => StakePool, {nullable: true})
  stakePool!: StakePool

  @Column_("timestamp with time zone", {nullable: false})
  createTime!: Date
}
