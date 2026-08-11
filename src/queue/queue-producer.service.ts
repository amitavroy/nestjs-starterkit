import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';
import { RequestContextService } from '../common/context/request-context.service';
import { QUEUE_USER_EVENTS, JOB_USER_REGISTER } from './queue.constants';
import { QueueJobData, UserRegisterJobPayload } from './queue.types';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    @InjectQueue(QUEUE_USER_EVENTS) private readonly userEventsQueue: Queue,
    private readonly requestContextService: RequestContextService,
  ) {}

  async enqueueUserRegister({
    payload,
  }: {
    payload: UserRegisterJobPayload;
  }): Promise<void> {
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

  private async enqueue<T extends object>({
    queue,
    jobName,
    payload,
    options,
  }: {
    queue: Queue;
    jobName: string;
    payload: T;
    options?: JobsOptions;
  }): Promise<void> {
    const jobData: QueueJobData<T> = {
      ...payload,
      context: { requestId: this.requestContextService.getRequestId() },
    };

    try {
      await queue.add(jobName, jobData, options);
    } catch (error) {
      this.logger.error(`Failed to enqueue job "${jobName}"`, error);
      throw error;
    }
  }
}
