import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly roleName: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly description: string;
}