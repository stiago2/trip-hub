import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDestinationActivityDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
