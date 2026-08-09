import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_USER_EVENTS } from './queue.constants';
import { QueueProducerService } from './queue-producer.service';
import { UserRegisterProcessor } from './processors/user-register.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisQueueUrl = configService.getOrThrow<string>('queue.url');
        const redisQueuePrefix = configService.getOrThrow<string>('queue.prefix');
        return {
          connection: {
            url: redisQueueUrl,
          },
          prefix: redisQueuePrefix,
        };
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_USER_EVENTS,
    }),
  ],
  providers: [QueueProducerService, UserRegisterProcessor],
  exports: [QueueProducerService],
})
export class QueueModule {}
