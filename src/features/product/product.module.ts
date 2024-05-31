import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { SharedModule } from 'src/shared/shared.module';
import { UploadModule } from 'src/shared/upload/upload.module';
import { UploadService } from 'src/shared/upload/upload.service';
import { StockService } from './services/stock.service';
import { StockController } from './controllers/stock.controller';
import { CacheService } from 'src/shared/services/cache.service';

@Module({
  imports: [
    SharedModule,
    UploadModule
  ],
  controllers: [
    ProductController,
    StockController
  ],
  providers: [
    ProductService,
    UploadService,
    StockService,
    CacheService
  ]
}) 
export class ProductModule { }
