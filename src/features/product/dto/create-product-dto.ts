import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
    name: string;
    description: string;
    image: string;
    price: number;
}

export class UpdateProductDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name?: string;
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description?: string;
    @ApiProperty()
    price?: number;
} 