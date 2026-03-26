import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/budget.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(AuthGuard('jwt'))
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('month') month?: string) {
    return this.budgetService.findAll(userId, month);
  }

  @Get('status')
  getStatus(@CurrentUser('sub') userId: string, @Query('month') month?: string) {
    return this.budgetService.getStatus(userId, month);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.budgetService.remove(userId, id);
  }
}
