import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../models/product.model';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { UploadService } from 'src/shared/upload/upload.service';
import { GetFileDto } from 'src/shared/upload/get-file-dto';
import { User } from 'src/auth/entities/user.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/create-product-dto';
import { ProductGetDTO, ProductObjectToSendDTO, ProductObjectToSendWithImage } from '../dto/product-get-dto';

@Injectable()
export class ProductService {

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly jwtService: JwtService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly uploadService: UploadService
    ) { }

    /**
    * 
    * @param product product dta 
    * @returns the product object newly created
    */
    async create(product: CreateProductDto, file: Express.Multer.File) {
        const res = new ApiResponseDTO<Product>();
        try {
            const productGet = await this.productRepository.findOneBy({
                name: product.name
            })
            if (productGet) {
                throw new HttpException("product with this name already exist", HttpStatus.CONFLICT);
            }
            // upload image file and get key
            const image = await this.uploadService.upload(file.originalname, file.buffer);
            // create new product from the dto and the product
            const newproduct = this.productRepository.create({
                name: product.name,
                price: product.price,
                description: product.description,
                image: image
            });

            // save product on database
            const result = await this.productRepository.save(newproduct);
            // format response
            res.data = result;
            res.message = "successfully created product"
            res.statusCode = HttpStatus.CREATED

        } catch (error) {
            res.message = error.message;
            res.statusCode = HttpStatus.BAD_REQUEST
        }
        return res;
    }

    /**
    * 
    * @returns the lis of all products
    */
    async findAll(page?: number, limit?: number) {
        const res = new ApiResponseDTO<ProductObjectToSendWithImage[]>();
        let totalGet = 0;
        try {
            let [result, total] = await this.productRepository.createQueryBuilder('product')
                .leftJoinAndSelect('product.stock', 'stock')
                .skip(page * limit)
                .take(limit)
                .getManyAndCount();
            totalGet = total;
            // create an object of the type catget to retria
            let productsGet: ProductObjectToSendWithImage[] = [];

            for (let index = 0; index < result.length; index++) {
                const product = result[index];
                //product objects with signed url
                let productGet = new ProductObjectToSendWithImage();
                let urlObj = new GetFileDto();
                urlObj.key = product.image;
                // get the signed link of the file
                let img = await this.uploadService.getUploadedObject(urlObj)
                // set the object 
                // catDto: object with the comments number not the comments object
                let productDto = new ProductObjectToSendDTO();
                // set the value of this object with the product get to the database
                productDto.id = product.id;
                productDto.name = product.name;
                productDto.price = product.price;
                productDto.description = product.description;
                if (product.stock) {
                    productDto.stock = product.stock.quantity;
                } else productDto.stock = 0

                productDto.created_at = product.created_at;
                productDto.updated_at = product.updated_at;
                // set the product value of the data to retrieve
                productGet.product = productDto;
                productGet.image = img;
                // updatte the table of cat with the signed link
                productsGet.push(productGet);
            }

            res.data = productsGet
            res.message = "success";
            res.statusCode = HttpStatus.OK;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message
        }
        return {
            ...res,
            totalItems: totalGet,
            currentPage: page,
            pageCount: Math.ceil(totalGet / limit),
        }
    }


    /**
     * 
     * @param id 
     * @returns returns the specified product by its email
     */
    async findOneById(id: string): Promise<ApiResponseDTO<ProductGetDTO>> {
        const res = new ApiResponseDTO<ProductGetDTO>();

        try {
            // get products with comments and user
            const product = await this.productRepository.findOne({
                where: {
                    id: id
                },
                relations: {
                    stock: true
                }
            });
            // check if the category exists
            if (!product) {
                throw new HttpException("product not found", HttpStatus.NOT_FOUND);
            }
            let productGet = new ProductGetDTO();
            let urlObj = new GetFileDto();
            urlObj.key = product.image;
            // get the signed link of the file
            let img = await this.uploadService.getUploadedObject(urlObj)
            // set the object 
            productGet.product = product;
            productGet.image = img;

            res.data = productGet;
            res.message = "success";
            res.statusCode = HttpStatus.OK;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message
        }
        return res;
    }

    /**
     * 
     * @param id 
     * @param newproduct 
     * @returns updates product information
     */
    async update(id: string, newproduct: UpdateProductDto, file?: Express.Multer.File) {
        const res = new ApiResponseDTO<Product>();
        try {
            const product = await this.productRepository.findOneBy({
                id
            });

            if (!product) {
                throw new HttpException("product not found", HttpStatus.NOT_FOUND);
            }

            if (file) {
                // Si une nouvelle image est fournie, mettez à jour l'image
                const newImage = await this.uploadService.upload(file.originalname, file.buffer);
                product.image = newImage;
            }

            // Mettez à jour les autres champs du product
            product.name = newproduct.name || product.name;
            product.description = newproduct.description || product.description;
            product.price = newproduct.price || product.price;

            // Si vous souhaitez également mettre à jour la catégorie, décommentez la ligne suivante
            // product.category = newproduct.category || product.category;

            // Enregistrez les modifications dans la base de données
            const result = await this.productRepository.save(product);

            res.data = result;
            res.message = "product updated successfully";
            res.statusCode = HttpStatus.OK;

        } catch (error) {
            res.message = error.message;
            res.statusCode = HttpStatus.BAD_REQUEST;
        }

        return res;
    }


    /**
     * 
     * @param id 
     * @returns delete product from database based on it's id
     */
    async deleteproductById(id: string) {
        const res = new ApiResponseDTO<Product>();
        try {
            // first get the product
            const product = await this.productRepository.findOneBy({ id: id });
            // then check if it exists
            if (product === undefined || product === null) {
                throw new HttpException("product doesn't exists", HttpStatus.BAD_REQUEST);
            }

            await this.productRepository.delete(id);
            res.statusCode = HttpStatus.OK;
            res.message = "product deleted successfully"
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message
        }
        return res;
    }
    /**
     * 
     * @returns delete all products from the database
     */
    async deleteAll(headers: string) {
        let token = headers["authorization"].split(' ')
        console.log(token[1]);
        const decodedJwtAccessToken: any = this.jwtService.decode(token[1]);
        console.log(decodedJwtAccessToken);
        if (decodedJwtAccessToken.role !== "Admin") {
            throw new HttpException('Your are not admin', HttpStatus.UNAUTHORIZED);
        }
        return await this.productRepository.clear();
    }
}
