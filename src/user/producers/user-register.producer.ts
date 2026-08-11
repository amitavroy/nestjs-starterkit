import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueProducer } from '../../queue/queue-producer.base.js';
import { RequestContextService } from '../../common/context/request-context.service.js';
import {
  QUEUE_USER_EVENTS,
  JOB_USER_REGISTER,
} from '../../queue/queue.constants.js';
import { UserRegisterJobPayload } from '../../queue/queue.types.js';

@Injectable()
export class UserRegisterProducer extends QueueProducer {
  protected readonly logger = new Logger(UserRegisterProducer.name);

  constructor(
    @InjectQueue(QUEUE_USER_EVENTS) private readonly userEventsQueue: Queue,
    requestContextService: RequestContextService,
  ) {
    super(requestContextService);
  }

  async enqueueUserRegister(payload: UserRegisterJobPayload): Promise<void> {
    await this.enqueue({
      queue: this.userEventsQueue,
      jobName: JOB_USER_REGISTER,
      payload,
      options: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 3600,
        },
        removeOnFail: false,
      },
    });
  }
}
