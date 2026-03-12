import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccommodationDto {
  @IsString()
  name!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}
