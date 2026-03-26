import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'budget-alert' },
      { name: 'analytics-refresh' },
    ),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
