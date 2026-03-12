import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTripDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
