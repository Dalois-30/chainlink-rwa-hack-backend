import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EXPIRES_IN } from '../constant/constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtPayloadService {
  constructor(private readonly jwtService: JwtService) {}

  createJwtPayload(user: User) {
    const data: JwtPayload = {
      email: user.email,
      id: user.id,
      roles: user.userRoles.map(role => role.roleName),
    };
    

    let jwt;
    try {
      jwt = this.jwtService.sign(data);
    } catch (error) {
      throw new HttpException(
        'Internal Server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      expiresIn: EXPIRES_IN,
      token: jwt,
    };
  }

}
