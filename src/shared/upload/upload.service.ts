import { Injectable } from '@nestjs/common';
import { GetObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { GetFileDto } from './get-file-dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import * as sharp from 'sharp'; // Import de la bibliothèque Sharp
import { HttpService } from '@nestjs/axios';
import { log } from 'console';


@Injectable()
export class UploadService {
    private readonly s3Client = new S3Client({
        region: this.configService.get('AWS_S3_REGION'),
    });
    constructor(
        private readonly configService: ConfigService,
        private httpService: HttpService,
    ) { }

    /**
     * 
     * @param fileName the name of the file
     * @param file the binary file
     * @returns the key of the file newly uploaded
     */
    async upload(fileName: string, file: Buffer) {
        log("in the upload function");
        const compressedImageBuffer = await this.compressImage(file);
        const result = await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.configService.get('AWS_BUCKET_NAME'),
                Key: `chainlink/${fileName}`,
                Body: compressedImageBuffer,
            })
        )
        // console.log(result);
        const uploadedObjectUrl = `https://${this.configService.get('AWS_BUCKET_NAME')}.s3.amazonaws.com/chainlink/${fileName}`;
        console.log(uploadedObjectUrl);

        return `chainlink/${fileName}`;

    }

    // async compressImage(imageBuffer: Buffer): Promise<Buffer> {
    //     log("compressing image")
    //     const response = await this.httpService.post('https://api.tinify.com/shrink', imageBuffer, {
    //         headers: {
    //             Authorization: `Basic ${Buffer.from(`api:${this.configService.getOrThrow('TINY_API_KEY')}`).toString('base64')}`
    //         },
    //     }).toPromise();

    //     const tinypngFile = await this.downloadImage(response.data.output.url);

    //     // Redimensionnement de l'image avec Sharp
    //     const thumbnail = await sharp(tinypngFile)
    //         .resize(680, 383) // Remplacez par les dimensions souhaitées pour le thumbnail
    //         .toBuffer();
    //     log("compressing image done");
    //     return thumbnail;
    // }
    async compressImage(imageBuffer: Buffer): Promise<Buffer> {
        // Définir la taille cible et la qualité
        const targetWidth = 680; // Largeur cible
        const targetHeight = 383; // Hauteur cible
        const quality = 80; // Qualité de compression (de 1 à 100)

        // Compresser et redimensionner l'image avec Sharp
        return await sharp(imageBuffer)
            .resize(targetWidth, targetHeight)
            .jpeg({ quality: quality })
            .toBuffer();
    }

    private async downloadImage(url: string): Promise<Buffer> {
        const response = await this.httpService.get(url, { responseType: 'arraybuffer' }).toPromise();
        return Buffer.from(response.data, 'binary');
    }

    /**
     * 
     * @param key the key of the file to retrieve
     * @returns the link access to the file, valid only for 15min
     */
    async getUploadedObject(key: GetFileDto) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.configService.get('AWS_BUCKET_NAME'),
                Key: key.key
            })

            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: 15 * 60
            })
            return url;
        } catch (err) {
            console.log(err);
            throw new Error('Impossible de récupérer l\'image.');
        }
    }

    /**
     * 
     * @param prefix the prefix of the object in bucket
     * @returns the 
     */
    async getSignedImageUrls(prefix?: string) {

        try {
            // Retrieve list of all objects/images in your folder.
            // by default get all objects in the buckeck if no prefix found
            let command = new ListObjectsCommand({ Bucket: this.configService.get('AWS_BUCKET_NAME') })
            if (prefix) {
                // if prefix, get a spécific folder
                command = new ListObjectsCommand({ Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'), Prefix: prefix });
            }
            const listObjectsCommand = command
            const listObjectsResult = await this.s3Client.send(listObjectsCommand);

            // Get prefixes for each object
            const contents = listObjectsResult.Contents || [];

            // Create a list of signed URLs for each object
            const presignedUrls = await Promise.all(contents.map(async (object) => {
                // Get URL parameters for object
                const urlParams = {
                    Bucket: this.configService.get('AWS_BUCKET_NAME'),
                    Key: object.Key
                };

                // Get a signed URL for the object
                const getCommand = new GetObjectCommand(urlParams);
                const presignedUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 3600 });

                return presignedUrl;
            }));

            console.log(presignedUrls);
            return presignedUrls;
        } catch (err) {
            console.log('Error', err);
            return [];
        }
    }
}

