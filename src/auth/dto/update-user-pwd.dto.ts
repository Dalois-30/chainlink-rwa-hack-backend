import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateUserDtoPassword {

    @ApiPropertyOptional()
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    password?: string;
  }