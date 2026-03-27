import { Controller, Get, Post } from '@nestjs/common';
import { PredictionService } from './prediction.service';

const DEFAULT_USER_ID = '50f6bc48-568f-479e-901d-31eee14511aa';

@Controller('predictions')
export class PredictionController {
  constructor(private predictionService: PredictionService) {}

  @Get()
  getForecasts() {
    return this.predictionService.getForecasts(DEFAULT_USER_ID);
  }

  @Post('generate')
  generate() {
    return this.predictionService.generate(DEFAULT_USER_ID);
  }
}
