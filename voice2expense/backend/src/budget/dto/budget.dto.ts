import { IsString, IsNumber, IsDateString, IsOptional, Min, Max, IsIn } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsIn(['food', 'transport', 'shopping', 'bills', 'health', 'fitness', 'entertainment', 'education', 'grooming', 'clothing', 'maintenance', 'travel', 'family', 'investments', 'donations', 'other'])
  category: string;

  @IsString()
  @IsIn(['weekly', 'monthly'])
  period_type: string;

  @IsNumber()
  @Min(1)
  @Max(99999999.99)
  limit_amount: number;

  @IsDateString()
  @IsOptional()
  month?: string;
}
