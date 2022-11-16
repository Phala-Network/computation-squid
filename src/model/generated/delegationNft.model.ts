import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Account} from "./account.model"

@Entity_()
export class DelegationNft {
  constructor(props?: Partial<DelegationNft>) {
    Object.assign(this, props)
  }

  /**
   * ${collectionId}-${nftId}
   */
  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  owner!: Account

  @Column_("int4", {nullable: false})
  collectionId!: number

  @Column_("int4", {nullable: false})
  nftId!: number
}
