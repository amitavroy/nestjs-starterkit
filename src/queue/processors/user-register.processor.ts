import { Logger } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ContextAwareProcessor } from '../context-aware.processor';
import { QUEUE_USER_EVENTS, JOB_USER_REGISTER } from '../queue.constants';
import { QueueJobData, UserRegisterJobPayload } from '../queue.types';

@Processor(QUEUE_USER_EVENTS)
export class UserRegisterProcessor extends ContextAwareProcessor<UserRegisterJobPayload> {
  private readonly logger = new Logger(UserRegisterProcessor.name);

  protected async handle(
    job: Job<QueueJobData<UserRegisterJobPayload>>,
  ): Promise<void> {
    if (job.name === JOB_USER_REGISTER) {
      this.logger.log('Processing user register job', {
        userId: job.data.userId,
        email: job.data.email,
      });
    }
  }
}
