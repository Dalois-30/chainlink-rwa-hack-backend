import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class ProductQuantityDto {
    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiProperty()
    @IsInt()
    @Min(1)
    quantity: number;
}

export class ProductQuantityPriceDto {
    @ApiProperty()
    @IsInt()
    price: number;

    @ApiProperty()
    @IsInt()
    quantity: number;

    @ApiProperty()
    @IsInt()
    value: number;
}

export class ProductUserQuantityDto {
    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiProperty()
    @IsUUID()
    userId?: string;

    @ApiProperty()
    address?: string;

    @ApiProperty()
    @IsInt()
    @Min(1)
    quantity: number;
}
