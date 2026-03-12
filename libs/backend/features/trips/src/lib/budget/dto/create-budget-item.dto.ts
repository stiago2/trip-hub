import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBudgetItemDto {
  @IsString()
  title!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || undefined)
  paidByUserId?: string;
}
