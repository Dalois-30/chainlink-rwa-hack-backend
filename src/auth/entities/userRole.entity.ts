import { Role } from "src/features/role/entities/role.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.userRoles)
  user: User;

  @ManyToOne(() => Role, role => role.userRoles)
  role: Role;

  // ... autres propriétés et méthodes
}
