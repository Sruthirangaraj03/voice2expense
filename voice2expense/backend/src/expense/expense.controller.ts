import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, QueryExpensesDto } from './dto/expense.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateExpenseDto) {
    return this.expenseService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query() query: QueryExpensesDto) {
    return this.expenseService.findAll(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.expenseService.findOne(userId, id);
  }

  @Put(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.expenseService.remove(userId, id);
  }
}
