import { HttpStatus, Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDTO } from 'src/shared/response/api-response';

@Injectable()
export class RoleService {

    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    async findAll() {
        const res = new ApiResponseDTO<Role[]>();
        try {
            // await this.sharedService.checkIfAdmin(headers);
            const result = await this.roleRepository.find();
            res.data = result;
            res.message = "Successfully get users information";
            res.statusCode = HttpStatus.OK;
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message
        } 
        return res;
    }
}
