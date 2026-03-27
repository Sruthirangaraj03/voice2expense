import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { IsEmail, IsString } from 'class-validator';

class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.email, dto.password);
  }

  @Get('stats')
  getStats(@Headers('authorization') auth: string, @Query('filter') filter?: string) {
    this.verifyToken(auth);
    return this.adminService.getStats(filter);
  }

  @Get('clients')
  getClients(@Headers('authorization') auth: string, @Query('filter') filter?: string) {
    this.verifyToken(auth);
    return this.adminService.getClients(filter);
  }

  private verifyToken(auth: string) {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin token required');
    }
    this.adminService.verifyAdmin(auth.replace('Bearer ', ''));
  }
}
