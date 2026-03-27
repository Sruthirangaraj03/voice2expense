import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, QueryExpensesDto } from './dto/expense.dto';

const DEFAULT_USER_ID = '50f6bc48-568f-479e-901d-31eee14511aa';

@Controller('expenses')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expenseService.create(DEFAULT_USER_ID, dto);
  }

  @Get()
  findAll(@Query() query: QueryExpensesDto) {
    return this.expenseService.findAll(DEFAULT_USER_ID, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(DEFAULT_USER_ID, id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(DEFAULT_USER_ID, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(DEFAULT_USER_ID, id);
  }
}
