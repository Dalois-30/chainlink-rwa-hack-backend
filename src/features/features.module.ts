import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { RoleModule } from './role/role.module';
import { ProductModule } from './product/product.module';

@Module({
    imports: [
        UsersModule,
        AdminModule,
        RoleModule,
        ProductModule
    ]
})
export class FeaturesModule { }
