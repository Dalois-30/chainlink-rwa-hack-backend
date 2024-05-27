import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';

export interface EnvData {
  [x: string]: any;
  // application
  APP_ENV: string;
  APP_DEBUG: boolean;

  // database
  DB_TYPE: 'mysql' | 'mariadb';
  DB_HOST?: string;
  DB_NAME: string;
  DB_PORT?: number;
  DB_USER: string;
  DB_PASSWORD: string;
}

@Injectable()
export class EnvService {
  private vars: EnvData;

  constructor() {
    const environment = process.env.NODE_ENV || 'development';
    let data: any = {};

    if (fs.existsSync(`.env`)) {
      data = dotenv.parse(fs.readFileSync(`.env`));
    }

    data.APP_ENV = environment;
    data.APP_DEBUG = data.APP_DEBUG === 'true' || process.env.APP_DEBUG === 'true';
    data.DB_TYPE = data.DB_TYPE || process.env.DB_TYPE;
    data.DB_HOST = data.DB_HOST || process.env.DB_HOST;
    data.DB_NAME = data.DB_NAME || process.env.DB_NAME;
    data.DB_PORT = parseInt(data.DB_PORT) || parseInt(process.env.DB_PORT);
    data.DB_USER = data.DB_USER || process.env.DB_USER;
    data.DB_PASSWORD = data.DB_PASSWORD || process.env.DB_PASSWORD;

    this.vars = data as EnvData;
  }

  read(): EnvData {
    return this.vars;
  }

  isDev(): boolean {
    return this.vars.APP_ENV === 'development';
  }

  isProd(): boolean {
    return this.vars.APP_ENV === 'production';
  }
}
