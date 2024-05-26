import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Product } from 'src/features/product/models/product.model';
import { Role } from 'src/features/role/entities/role.entity';
import { UserProduct } from 'src/features/product/models/user-product.model';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  @IsEmail()
  email: string;

  @Column({
    unique: true,
  })
  username: string;

  @Column()
  password: string;

  @OneToMany(() => UserProduct, userProduct => userProduct.user)
  userProducts: UserProduct[];

  @Column()
  verified: boolean = false;

  @ManyToMany(() => Role, role => role.userRoles, { cascade: true })
  @JoinTable()
  userRoles: Role[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    try {
      const rounds = bcrypt.getRounds(this.password);
      if (rounds === 0) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (error) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}
