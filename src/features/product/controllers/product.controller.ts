import { Body, Controller, Get, Param, ParseFilePipe, ParseUUIDPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from '../dto/create-product-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse, ApiConsumes, ApiBody, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { ProductGetDTO } from '../dto/product-get-dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { log } from 'console';

@ApiBearerAuth('JWT-auth')
@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private productservice: ProductService
  ) { }


  /**
   * 
   * @returns the list of product
   */
  @Public()
  @ApiResponse({ status: 200, description: 'Fetched all product' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get("/get-all")
  async getAllproduct(@Query('page') page: number = 0, @Query('limit') limit: number = 10) {
    return await this.productservice.findAll(page, limit);
  }


  /**
   * 
   * @param product 
   * @returns the newly created product
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Create new product' })
  @Post('/create')
  @UseInterceptors(FileInterceptor('file'))
  async createproduct(@UploadedFile(
    new ParseFilePipe({
      validators: [
        // new MaxFileSizeValidator({ maxSize: 6000 }),
        // new FileTypeValidator({ fileType: 'image/jpeg' })
      ]
    })
  ) file: Express.Multer.File, @Body() product: CreateProductDto) {
    // const link = await this.uploadService.upload(file.originalname, file.buffer);
    log("in the product controller");
    return await this.productservice.create(product, file);
  }


  /**
   * 
   * @param id 
   * @returns one or more product
   */
  @Public()
  @ApiResponse({ status: 200, description: 'Fetched specific product' })
  @Get('/getOne/:productId')
  async getproductById(@Param('productId') id: string): Promise<ApiResponseDTO<ProductGetDTO>> {
    return await this.productservice.findOneById(id);
  }


  /**
   * 
   * @param id 
   * @param product 
   * @returns update product information
   */
  @ApiResponse({ status: 200, description: 'Fetched all product' })
  @ApiResponse({ status: 400, description: 'product not found' })
  @Put('/update/:productId')
  async updateproduct(@Param('productId', new ParseUUIDPipe({ version: '4' })) id: string, @Body() product: UpdateProductDto) {
    return await this.productservice.update(id, product);
  }


}
