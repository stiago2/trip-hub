import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TransportType {
  FLIGHT = 'FLIGHT',
  BUS = 'BUS',
  TRAIN = 'TRAIN',
  CAR = 'CAR',
}

export class CreateTransportDto {
  @IsEnum(TransportType)
  type!: TransportType;

  @IsString()
  @IsNotEmpty()
  fromLocation!: string;

  @IsString()
  @IsNotEmpty()
  toLocation!: string;

  @IsDateString()
  departureTime!: string;

  @IsDateString()
  arrivalTime!: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}
