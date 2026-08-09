import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_USER_EVENTS, JOB_USER_REGISTER } from './queue.constants';
import { UserRegisterJobPayload } from './queue.types';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(@InjectQueue(QUEUE_USER_EVENTS) private userEventsQueue: Queue) {}

  async enqueueUserRegister({ payload }: { payload: UserRegisterJobPayload }): Promise<void> {
    try {
      await this.userEventsQueue.add(JOB_USER_REGISTER, payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 3600,
        },
        removeOnFail: false,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue user register job', error);
      throw error;
    }
  }
}
