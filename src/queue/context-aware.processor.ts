import { Injectable } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RequestContextService } from '../common/context/request-context.service';
import { QueueJobData } from './queue.types';

@Injectable()
export abstract class ContextAwareProcessor<T> extends WorkerHost {
  constructor(private readonly requestContextService: RequestContextService) {
    super();
  }

  async process(job: Job<QueueJobData<T>>): Promise<void> {
    const requestId = job.data.context?.requestId;

    if (!requestId) {
      await this.handle(job);
      return;
    }

    await this.requestContextService.run({ requestId }, () => this.handle(job));
  }

  protected abstract handle(job: Job<QueueJobData<T>>): Promise<void>;
}
