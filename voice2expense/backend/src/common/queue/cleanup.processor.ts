import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupabaseService } from '../supabase/supabase.service';

@Processor('cleanup')
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private supabase: SupabaseService) {
    super();
  }

  async process(job: Job) {
    this.logger.log('Running cleanup: purging old AI conversations');

    const client = this.supabase.getClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await client
      .from('ai_conversations')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    if (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
      throw error;
    }

    this.logger.log('Cleanup completed successfully');
    return { cleaned: true };
  }
}
