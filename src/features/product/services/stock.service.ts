import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { Repository } from 'typeorm';
import { Product } from '../models/product.model';
import { Stock } from '../models/stock.model';
import { UserProduct } from '../models/user-product.model';

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
    ) { }


    /**
     * Get the quantity of a product owned by a user.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @returns ApiResponseDTO<number> - The quantity of the product owned by the user.
     */
    async getUserProductStock(userId: string, productId: string): Promise<ApiResponseDTO<number>> {
        const res = new ApiResponseDTO<number>();
        try {
            const userProduct = await this.userProductRepository.findOne({
                where: {
                    user: { id: userId },
                    product: { id: productId }
                },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                throw new HttpException("User does not own this product", HttpStatus.NOT_FOUND);
            }

            res.statusCode = HttpStatus.OK;
            res.message = "Stock retrieved successfully";
            res.data = userProduct.quantity;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }


    /**
     * Get the quantity of a product owned by a user.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @returns ApiResponseDTO<number> - The quantity of the product owned by the user.
     */
    async getUserProductStockByEmail(email: string, productId: string): Promise<number> {
        const res = new ApiResponseDTO<number>();
        try {
            const userProduct = await this.userProductRepository.findOne({
                where: {
                    user: { email: email },
                    product: { id: productId }
                },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                throw new HttpException("User does not own this product", HttpStatus.NOT_FOUND);
            }

            res.statusCode = HttpStatus.OK;
            res.message = "Stock retrieved successfully";
            res.data = userProduct.quantity;
            return userProduct.quantity;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
        }
        
    }

    /**
     * Add a product to a user's products with the given quantity.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param quantity - The quantity of the product to be added.
     * @returns ApiResponseDTO<UserProduct> - The result of the add operation.
     */
    async addUserProduct(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        const res = new ApiResponseDTO<UserProduct>();
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!user) {
                throw new HttpException("User not found", HttpStatus.NOT_FOUND);
            }

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            const stock = product.stock;
            if (!stock || stock.quantity < quantity) {
                throw new HttpException("Not enough stock available", HttpStatus.BAD_REQUEST);
            }

            let userProduct = await this.userProductRepository.findOne({
                where: {
                    user: { id: userId },
                    product: { id: productId }
                }
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

            stock.quantity -= quantity;
            await this.stockRepository.save(stock);

            res.statusCode = HttpStatus.OK;
            res.message = "Product added to user successfully";
            res.data = userProduct;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }

    /**
     * Update the quantity of a user's product.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param quantity - The new quantity of the product.
     * @returns ApiResponseDTO<UserProduct> - The result of the update operation.
     */
    async updateUserProductQuantity(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        const res = new ApiResponseDTO<UserProduct>();
        try {
            const userProduct = await this.userProductRepository.findOne({
                where: {
                    user: { id: userId },
                    product: { id: productId }
                },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                throw new HttpException("User does not own this product", HttpStatus.NOT_FOUND);
            }

            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            const stock = product.stock;
            const difference = quantity - userProduct.quantity;

            if (difference > 0 && stock.quantity < difference) {
                throw new HttpException("Not enough stock available", HttpStatus.BAD_REQUEST);
            }

            userProduct.quantity = quantity;
            stock.quantity -= difference;

            if (stock.quantity < 0) {
                throw new HttpException("Stock cannot be negative", HttpStatus.BAD_REQUEST);
            }

            await this.userProductRepository.save(userProduct);
            await this.stockRepository.save(stock);

            res.statusCode = HttpStatus.OK;
            res.message = "Product quantity updated successfully";
            res.data = userProduct;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }

    /**
     * Update the stock of a product.
     * @param productId - The ID of the product.
     * @param quantity - The new quantity of the stock.
     * @returns ApiResponseDTO<Stock> - The result of the update operation.
     */
    async updateProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        const res = new ApiResponseDTO<Stock>();
        try {
            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            let stock = product.stock;

            if (!stock) {
                stock = new Stock();
                stock.product = product;
                stock.quantity = quantity;
                await this.stockRepository.save(stock);
                product.stock = stock;
                await this.productRepository.save(product);
            } else {
                stock.quantity = quantity;
                await this.stockRepository.save(stock);
            }

            res.statusCode = HttpStatus.OK;
            res.message = "Product stock updated successfully";
            res.data = stock;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }

    /**
     * Increment the quantity of a user's product.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to be added.
     * @returns ApiResponseDTO<UserProduct> - The result of the increment operation.
     */
    async incrementUserProductQuantity(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(userId, productId, quantity);
    }

    /**
     * Decrement the quantity of a user's product.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to be subtracted.
     * @returns ApiResponseDTO<UserProduct> - The result of the decrement operation.
     */
    async decrementUserProductQuantity(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(userId, productId, -quantity);
    }

    /**
     * Increment the stock of a product.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to be added.
     * @returns ApiResponseDTO<Stock> - The result of the increment operation.
     */
    async incrementProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        return this.adjustProductStock(productId, quantity);
    }

    /**
     * Decrement the stock of a product.
     * @param productId - The ID of the product.
     * @param quantity - The quantity to be subtracted.
     * @returns ApiResponseDTO<Stock> - The result of the decrement operation.
     */
    async decrementProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        return this.adjustProductStock(productId, -quantity);
    }

    /**
     * Adjust the quantity of a user's product and the product's stock.
     * @param userId - The ID of the user.
     * @param productId - The ID of the product.
     * @param adjustment - The quantity to be adjusted (positive or negative).
     * @returns ApiResponseDTO<UserProduct> - The result of the adjustment operation.
     */
    private async adjustUserProductQuantity(userId: string, productId: string, adjustment: number): Promise<ApiResponseDTO<UserProduct>> {
        const res = new ApiResponseDTO<UserProduct>();
        try {
            const userProduct = await this.userProductRepository.findOne({
                where: {
                    user: { id: userId },
                    product: { id: productId }
                },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                throw new HttpException("User does not own this product", HttpStatus.NOT_FOUND);
            }

            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            const stock = product.stock;
            if (adjustment > 0 && stock.quantity < adjustment) {
                throw new HttpException("Not enough stock available", HttpStatus.BAD_REQUEST);
            }

            userProduct.quantity += adjustment;
            stock.quantity -= adjustment;

            if (userProduct.quantity < 0) {
                throw new HttpException("User's product quantity cannot be negative", HttpStatus.BAD_REQUEST);
            }

            await this.userProductRepository.save(userProduct);
            await this.stockRepository.save(stock);

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
     * Adjust the stock of a product.
     * @param productId - The ID of the product.
     * @param adjustment - The quantity to be adjusted (positive or negative).
     * @returns ApiResponseDTO<Stock> - The result of the adjustment operation.
     */
    private async adjustProductStock(productId: string, adjustment: number): Promise<ApiResponseDTO<Stock>> {
        const res = new ApiResponseDTO<Stock>();
        try {
            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!product) {
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            let stock = product.stock;

            if (!stock) {
                stock = new Stock();
                stock.product = product;
                stock.quantity = 0;
            }

            stock.quantity += adjustment;

            if (stock.quantity < 0) {
                throw new HttpException("Stock cannot be negative", HttpStatus.BAD_REQUEST);
            }

            await this.stockRepository.save(stock);

            res.statusCode = HttpStatus.OK;
            res.message = "Product stock adjusted successfully";
            res.data = stock;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message;
        }
        return res;
    }
}
