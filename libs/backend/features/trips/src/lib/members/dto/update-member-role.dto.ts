import { IsEnum } from 'class-validator';
import { MemberRole } from './invite-member.dto';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  role!: MemberRole;
}
