import { Entity, Column, PrimaryGeneratedColumn, OneToOne, CreateDateColumn } from 'typeorm';
import { Product } from './product.model';

@Entity('stock')
export class Stock {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Product, product => product.stock)
    product: Product;

    @Column()
    quantity: number;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    date: Date;
}
