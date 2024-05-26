import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EnvModule } from './env/env.module';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EXPIRES_IN } from 'src/auth/constant/constants';
import { UploadModule } from './upload/upload.module';
import { SharedService } from './services/shared.service';
import { UsersService } from 'src/features/users/services/users.service';

@Module({
  imports: [
    DatabaseModule, 
    EnvModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
        secret: process.env.SECRET_KEY,
        signOptions: {
            expiresIn: EXPIRES_IN,
        },
    }),
    UploadModule,
  ],
  exports: [
    DatabaseModule, 
    EnvModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
        secret: process.env.SECRET_KEY,
        signOptions: {
            expiresIn: EXPIRES_IN,
        },
    }),
    UploadModule
  ],
  providers: [
    SharedService,
    UsersService
  ]
})
export class SharedModule {}
