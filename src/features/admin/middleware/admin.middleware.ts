// admin.middleware.ts

import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { log } from 'console';

@Injectable()
export class AdminMiddleware implements NestMiddleware {

    constructor(private readonly jwtService: JwtService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            await this.checkIfAdmin(req.headers);
            next();
        } catch (error) {
            next(error);
        }
    }

    async checkIfAdmin(headers: any) {
        try {
            // Get the token from headers
            let token = headers["authorization"].split(' ');
            const decodedJwtAccessToken = await this.jwtService.verify(token[1]);
            // log(headers)
            // Check if the user has admin rights
            if (!decodedJwtAccessToken.roles || !decodedJwtAccessToken.roles.includes("Admin")) {
                throw new HttpException('You are not an admin', HttpStatus.UNAUTHORIZED);
            }
        } catch (error) {
            throw new HttpException('You are not an admin', HttpStatus.UNAUTHORIZED);
        }
    }

}
