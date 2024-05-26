import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Stock } from './stock.model';
import { UserProduct } from './user-product.model';


@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({
    unique: true
  })
  public name: string;

  @Column()
  public description: string;

  @Column()
  public image: string;

  @Column()
  public price: number;

  @OneToOne(() => Stock, stock => stock.product, { cascade: true })
  @JoinColumn()
  public stock: Stock;

  @OneToMany(() => UserProduct, userProduct => userProduct.product)
  userProducts: UserProduct[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}
