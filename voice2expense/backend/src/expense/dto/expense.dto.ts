import { IsString, IsNumber, IsOptional, IsIn, IsDateString, Min, Max, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  @Max(99999999.99)
  amount: number;

  @IsString()
  @IsIn(['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'other'])
  category: string;

  @IsString()
  @IsIn(['expense', 'income'])
  @IsOptional()
  type?: string = 'expense';

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['manual', 'voice'])
  @IsOptional()
  source?: string = 'manual';

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class UpdateExpenseDto {
  @IsNumber()
  @Min(0.01)
  @Max(99999999.99)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsIn(['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'other'])
  @IsOptional()
  category?: string;

  @IsString()
  @IsIn(['expense', 'income'])
  @IsOptional()
  type?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class QueryExpensesDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['date:asc', 'date:desc', 'amount:asc', 'amount:desc', 'category:asc', 'category:desc'])
  sort?: string = 'date:desc';
}
