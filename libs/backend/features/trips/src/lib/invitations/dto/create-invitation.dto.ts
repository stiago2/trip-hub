import { IsEmail, IsEnum } from 'class-validator';

export enum MemberRole {
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(MemberRole)
  role!: MemberRole;
}
