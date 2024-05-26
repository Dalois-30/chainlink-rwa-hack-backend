import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UserProductDto {
    @ApiProperty()
    @IsUUID()
    userId: string;

    @ApiProperty()
    @IsUUID()
    productId: string;
}
