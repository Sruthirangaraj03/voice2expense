import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'budget-alert' },
      { name: 'analytics-refresh' },
      { name: 'prediction' },
      { name: 'cleanup' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
