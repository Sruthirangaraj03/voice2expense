import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { BudgetAlertProcessor } from './budget-alert.processor';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, BudgetAlertProcessor],
  exports: [BudgetService],
})
export class BudgetModule {}
