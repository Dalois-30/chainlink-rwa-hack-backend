import { Body, Controller, Get, Post, Res, Headers, Delete, Param, UseGuards, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { AdminUserService } from '../service/admin-user.service';
import { Request as RequestExpress, Response } from 'express';
import { User } from 'src/auth/entities/user.entity';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { AuthGuard } from '@nestjs/passport';
import { CreateRoleDto } from '../dto/create-role.dto';
import { AdminRoleService } from '../service/admin-role.service';


@ApiBearerAuth('JWT-auth')
@ApiTags('admin')
@Controller('admin')
export class AdminController {

  constructor(
    private adminService: AdminUserService,
    private adminRoleService: AdminRoleService,
  ) { }

  @ApiResponse({ status: 201, description: 'Successfully created admin' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/user/create')
  async createAdmin(@Body() user: CreateUserDto, @Res() res: Response) {
    const response = await this.adminService.createAdmin(user, res);
    return {
      ...response,
    };
  }

  @ApiResponse({ status: 200, description: 'Fetched all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @UseGuards(AuthGuard('jwt'))
  @Get('/users/list')
  async getAllUsers(@Headers() headers): Promise<ApiResponseDTO<User[]>> {
    console.log(headers);

    return await this.adminService.findAllUser(headers);
  }

  @ApiResponse({ status: 201, description: 'Successfully created role' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/user/by-role/:roleId')
  async getUsersByRoleId(@Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string) {
    const response = await this.adminService.userByRoleId(roleId);
    return {
      ...response,
    };
  }

  @ApiResponse({ status: 200, description: 'Deleted specific user' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('/user/delete/:userId')
  async deleteUserById(@Param('userId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return await this.adminService.deleteUserById(id);
  }

  @ApiResponse({ status: 201, description: 'Successfully created role' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/role/create')
  async createRole(@Body() role: CreateRoleDto, @Res() res: Response) {
    const response = await this.adminRoleService.createRole(role, res);
    return {
      ...response,
    };
  }

  @ApiResponse({ status: 201, description: 'Successfully update role' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('/role/update/:roleId')
  async updateRole(@Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string, @Body() role: CreateRoleDto) {
    const response = await this.adminRoleService.updateRole(roleId, role);
    return {
      ...response,
    };
  }

  @ApiResponse({ status: 200, description: 'Update role' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @Put('/role/:userId/update-roles')
  async updateRolesForUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() roleIds: string[],
  ) {
    return await this.adminService.updateUserRole(userId, roleIds);
  }


  // @ApiResponse({ status: 200, description: 'Deleted all users' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @UseGuards(AuthGuard('jwt'))
  // @Delete()
  // async deleteAllUsers() {
  //   return await this.adminService.deleteAll();
  // }
}
