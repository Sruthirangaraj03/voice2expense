import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ExpenseModule } from './expense/expense.module';
import { AIModule } from './ai/ai.module';
import { BudgetModule } from './budget/budget.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PredictionModule } from './prediction/prediction.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { QueueModule } from './common/queue/queue.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    SupabaseModule,
    QueueModule,
    AuthModule,
    ExpenseModule,
    AIModule,
    BudgetModule,
    AnalyticsModule,
    PredictionModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
