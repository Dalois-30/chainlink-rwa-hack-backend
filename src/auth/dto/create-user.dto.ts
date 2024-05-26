import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';


export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;  

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  // @IsNotEmpty()
  // @IsEnum(UserRoles)
  // @IsOptional()
  // readonly role: UserRoles;
}

export class ResetPassWordDto {
  @ApiProperty()
  @IsString()
  readonly actualPassword: string;
  @ApiProperty()
  @IsString()
  readonly newPassword: string;
}

// export class CreateMarchandDto {
 
  
//   // @ApiProperty()
//   // @IsString()
//   // @IsNotEmpty()
//   // readonly name: string;

//   // @ApiProperty()
//   // @IsString()
//   // @IsNotEmpty()
//   // readonly address: string;  
  
//   // @ApiProperty()
//   // @IsString()
//   // @IsNotEmpty()
//   // readonly tel: string;  
  
//   @ApiProperty()
//   @IsNotEmpty()
//   @IsEmail()
//   readonly email: string;

//   @ApiProperty()
//   @IsString()
//   readonly password: string;
// }
