import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { SttService } from './stt.service';
import { LlmService } from './llm.service';
import { ExpenseModule } from '../expense/expense.module';
import { BudgetModule } from '../budget/budget.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ExpenseModule, BudgetModule, AuthModule],
  controllers: [AIController],
  providers: [AIService, SttService, LlmService],
  exports: [AIService],
})
export class AIModule {}
