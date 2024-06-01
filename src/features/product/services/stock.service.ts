import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { Product } from '../models/product.model';
import { Stock } from '../models/stock.model';
import { UserProduct } from '../models/user-product.model';
import { CacheService } from 'src/shared/services/cache.service';

@Injectable()
export class StockService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(UserProduct)
        private readonly userProductRepository: Repository<UserProduct>,
        @InjectRepository(Stock)
        private readonly stockRepository: Repository<Stock>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Finds a user and a product from the database or cache.
     * @param userId - The ID of the user.
     * @param email - The email of the user.
     * @param productId - The ID of the product.
     * @returns An object containing the user and product.
     */
    private async findUserAndProduct(userId: string | null, email: string | null, productId: string) {
        const cacheKey = `user_${userId || email}_product_${productId}`;
        let userProductData = await this.cacheService.get<{ user: User, product: Product }>(cacheKey);

        if (!userProductData) {
            // Fetch user from the database based on userId or email
            const user = userId
                ? await this.userRepository.findOne({ where: { id: userId } })
                : await this.userRepository.findOne({ where: { email } });

            // Fetch product from the database with its stock relation
            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            // Throw an exception if user or product is not found
            if (!user || !product) {
                throw new HttpException("User or Product not found", HttpStatus.NOT_FOUND);
            }

            userProductData = { user, product };
            // Update the cache with found data
            await this.cacheService.set(cacheKey, userProductData);
        }

        return userProductData;
    }

    /**
     * Creates a standardized API response.
     * @param statusCode - The HTTP status code.
     * @param message - The response message.
     * @param data - The response data.
     * @returns A ApiResponseDTO containing the response details.
     */
    private createResponse<T>(statusCode: HttpStatus, message: string, data: T): ApiResponseDTO<T> {
        const res = new ApiResponseDTO<T>();
        res.statusCode = statusCode;
        res.message = message;
        res.data = data;
        return res;
    }

    /**
     * Retrieves the stock value of a user's product by user ID.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @returns The total stock value of the user's product.
     */
    async getUserProductStock(userId: string, productId: string): Promise<ApiResponseDTO<number>> {
        return this.getUserProductStockGeneric({ userId, productId });
    }

    /**
     * Retrieves the stock value of a user's product by user email.
     * @param email - The email of the user.
     * @param productId - The ID of the product.
     * @returns The total stock value of the user's product.
     */
    async getUserProductStockByEmail(email: string, productId: string): Promise<ApiResponseDTO<number>> {
        return this.getUserProductStockGeneric({ email, productId });
    }

    /**
     * Generic method to retrieve the stock value of a user's product.
     * @param params - Object containing either userId or email, and productId.
     * @returns The total stock value of the user's product.
     */
    private async getUserProductStockGeneric({ userId, email, productId }: { userId?: string, email?: string, productId: string }): Promise<ApiResponseDTO<number>> {
        try {
            const cacheKey = `user_${userId || email}_product_${productId}_stock`;
            let userProduct = await this.cacheService.get<UserProduct>(cacheKey);

            if (!userProduct) {
                const { user, product } = await this.findUserAndProduct(userId, email, productId);
                
                userProduct = await this.userProductRepository.findOne({
                    where: { user: { id: user.id }, product: { id: productId } },
                    relations: ["user", "product"]
                });
                

                // If userProduct is not found, create a new one with quantity 0
                if (!userProduct) {
                    userProduct = new UserProduct();
                    userProduct.user = user;
                    userProduct.product = product;
                    userProduct.quantity = 0;
                    await this.userProductRepository.save(userProduct);
                }

                // Cache the userProduct data
                await this.cacheService.set(cacheKey, userProduct);
            }

            return this.createResponse(HttpStatus.OK, "Stock retrieved successfully", userProduct.quantity * userProduct.product.price);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Adds a product to a user's stock.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to add.
     * @returns The updated UserProduct object.
     */
    async addUserProduct(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        try {
            const { user, product } = await this.findUserAndProduct(userId, null, productId);

            // Check if there is enough stock available
            if (product.stock.quantity < quantity) {
                throw new HttpException("Not enough stock available", HttpStatus.BAD_REQUEST);
            }

            // Find existing UserProduct or create a new one
            let userProduct = await this.userProductRepository.findOne({
                where: { user: { id: user.id }, product: { id: productId } },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                userProduct = new UserProduct();
                userProduct.user = user;
                userProduct.product = product;
                userProduct.quantity = quantity;
            } else {
                userProduct.quantity += quantity;
            }

            await this.userProductRepository.save(userProduct);
            product.stock.quantity -= quantity;
            await this.stockRepository.save(product.stock);

            // Invalidate the cache after adding product
            await this.cacheService.del(`user_${userId}_product_${productId}`);
            // await this.cacheService.del(`user_${userId || email}_product_${productId}_stock`);

            return this.createResponse(HttpStatus.OK, "Product added to user successfully", userProduct);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Updates the quantity of a product in a user's stock.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param quantity - The new quantity.
     * @returns The updated UserProduct object.
     */
    async updateUserProductQuantity(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(productId, quantity, userId);
    }

    /**
     * Updates the stock quantity of a product.
     * @param productId - The ID of the product.
     * @param quantity - The new stock quantity.
     * @returns The updated Stock object.
     */
    async updateProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        try {
            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            if (!product.stock) {
                product.stock = new Stock();
                product.stock.product = product;
            }

            product.stock.quantity = quantity;
            await this.stockRepository.save(product.stock);

            // Invalidate the cache after updating stock
            await this.cacheService.del(`product_stock_${productId}`);

            return this.createResponse(HttpStatus.OK, "Product stock updated successfully", product.stock);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Increments the quantity of a product in a user's stock.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to increment.
     * @param userId - The ID of the user (optional).
     * @param email - The email of the user (optional).
     * @returns The updated UserProduct object.
     */
    async incrementUserProductQuantity(productId: string, quantity: number, userId?: string, email?: string): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(productId, quantity, userId, email);
    }

    /**
     * Decrements the quantity of a product in a user's stock.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to decrement.
     * @param userId - The ID of the user (optional).
     * @param email - The email of the user (optional).
     * @returns The updated UserProduct object.
     */
    async decrementUserProductQuantity(productId: string, quantity: number, userId?: string, email?: string): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(productId, -quantity, userId, email);
    }

    /**
     * Increments the stock quantity of a product.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to increment.
     * @returns The updated Stock object.
     */
    async incrementProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        return this.adjustProductStock(productId, quantity);
    }

    /**
     * Decrements the stock quantity of a product.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to decrement.
     * @returns The updated Stock object.
     */
    async decrementProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        return this.adjustProductStock(productId, -quantity);
    }

    /**
     * Adjusts the quantity of a product in a user's stock by a specified amount.
     * @param productId - The ID of the product.
     * @param adjustment - The amount to adjust (can be positive or negative).
     * @param userId - The ID of the user (optional).
     * @param email - The email of the user (optional).
     * @returns The updated UserProduct object.
     */
    private async adjustUserProductQuantity(
        productId: string,
        adjustment: number,
        userId?: string,
        email?: string
    ): Promise<ApiResponseDTO<UserProduct>> {
        const res = new ApiResponseDTO<UserProduct>();
        try {
            // Retrieve user and product
            const { user, product } = await this.findUserAndProduct(userId, email, productId);
            
            // Cache key for UserProduct
            const cacheKey = `user_${userId || email}_product_${productId}_stock`;
            
            // Try to retrieve UserProduct from cache
            let userProduct = await this.cacheService.get<UserProduct>(cacheKey);
            console.log("userProduct", userProduct);
            // await this.clearAllCache();
    
            // If UserProduct is not in cache, fetch from database
            if (!userProduct) {
                userProduct = await this.userProductRepository.findOne({
                    where: { user: { id: user.id }, product: { id: productId } },
                    relations: ["user", "product"]
                });
    
                // If UserProduct does not exist, create a new UserProduct with the adjusted quantity
                if (!userProduct) {
                    userProduct = new UserProduct();
                    userProduct.user = user;
                    userProduct.product = product;
                    userProduct.quantity = 0; // Initialize quantity to 0 to avoid incorrect adjustments
                }
            }
    
            // Adjust the product quantity for the user
            userProduct.quantity += adjustment;
    
            // Check if the quantities are valid
            if (product.stock.quantity < adjustment || userProduct.quantity < 0) {
                throw new HttpException("Quantity cannot be negative", HttpStatus.BAD_REQUEST);
            }
    
            // Update the product stock
            product.stock.quantity -= adjustment;
    
            // Save changes to the database
            this.userProductRepository.save(userProduct);
            this.stockRepository.save(product.stock);
    
            // Delete the old stock data from cache
            this.cacheService.del(`user_${userId || email}_product_${productId}_stock`);
    
            // Update the cache with the new UserProduct state
            this.cacheService.set(cacheKey, userProduct);
    
            // Create API response
            res.statusCode = HttpStatus.OK;
            res.message = "Product quantity adjusted successfully";
            res.data = userProduct;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }
    

    /**
     * Adjusts the stock quantity of a product by a specified amount.
     * @param productId - The ID of the product.
     * @param adjustment - The amount to adjust (can be positive or negative).
     * @returns The updated Stock object.
     */
    private async adjustProductStock(productId: string, adjustment: number): Promise<ApiResponseDTO<Stock>> {
        const res = new ApiResponseDTO<Stock>();
        try {
            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            if (!product.stock) {
                product.stock = new Stock();
                product.stock.product = product;
                product.stock.quantity = 0;
            }

            product.stock.quantity += adjustment;
            if (product.stock.quantity < 0) {
                throw new HttpException("Stock cannot be negative", HttpStatus.BAD_REQUEST);
            }

            await this.stockRepository.save(product.stock);
            // Invalidate the cache after adjusting stock
            await this.cacheService.del(`product_stock_${productId}`);

            res.statusCode = HttpStatus.OK;
            res.message = "Product stock adjusted successfully";
            res.data = product.stock;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }
        /**
     * Clears all cached data.
     * @returns A response indicating whether the operation was successful.
     */
        async clearAllCache(){
            try {
                await this.cacheService.flushAll();
                console.log("data cleared");
                
                // return this.createResponse(HttpStatus.OK, "All cache cleared successfully", "Success");
            } catch (error) {
                throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
}
