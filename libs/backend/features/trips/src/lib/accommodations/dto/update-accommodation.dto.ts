import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccommodationDto {
  @IsString() @IsOptional() name?: string;
  @IsDateString() @IsOptional() checkIn?: string;
  @IsDateString() @IsOptional() checkOut?: string;
  @IsString() @IsOptional() address?: string;
  @IsNumber() @IsOptional() price?: number;
}
