import { IsString, IsNumber, IsDateString, Min, Max, IsIn } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsIn(['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'other'])
  category: string;

  @IsDateString()
  month: string;

  @IsNumber()
  @Min(1)
  @Max(99999999.99)
  limit_amount: number;
}
