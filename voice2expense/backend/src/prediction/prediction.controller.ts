import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PredictionService } from './prediction.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('predictions')
@UseGuards(AuthGuard('jwt'))
export class PredictionController {
  constructor(private predictionService: PredictionService) {}

  @Get()
  getForecasts(@CurrentUser('sub') userId: string) {
    return this.predictionService.getForecasts(userId);
  }

  @Post('generate')
  generate(@CurrentUser('sub') userId: string) {
    return this.predictionService.generate(userId);
  }
}
