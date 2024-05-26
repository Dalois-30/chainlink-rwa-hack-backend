import { Controller, Get, Headers } from '@nestjs/common';
import { RoleService } from '../service/role.service';
import { Role } from '../entities/role.entity';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDTO } from 'src/shared/response/api-response';

@ApiBearerAuth('JWT-auth')
@ApiTags('role')
@Controller('role')
export class RoleController {

  constructor(
    private roleService: RoleService,
  ) { }


  @ApiResponse({ status: 200, description: 'Fetched all role' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @UseGuards(AuthGuard('jwt'))
  @Get('/list')
  async getAllUsers(@Headers() headers): Promise<ApiResponseDTO<Role[]>> {
    console.log(headers);

    return await this.roleService.findAll();
  }
}
