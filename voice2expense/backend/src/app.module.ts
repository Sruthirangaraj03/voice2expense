import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ExpenseModule } from './expense/expense.module';
import { AIModule } from './ai/ai.module';
import { BudgetModule } from './budget/budget.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PredictionModule } from './prediction/prediction.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    ExpenseModule,
    AIModule,
    BudgetModule,
    AnalyticsModule,
    PredictionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
