import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Headers,
  UseGuards,
  Put,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { User } from 'src/auth/entities/user.entity';
import { ApiResponseDTO } from 'src/shared/response/api-response';

@ApiBearerAuth('JWT-auth')
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiResponse({ status: 200, description: 'Fetched specific user' })
  @Get('email')
  async getUserByEmail(@Query('email') email: string): Promise<User> {
    return await this.usersService.findOneByEmail(email);
  }

  @ApiResponse({ status: 200, description: 'Fetched specific user' })
  @Get('/:userId')
  async getUserById(@Param('userId', new ParseUUIDPipe({ version: '4' })) id: string): Promise<ApiResponseDTO<User>> {
    return await this.usersService.findOneById(id);
  }

  @ApiResponse({ status: 200, description: 'Update specific user' })
  @ApiResponse({ status: 400, description: 'User not found' })
  @Put(':userId')
  async updateUser(@Param('userId', new ParseUUIDPipe({ version: '4' })) id: string, @Body() user: UpdateUserDto) {
    return await this.usersService.update(id, user);
  }

  @ApiResponse({ status: 200, description: 'Successfully authenticated user' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @Get('/test/authstate')
  // @UseGuards(AuthGuard('jwt'))
  testAuthRoute(@Headers() headers) {
    console.log(headers);

    return { message: 'authenticated' };
  }
}
