import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Account} from "./account.model"

@Entity_()
export class Nft {
  constructor(props?: Partial<Nft>) {
    Object.assign(this, props)
  }

  /**
   * ${cid}-${nftId}
   */
  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  owner!: Account

  @Column_("int4", {nullable: false})
  cid!: number

  @Column_("int4", {nullable: false})
  nftId!: number

  @Column_("bool", {nullable: false})
  burned!: boolean

  @Column_("timestamp with time zone", {nullable: false})
  mintTime!: Date
}
