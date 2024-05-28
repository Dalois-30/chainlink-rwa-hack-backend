import { Controller, Post, Body, Param, Get, Query, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto, ResetPassWordDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { Request as RequestExpress, Response } from 'express';
import { SharedService } from 'src/shared/services/shared.service';
import { Public } from '../decorators/public.decorator';

@ApiBearerAuth('JWT-auth')
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
  ) { }


  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 201, description: 'Successfully created user' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/register')
  async createUser(@Body() user: CreateUserDto, @Res() res: Response) {
    const response = await this.authService.create(user, res);
    return {
      ...response,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 201, description: 'Successfully created user' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/register-with-address')
  async createUserWithAddress(@Query("address") address: string, @Res() res: Response) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (ethAddressRegex.test(address)) {
      const user = new CreateUserDto();
      user.email = address + "@base.com";
      user.password = address;
      user.username = address;
      const response = await this.authService.createWithAddress(user, res);
      return {
        ...response,
      };
    }
    return res.send('incorrect address');
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Wrong credentials' })
  @Post('/login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.validateUserByPassword(loginUserDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Wrong credentials' })
  @Post('/login-with-address')
  async loginWithAddress(@Query("address") address: string) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (ethAddressRegex.test(address)) {
      const loginUserDto = new LoginUserDto();
      loginUserDto.email = address + "@base.com";
      loginUserDto.password = address;
      return await this.authService.validateUserByPassword(loginUserDto);
    }
    return 'incorrect address';
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully send verification code',
  })
  @ApiResponse({ status: 403, description: 'User not found' })
  @Post('/resend-verification/')
  async sendEmailVerification(@Query('email') email: string, @Res() res: Response) {
    const result = await this.sharedService.createEmailToken(email, res);
    res.send(result);
    // return await this.authService.sendEmailVerification(email);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully change password',
  })
  @ApiResponse({ status: 403, description: 'User not found' })
  @Post('/reset-password')
  async resetPassword(@Query('email') email: string, @Body() resetPassDto: ResetPassWordDto) {
    return await this.authService.resetPassword(email, resetPassDto);
  }

  @ApiResponse({ status: 200, description: 'Successfully verified email' })
  @ApiResponse({ status: 403, description: 'Invalid token' })
  @Post('email/verify')
  async verifyEmail(
    @Query('token') token: string, @Query('email') email: string, @Req() req: RequestExpress
  ) {
    const verified = await this.authService.verifyEmail(token, email, req);
    if (verified) {
      return { message: 'Verified email' };
    }
  }

}
