import { User } from 'src/auth/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './product.model';

@Entity('user_product')
export class UserProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.userProducts)
    user: User;

    @ManyToOne(() => Product, product => product.userProducts)
    product: Product;

    @Column()
    quantity: number;
}
