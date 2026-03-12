import { IsEmail, IsEnum } from 'class-validator';

export enum MemberRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(MemberRole)
  role!: MemberRole;
}
