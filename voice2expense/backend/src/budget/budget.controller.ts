import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/budget.dto';

const DEFAULT_USER_ID = '50f6bc48-568f-479e-901d-31eee14511aa';

@Controller('budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetService.create(DEFAULT_USER_ID, dto);
  }

  @Get()
  findAll(@Query('month') month?: string) {
    return this.budgetService.findAll(DEFAULT_USER_ID, month);
  }

  @Get('status')
  getStatus(@Query('month') month?: string) {
    return this.budgetService.getStatus(DEFAULT_USER_ID, month);
  }

  @Get('history')
  getHistory() {
    return this.budgetService.getHistory(DEFAULT_USER_ID);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetService.remove(DEFAULT_USER_ID, id);
  }
}
