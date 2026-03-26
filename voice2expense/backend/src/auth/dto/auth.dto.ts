import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshDto {
  @IsString()
  refresh_token: string;
}
