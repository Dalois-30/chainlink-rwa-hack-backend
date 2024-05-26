import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AdminController } from './controller/admin.controller';
import { AdminUserService } from './service/admin-user.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersService } from '../users/services/users.service';
import { SharedService } from 'src/shared/services/shared.service';
import { AdminRoleService } from './service/admin-role.service';
import { AdminMiddleware } from './middleware/admin.middleware';

@Module({
  imports: [
    SharedModule
  ],
  controllers: [AdminController],
  providers: [
    SharedService,
    AdminUserService,
    UsersService,
    AdminRoleService
  ]
})
export class AdminModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AdminMiddleware)
      .forRoutes('admin');
  }
}
