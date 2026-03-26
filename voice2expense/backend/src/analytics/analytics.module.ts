import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRefreshProcessor } from './analytics-refresh.processor';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRefreshProcessor],
})
export class AnalyticsModule {}
