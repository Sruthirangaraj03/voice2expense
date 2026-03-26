import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';

@Processor('analytics-refresh')
export class AnalyticsRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsRefreshProcessor.name);

  constructor(private analyticsService: AnalyticsService) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    const { userId } = job.data;
    this.logger.log(`Refreshing analytics cache for user ${userId}`);

    // Pre-compute and cache analytics data
    await this.analyticsService.getSummary(userId);
    await this.analyticsService.getBreakdown(userId);
    await this.analyticsService.getTrends(userId);

    return { refreshed: true };
  }
}
