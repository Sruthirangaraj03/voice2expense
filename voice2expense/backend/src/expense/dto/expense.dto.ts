import { IsString, IsNumber, IsOptional, IsDateString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  @Max(99999999.99)
  amount: number;

  @IsString()
  @IsIn(['food', 'transport', 'shopping', 'bills', 'health', 'fitness', 'entertainment', 'education', 'grooming', 'clothing', 'maintenance', 'travel', 'family', 'investments', 'donations', 'other'])
  category: string;

  @IsString()
  @IsOptional()
  sub_type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateExpenseDto {
  @IsNumber()
  @Min(0.01)
  @Max(99999999.99)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsIn(['food', 'transport', 'shopping', 'bills', 'health', 'fitness', 'entertainment', 'education', 'grooming', 'clothing', 'maintenance', 'travel', 'family', 'investments', 'donations', 'other'])
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  sub_type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class QueryExpensesDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  sort?: string;
}
