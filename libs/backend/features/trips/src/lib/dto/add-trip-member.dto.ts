export class AddTripMemberDto {
  email!: string;
  role!: 'EDITOR' | 'VIEWER';
}
