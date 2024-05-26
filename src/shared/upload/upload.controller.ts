import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetFileDto, GetFileListDto } from './get-file-dto';

@ApiBearerAuth('JWT-auth')
@Controller('upload')
export class UploadController {

    constructor(private readonly uploadService: UploadService){}

    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Upload image' })
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile(
        new ParseFilePipe({
            validators: [
                // new MaxFileSizeValidator({ maxSize: 6000 }),
                // new FileTypeValidator({ fileType: 'image/jpeg' })
            ]
        })
    ) file: Express.Multer.File){
        return await this.uploadService.upload(file.originalname, file.buffer)
    }

    @Post("get-file")
    async getFile(@Body() getFile: GetFileDto){
        return await this.uploadService.getUploadedObject(getFile)
    }

    @Post("get-file-list")
    async getFileList(@Body() getFile?: GetFileListDto){
        return await this.uploadService.getSignedImageUrls(getFile.prefix)
    }
}
