import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSummary(userId, from, to);
  }

  @Get('breakdown')
  getBreakdown(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getBreakdown(userId, from, to);
  }

  @Get('trends')
  getTrends(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTrends(userId, from, to);
  }
}
