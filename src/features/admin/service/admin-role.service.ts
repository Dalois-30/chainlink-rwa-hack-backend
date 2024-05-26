import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiResponseDTO } from 'src/shared/response/api-response';
import { In, Repository } from 'typeorm';
import { Request as RequestExpress, Response } from 'express';
import { SharedService } from 'src/shared/services/shared.service';
import { Role } from 'src/features/role/entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';

@Injectable()
export class AdminRoleService {

    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>
    ) { }

    /**
     * 
     * @param createRoleDto create role dto
     * @returns the role object
     */
    async createRole(createRoleDto: CreateRoleDto, response: Response) {
        const res = new ApiResponseDTO<Role>();
        try {

            const role = await this.roleRepository.findOneBy({ roleName: createRoleDto.roleName })
            if (role) {
                throw new HttpException('role already exists', HttpStatus.CONFLICT)
            }

            const newRole = new Role();
            newRole.roleName = createRoleDto.roleName;
            newRole.description = createRoleDto.description;

            const roleResponse = await this.roleRepository.save(newRole);
            // set the response object
            res.data = roleResponse;
            res.statusCode = HttpStatus.CREATED;
            res.message = "role created successfully"
        } catch (error) {
            res.statusCode = HttpStatus.BAD_REQUEST;
            res.message = error.message
        }
        // return response
        return response.send(res);
    }

    async updateRole(roleId: string, roleUpdateDto: CreateRoleDto) {
        const res = new ApiResponseDTO<Role>();
        try {
            const roleToUpdate = await this.roleRepository.findOneBy({
                id: roleId
            });

            if (!roleToUpdate) {
                throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
            }

            roleToUpdate.roleName = roleUpdateDto.roleName;
            roleToUpdate.description = roleUpdateDto.description;

            const updatedRole = await this.roleRepository.save(roleToUpdate);
            res.data = updatedRole;
            res.statusCode = HttpStatus.CREATED;
            res.message = "role updated successfully"
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        return res;
    }
}
