import { IsString, MinLength, MaxLength } from 'class-validator';

export class ParseTextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text: string;
}

export class QueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  question: string;
}
