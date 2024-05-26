import { DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { EnvService } from "src/shared/env/env.service";

// database configuration settings 
export function DatabaseOrmModule(): DynamicModule {
    const config = new EnvService().read();
  
    return TypeOrmModule.forRoot({
      type: config.DB_TYPE,
      host: config.DB_HOST,
      port: config.DB_PORT,
      username: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      entities: [join(__dirname, '/../**/**.entity{.ts,.js}')],
      autoLoadEntities: true,
      synchronize: true,
    });
  }