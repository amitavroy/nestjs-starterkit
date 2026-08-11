import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_USER_EVENTS } from './queue.constants';

const userEventsQueue = BullModule.registerQueue({
  name: QUEUE_USER_EVENTS,
});

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisQueueUrl = configService.getOrThrow<string>('queue.url');
        const redisQueuePrefix =
          configService.getOrThrow<string>('queue.prefix');
        return {
          connection: {
            url: redisQueueUrl,
          },
          prefix: redisQueuePrefix,
        };
      },
    }),
    userEventsQueue,
  ],
  exports: [userEventsQueue],
})
export class QueueModule {}
