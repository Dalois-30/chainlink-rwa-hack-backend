import { Module, Global, Logger } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { DatabaseOrmModule } from './constant/dbconfig';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { UserRole } from 'src/auth/entities/userRole.entity';
import { Role } from 'src/features/role/entities/role.entity';
import { Repository } from 'typeorm';
import { UserRolesEnum } from 'src/auth/enums/user-roles';
import { Product } from 'src/features/product/models/product.model';
import { Stock } from 'src/features/product/models/stock.model';
import { UserProduct } from 'src/features/product/models/user-product.model';



@Global()
@Module({
  imports: [
    EnvModule,
    DatabaseOrmModule(),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
    TypeOrmModule.forFeature([UserRole]),
    TypeOrmModule.forFeature([Role]),
    TypeOrmModule.forFeature([UserProduct]),
    TypeOrmModule.forFeature([Stock]),
  ],
  exports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
    TypeOrmModule.forFeature([UserRole]),
    TypeOrmModule.forFeature([Role]),
    TypeOrmModule.forFeature([UserProduct]),
    TypeOrmModule.forFeature([Stock]),
  ]
})
export class DatabaseModule {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }
  private readonly logger = new Logger(DatabaseModule.name);

  async onModuleInit() {
    const roles = [UserRolesEnum.ADMIN, UserRolesEnum.USER];

    // Créer les rôles s'ils n'existent pas encore
    for (const roleName of roles) {
      const existingRole = await this.roleRepository.findOneBy({ roleName });
      if (!existingRole) {
        const newRole = new Role();
        newRole.roleName = roleName;
        newRole.description = roleName;

        await this.roleRepository.save(newRole);
        this.logger.verbose(`Role "${roleName}" created`);
      }
    }

    // Trouver ou créer l'utilisateur admin et lui attribuer le rôle admin
    let adminUser = await this.userRepository.findOneBy({ username: "admin" });
    if (!adminUser) {
      const newUser = new User();
      newUser.email = "admin@admin.com";
      newUser.password = "Admin1234";
      newUser.username = "admin";

      await this.userRepository.save(newUser);
      this.logger.verbose("Admin user created");

      adminUser = newUser; // Affecter le nouvel utilisateur à adminUser
    }

    // Vérifier si adminUser n'a aucun rôle
    if (adminUser && (!adminUser.userRoles || adminUser.userRoles.length === 0)) {
      // Trouver le rôle admin
      const adminRole = await this.roleRepository.findOne({ where: { roleName: UserRolesEnum.ADMIN } });
      if (adminRole) {
        // Ajouter le rôle admin à adminUser
        adminUser.userRoles = [adminRole];
        await this.userRepository.save(adminUser);
        this.logger.verbose("Admin role assigned to existing user");
      }
    }

    // Vérifier si adminUser existe et n'a pas le rôle admin
    if (adminUser && adminUser.userRoles && !adminUser.userRoles.some(role => role.roleName === UserRolesEnum.ADMIN)) {
      // Trouver le rôle admin
      const adminRole = await this.roleRepository.findOne({ where: { roleName: UserRolesEnum.ADMIN } });
      if (adminRole) {
        // Ajouter le rôle admin à adminUser
        adminUser.userRoles.push(adminRole);
        await this.userRepository.save(adminUser);
        this.logger.verbose("Admin role assigned to existing user");
      }
    }
  }
}
