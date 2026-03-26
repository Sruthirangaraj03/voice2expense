import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupabaseService } from '../common/supabase/supabase.service';

@Processor('budget-alert')
export class BudgetAlertProcessor extends WorkerHost {
  private readonly logger = new Logger(BudgetAlertProcessor.name);

  constructor(private supabase: SupabaseService) {
    super();
  }

  async process(job: Job<{ userId: string; category: string }>) {
    const { userId, category } = job.data;
    this.logger.log(`Checking budget alert for user ${userId}, category: ${category}`);

    const client = this.supabase.getClient();
    const { data: status } = await client
      .from('budget_status')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (!status) return { alert: false };

    if (status.status === 'exceeded') {
      this.logger.warn(`Budget EXCEEDED for user ${userId}, category: ${category}`);
      // In production, trigger push notification or email here
      return { alert: true, type: 'exceeded', ...status };
    }

    if (status.status === 'warning') {
      this.logger.warn(`Budget WARNING for user ${userId}, category: ${category}`);
      return { alert: true, type: 'warning', ...status };
    }

    return { alert: false };
  }
}
