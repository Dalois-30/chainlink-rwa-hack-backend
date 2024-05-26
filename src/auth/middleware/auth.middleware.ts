// logger.middleware.ts

import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt'; // Importez le service JWT
import 'dotenv/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logDecodedToken(req.headers);
    next();
  }

  logDecodedToken(headers: any) {
    try {
      const decodedJwtAccessToken = this.verifyToken(headers);
      console.log('Decoded JWT Access Token:', decodedJwtAccessToken);
    } catch (error) {
      console.error('Error decoding JWT Access Token:', error.message);
    }
  }

  async verifyToken(headers: any) {
    try {
        // Get the token from headers
        let token = headers["authorization"].split(' ');

        // Verify and decode the token
        const decodedJwtAccessToken: any = await this.jwtService.verify(token[1]);

        // Le token est vérifié et décodé avec succès  
        return decodedJwtAccessToken;
    } catch (error) {
        // Une erreur s'est produite lors de la vérification ou du décodage du token
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
}
}
