import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PredictionService } from './prediction.service';

@Processor('prediction')
export class PredictionProcessor extends WorkerHost {
  private readonly logger = new Logger(PredictionProcessor.name);

  constructor(private predictionService: PredictionService) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    const { userId } = job.data;
    this.logger.log(`Generating predictions for user ${userId}`);

    const result = await this.predictionService.generate(userId);
    return result;
  }
}
