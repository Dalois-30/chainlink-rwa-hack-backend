import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { User } from 'src/auth/entities/user.entity';
import { Product } from '../models/product.model';
import { Stock } from '../models/stock.model';

export class ProductObjectToSendWithImage {
    product: ProductObjectToSendDTO;
    image?: string;
}
export class ProductGetDTO {
    product: Product;
    image?: string;
}

// export class AllProductsGetDTO {
//     Product: Products;
//     image?: string;
//     comments?: number;
// }

export class ProductObjectToSendDTO {
    id: string;
    name: string;
    description: string;
    price: boolean;
    stock: number;
    // category: Category;
    created_at: Date;
    updated_at: Date;
}