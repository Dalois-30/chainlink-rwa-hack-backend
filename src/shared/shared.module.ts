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
import { CacheService } from './services/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

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
    CacheModule.register({
      ttl: 50, // seconds
      max: 100, // maximum number of items in cache
    }),
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
    UploadModule,
    CacheModule.register({
      ttl: 5000, // seconds
      max: 100, // maximum number of items in cache
    }),
  ],
  providers: [
    SharedService,
    UsersService,
    CacheService
  ]
})
export class SharedModule {}
