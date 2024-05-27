import { Controller, Param, Body, Put, Post, Get, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateProductDto } from '../dto/create-product-dto';
import { ProductQuantityDto, ProductUserQuantityDto } from '../dto/product-quantity.dto';
import { UserProductDto } from '../dto/user-product.dto';
import { StockService } from '../services/stock.service';
import { log } from 'console';

@ApiBearerAuth('JWT-auth')
@ApiTags('stocks')
@Controller('stocks')
export class StockController {
    constructor(private readonly stockService: StockService) { }


    /**
     * Add a product to a user's products with the given quantity.
     * @param userProductDto - The user and product information.
     * @param productQuantityDto - The product quantity information.
     * @returns The result of the add operation.
     */
    @ApiResponse({ status: 200, description: 'Product added to user successfully' })
    @ApiResponse({ status: 400, description: 'Product or user not found' })
    @Post('/user/add')
    async addUserProduct(
        @Body() userProductDto: ProductUserQuantityDto
    ) {
        log("user dto", userProductDto)
        return await this.stockService.addUserProduct(userProductDto.userId, userProductDto.productId, userProductDto.quantity);
    }

    /**
     * Get the quantity of a product owned by a user.
     * @param userProductDto - The user and product information.
     * @returns The quantity of the product owned by the user.
     */
    @ApiResponse({ status: 200, description: 'Stock retrieved successfully' })
    @ApiResponse({ status: 400, description: 'User or product not found' })
    @Get('/user/stock/:userId/:productId')
    async getUserProductStock(
        @Param("userId") userId: string,
        @Param("productId") productId: string,
    ) {
        return await this.stockService.getUserProductStock(userId, productId);
    }

    /**
     * Update the quantity of a user's product.
     * @param userProductDto - The user and product information.
     * @param productQuantityDto - The new product quantity information.
     * @returns The result of the update operation.
     */
    @ApiResponse({ status: 200, description: 'Product quantity updated successfully' })
    @ApiResponse({ status: 400, description: 'User or product not found' })
    @Put('/user/update')
    async updateUserProductQuantity(
        @Body() userProductDto: UserProductDto,
        @Body() productQuantityDto: ProductQuantityDto
    ) {
        return await this.stockService.updateUserProductQuantity(userProductDto.userId, userProductDto.productId, productQuantityDto.quantity);
    }

    /**
     * Increment the quantity of a user's product.
     * @param userProductDto - The user and product information.
     * @param productQuantityDto - The product quantity information.
     * @returns The result of the increment operation.
     */
    @ApiResponse({ status: 200, description: 'Product quantity incremented successfully' })
    @ApiResponse({ status: 400, description: 'User or product not found' })
    @Put('/user/increment')
    async incrementUserProductQuantity(
        @Body() userProductDto: UserProductDto,
        @Body() productQuantityDto: ProductQuantityDto
    ) {
        return await this.stockService.incrementUserProductQuantity(userProductDto.userId, userProductDto.productId, productQuantityDto.quantity);
    }

    /**
     * Decrement the quantity of a user's product.
     * @param userProductDto - The user and product information.
     * @param productQuantityDto - The product quantity information.
     * @returns The result of the decrement operation.
     */
    @ApiResponse({ status: 200, description: 'Product quantity decremented successfully' })
    @ApiResponse({ status: 400, description: 'User or product not found' })
    @Put('/user/decrement')
    async decrementUserProductQuantity(
        @Body() userProductDto: UserProductDto,
        @Body() productQuantityDto: ProductQuantityDto
    ) {
        return await this.stockService.decrementUserProductQuantity(userProductDto.userId, userProductDto.productId, productQuantityDto.quantity);
    }

    /**
     * Increment the stock of a product.
     * @param productQuantityDto - The product and quantity information.
     * @returns The result of the increment operation.
     */
    @ApiResponse({ status: 200, description: 'Product stock incremented successfully' })
    @ApiResponse({ status: 400, description: 'Product not found' })
    @Put('/incrementStock')
    async incrementProductStock(
        @Body() productQuantityDto: ProductQuantityDto
    ) {
        return await this.stockService.incrementProductStock(productQuantityDto.productId, productQuantityDto.quantity);
    }

    /**
     * Decrement the stock of a product.
     * @param productQuantityDto - The product and quantity information.
     * @returns The result of the decrement operation.
     */
    @ApiResponse({ status: 200, description: 'Product stock decremented successfully' })
    @ApiResponse({ status: 400, description: 'Product not found' })
    @Put('/decrementStock')
    async decrementProductStock(
        @Body() productQuantityDto: ProductQuantityDto
    ) {
        return await this.stockService.decrementProductStock(productQuantityDto.productId, productQuantityDto.quantity);
    }
}
