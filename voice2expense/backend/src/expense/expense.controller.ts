import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, QueryExpensesDto } from './dto/expense.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('expenses')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateExpenseDto) {
    return this.expenseService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: QueryExpensesDto) {
    return this.expenseService.findAll(req.user.sub, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.expenseService.findOne(req.user.sub, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.expenseService.remove(req.user.sub, id);
  }
}
