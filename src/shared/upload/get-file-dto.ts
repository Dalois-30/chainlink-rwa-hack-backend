import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class GetFileDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    key: string;
}
export class GetFileListDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    prefix: string;
}

