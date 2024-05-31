import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { Product } from '../models/product.model';
import { Stock } from '../models/stock.model';
import { UserProduct } from '../models/user-product.model';
import { firstValueFrom } from 'rxjs';
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

    private async findUserAndProduct(userId: string | null, email: string | null, productId: string) {
        const cacheKey = `user_${userId || email}_product_${productId}`;
        let userProductData = await firstValueFrom(this.cacheService.get<{user: User, product: Product}>(cacheKey));

        if (!userProductData) {
            const user = userId ? 
                await this.userRepository.findOne({ where: { id: userId } }) :
                await this.userRepository.findOne({ where: { email: email } });

            const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['stock'] });

            if (!user || !product) {
                throw new HttpException("User or Product not found", HttpStatus.NOT_FOUND);
            }

            userProductData = { user, product };
            this.cacheService.set(cacheKey, userProductData);
        }

        return userProductData;
    }

    private createResponse<T>(statusCode: HttpStatus, message: string, data: T): ApiResponseDTO<T> {
        const res = new ApiResponseDTO<T>();
        res.statusCode = statusCode;
        res.message = message;
        res.data = data;
        return res;
    }

    async getUserProductStock(userId: string, productId: string): Promise<ApiResponseDTO<number>> {
        return this.getUserProductStockGeneric({ userId, productId });
    }

    async getUserProductStockByEmail(email: string, productId: string): Promise<ApiResponseDTO<number>> {
        return this.getUserProductStockGeneric({ email, productId });
    }

    private async getUserProductStockGeneric({ userId, email, productId }: { userId?: string, email?: string, productId: string }): Promise<ApiResponseDTO<number>> {
        try {
            const { user, product } = await this.findUserAndProduct(userId, email, productId);
            let userProduct = await this.userProductRepository.findOne({
                where: { user: { id: user.id }, product: { id: productId } },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                userProduct = new UserProduct();
                userProduct.user = user;
                userProduct.product = product;
                userProduct.quantity = 0;
                await this.userProductRepository.save(userProduct);
            }

            return this.createResponse(HttpStatus.OK, "Stock retrieved successfully", userProduct.quantity * product.price);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    async addUserProduct(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        try {
            const { user, product } = await this.findUserAndProduct(userId, null, productId);

            if (product.stock.quantity < quantity) {
                throw new HttpException("Not enough stock available", HttpStatus.BAD_REQUEST);
            }

            let userProduct = await this.userProductRepository.findOne({ where: { user: { id: userId }, product: { id: productId } } });

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

            this.cacheService.del(`user_${userId}_product_${productId}`);

            return this.createResponse(HttpStatus.OK, "Product added to user successfully", userProduct);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    async updateUserProductQuantity(userId: string, productId: string, quantity: number): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(productId, quantity, userId);
    }

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

            this.cacheService.del(`product_stock_${productId}`);

            return this.createResponse(HttpStatus.OK, "Product stock updated successfully", product.stock);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    async incrementUserProductQuantity(productId: string, quantity: number, userId?: string, email?: string): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(productId, quantity, userId, email);
    }

    async decrementUserProductQuantity(productId: string, quantity: number, userId?: string, email?: string): Promise<ApiResponseDTO<UserProduct>> {
        return this.adjustUserProductQuantity(productId, -quantity, userId, email);
    }

    async incrementProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        return this.adjustProductStock(productId, quantity);
    }

    async decrementProductStock(productId: string, quantity: number): Promise<ApiResponseDTO<Stock>> {
        return this.adjustProductStock(productId, -quantity);
    }

    private async adjustUserProductQuantity(productId: string, adjustment: number, userId?: string, email?: string): Promise<ApiResponseDTO<UserProduct>> {
        try {
            const { user, product } = await this.findUserAndProduct(userId, email, productId);
            let userProduct = await this.userProductRepository.findOne({
                where: { user: { id: user.id }, product: { id: productId } },
                relations: ["user", "product"]
            });

            if (!userProduct) {
                userProduct = new UserProduct();
                userProduct.user = user;
                userProduct.product = product;
                userProduct.quantity = adjustment;
            } else {
                userProduct.quantity += adjustment;
            }

            product.stock.quantity -= adjustment;
            if (product.stock.quantity < 0 || userProduct.quantity < 0) {
                throw new HttpException("Quantity cannot be negative", HttpStatus.BAD_REQUEST);
            }

            await this.userProductRepository.save(userProduct);
            await this.stockRepository.save(product.stock);

            this.cacheService.del(`user_${userId || email}_product_${productId}`);

            return this.createResponse(HttpStatus.OK, "Product quantity adjusted successfully", userProduct);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    private async adjustProductStock(productId: string, adjustment: number): Promise<ApiResponseDTO<Stock>> {
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

            this.cacheService.del(`product_stock_${productId}`);

            return this.createResponse(HttpStatus.OK, "Product stock adjusted successfully", product.stock);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
