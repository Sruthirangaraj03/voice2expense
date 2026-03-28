import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getSummary(req.user.sub, from, to);
  }

  @Get('breakdown')
  getBreakdown(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getBreakdown(req.user.sub, from, to);
  }

  @Get('notifications')
  getNotifications(@Request() req: any) {
    return this.analyticsService.getNotifications(req.user.sub);
  }

  @Get('trends')
  getTrends(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getTrends(req.user.sub, from, to);
  }
}
