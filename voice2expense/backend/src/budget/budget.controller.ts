import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/budget.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateBudgetDto) {
    return this.budgetService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query('month') month?: string) {
    return this.budgetService.findAll(req.user.sub, month);
  }

  @Get('status')
  getStatus(@Request() req: any, @Query('month') month?: string) {
    return this.budgetService.getStatus(req.user.sub, month);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.budgetService.getHistory(req.user.sub);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.budgetService.remove(req.user.sub, id);
  }
}
