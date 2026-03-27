import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

const DEFAULT_USER_ID = '50f6bc48-568f-479e-901d-31eee14511aa';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getSummary(DEFAULT_USER_ID, from, to);
  }

  @Get('breakdown')
  getBreakdown(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getBreakdown(DEFAULT_USER_ID, from, to);
  }

  @Get('trends')
  getTrends(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getTrends(DEFAULT_USER_ID, from, to);
  }
}
