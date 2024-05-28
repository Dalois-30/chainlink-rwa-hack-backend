import {
  Injectable,
  UnauthorizedException,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import 'dotenv/config';
import { CreateUserDto, ResetPassWordDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { User } from '../entities/user.entity';
import { JwtPayloadService } from './jwt.payload.service';
import { Request as RequestExpress, Response } from 'express';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { SharedService } from 'src/shared/services/shared.service';
import { UsersService } from 'src/features/users/services/users.service';
import { UpdateUserDtoPassword } from '../dto/update-user-pwd.dto';
import { log } from 'console';
import { UserRolesEnum } from '../enums/user-roles';
import { Role } from 'src/features/role/entities/role.entity';

const phoneRegex = /^6(?=[579])([0-9]{8})/;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtPayloadService: JwtPayloadService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly sharedService: SharedService
  ) { }

  /**
   * 
   * @param createUserDto create user dto
   * @returns the created user
   */
  async create(createUserDto: CreateUserDto, response: Response) {
    const res = new ApiResponseDTO<User>();
    try {
      // check if user already exists
      const user = await this.usersService.findOneByEmail(createUserDto.email);

      if (user) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const userName = await this.userRepository.findOneBy({ username: createUserDto.username })
      if (userName) {
        throw new HttpException('username already exists', HttpStatus.CONFLICT)
      }
      // create new user
      const newUser = new User();
      newUser.email = createUserDto.email;
      newUser.password = createUserDto.password;
      newUser.username = createUserDto.username;

      // Trouver les rôles à partir des noms
      const userRole = await this.roleRepository.findOne({
        where: {
          roleName: UserRolesEnum.USER
        }
      });

      // Assigner les rôles à l'utilisateur
      if (userRole) {
        newUser.userRoles = [userRole];
      }

      const userResponse = await this.userRepository.save(newUser);
      // await this.sharedService.createEmailToken(newUser.email, response)
      // set the response object
      res.data = userResponse;
      res.statusCode = HttpStatus.CREATED;
      res.message = "user created successfully"
    } catch (error) {
      res.statusCode = HttpStatus.BAD_REQUEST;
      res.message = error.message
    }
    // return the response
    return response.send(res);

  }

  /**
   * 
   * @param createUserDto create user dto
   * @returns the created user
   */
  async createWithAddress(createUserDto: CreateUserDto, response: Response) {
    const res = new ApiResponseDTO<any>();
    try {
      // check if user already exists
      const user = await this.usersService.findOneByEmail(createUserDto.email);

      if (user) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const userName = await this.userRepository.findOneBy({ username: createUserDto.username })
      if (userName) {
        throw new HttpException('username already exists', HttpStatus.CONFLICT)
      }
      // create new user
      const newUser = new User();
      newUser.email = createUserDto.email;
      newUser.password = createUserDto.password;
      newUser.username = createUserDto.username;

      // Trouver les rôles à partir des noms
      const userRole = await this.roleRepository.findOne({
        where: {
          roleName: UserRolesEnum.USER
        }
      });

      // Assigner les rôles à l'utilisateur
      if (userRole) {
        newUser.userRoles = [userRole];
      }

      const userResponse = await this.userRepository.save(newUser);
      // await this.sharedService.createEmailToken(newUser.email, response)
      // set the response object
      res.data = this.jwtPayloadService.createJwtPayload(userResponse);
      res.statusCode = HttpStatus.CREATED;
      res.message = "user created successfully"
    } catch (error) {
      res.statusCode = HttpStatus.BAD_REQUEST;
      res.message = error.message
    }
    // return the response
    return response.send(res);

  }


  /**
   * 
   * @param userId the user id
   * @param resetPassWord dto containing the password reset
   * @returns successful message
   */
  async resetPassword(email: string, resetPassWord: ResetPassWordDto) {
    const res = new ApiResponseDTO<User>();
    try {
      // check if user exists
      const user = await this.userRepository.findOneBy({
        email: email,
      });
      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }
      const state = await this.checkPassword(resetPassWord.actualPassword, user);
      if (state) {
        const newUser = new UpdateUserDtoPassword();
        newUser.password = resetPassWord.newPassword;
        this.userRepository.merge(user, newUser);
        await this.userRepository.save(user);
        res.message = "Successful Updated";
        res.statusCode = HttpStatus.OK;
      } else {
        throw new HttpException('Wrong credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      res.statusCode = HttpStatus.BAD_REQUEST;
      res.message = error.message
    }
    return res;
  }
  /**
   * 
   * @param loginUserDto the credentials of user
   * @returns the user object
   */
  async validateUserByPassword(loginUserDto: LoginUserDto) {
    const res = new ApiResponseDTO<any>();
    try {
      const user = await this.usersService.findOneByEmail(loginUserDto.email);
      // log(user)
      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }
      // check password
      const promise: any = await new Promise(async resolve => {
        const state = await this.checkPassword(loginUserDto.password, user);
        if (state) {
          resolve(this.jwtPayloadService.createJwtPayload(user));
        } else {
          resolve({ status: 401 });
        }
      });

      if (promise.status !== 401) {
        res.data = promise;
        res.message = "Success"
        res.statusCode = HttpStatus.OK;
      } else {
        throw new HttpException('Wrong credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      res.statusCode = HttpStatus.BAD_REQUEST;
      res.message = error.message
    }
    return res;
  }

  /**
   * 
   * @param password 
   * @param user 
   * @returns check the users credentials
   */
  async checkPassword(password: string, user: User): Promise<boolean> {
    return new Promise(async resolve => {
      await bcrypt.compare(password, user.password, async (err, isMatch) => {
        if (err) {
          return err;
        }
        resolve(isMatch);
      });
    });
  }

  /**
   * 
   * @param payload the jwt payload
   * @returns 
   */
  async validateUserByJwt(payload: JwtPayload) {
    const user = await this.usersService.findOneByEmail(payload.email);
    // console.log(user);

    if (user) {
      return this.jwtPayloadService.createJwtPayload(user);
    } else {
      throw new UnauthorizedException();
    }
  }



  async verifyEmail(token: string, email: string, req: RequestExpress) {
    const otp = req.cookies['OTP'];
    if (!otp) {
      throw new HttpException(
        'token expired',
        HttpStatus.NOT_FOUND,
      );
    }
    const res = new ApiResponseDTO<string>()
    console.log(otp, token);
    if (otp !== token) {
      throw new HttpException('Otp invalide', HttpStatus.NOT_ACCEPTABLE);
    }
    const userFromDb = await this.usersService.findOneByEmail(
      email,
    );
    if (userFromDb) {
      await this.usersService.update(userFromDb.id, {
        verified: true,
      });
    }
    res.data = otp;
    res.message = "successfully verified OTP";

    return res;
  }

}
