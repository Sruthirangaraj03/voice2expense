import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ExpenseModule } from './expense/expense.module';
import { AIModule } from './ai/ai.module';
import { BudgetModule } from './budget/budget.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PredictionModule } from './prediction/prediction.module';
import { AdminModule } from './admin/admin.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { HealthController } from './health.controller';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    SupabaseModule,
    AuthModule,
    ExpenseModule,
    AIModule,
    BudgetModule,
    AnalyticsModule,
    PredictionModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
