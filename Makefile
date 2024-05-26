-include .env

.PHONY: install 

install :; yarn add @nestjs/swagger cookie-parser @nestjs/config typeorm @nestjs/typeorm @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @nestjs/axios @nestjs/jwt @nestjs/passport @nestjs/platform-express @nestjs/typeorm @types/bcrypt axios bcrypt cors dotenv mysql2 passport passport-jwt sharp class-validator && yarn add sharp --ignore-engines