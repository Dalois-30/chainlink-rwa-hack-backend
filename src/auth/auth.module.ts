import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import 'dotenv/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationEntity } from './entities/emailverification.entity';
import { EXPIRES_IN } from './constant/constants';
import { User } from './entities/user.entity';
import { JwtPayloadService } from './services/jwt.payload.service';
import { SharedService } from 'src/shared/services/shared.service';
import { UsersModule } from 'src/features/users/users.module';
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: true }),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: {
        expiresIn: EXPIRES_IN,
      },
    }),
    TypeOrmModule.forFeature([EmailVerificationEntity, User]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtPayloadService, SharedService],
})
export class AuthModule {}
