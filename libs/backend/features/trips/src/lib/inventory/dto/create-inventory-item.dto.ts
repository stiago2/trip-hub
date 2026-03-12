import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export enum InventoryCategory {
  CLOTHING = 'CLOTHING',
  TECH = 'TECH',
  TOILETRIES = 'TOILETRIES',
  DOCUMENTS = 'DOCUMENTS',
  OTHER = 'OTHER',
}

export class CreateInventoryItemDto {
  @IsString()
  name!: string;

  @IsEnum(InventoryCategory)
  category!: InventoryCategory;

  @IsInt()
  @Min(1)
  quantity!: number;
}
