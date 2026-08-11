import { Injectable, Logger } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { RequestContextService } from '../common/context/request-context.service';
import { QueueJobData } from './queue.types';

@Injectable()
export abstract class QueueProducer {
  protected abstract readonly logger: Logger;

  constructor(private readonly requestContextService: RequestContextService) {}

  protected async enqueue<T extends object>({
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
