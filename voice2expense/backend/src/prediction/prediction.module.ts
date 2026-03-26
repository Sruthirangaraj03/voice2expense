import { Module } from '@nestjs/common';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { PredictionProcessor } from './prediction.processor';

@Module({
  controllers: [PredictionController],
  providers: [PredictionService, PredictionProcessor],
})
export class PredictionModule {}
