import { Logger } from '@nestjs/common';
import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_USER_EVENTS, JOB_USER_REGISTER } from '../queue.constants';
import { UserRegisterJobPayload } from '../queue.types';

@Processor(QUEUE_USER_EVENTS)
export class UserRegisterProcessor extends WorkerHost {
  private readonly logger = new Logger(UserRegisterProcessor.name);

  async process(job: Job<UserRegisterJobPayload>): Promise<void> {
    if (job.name === JOB_USER_REGISTER) {
      this.logger.log('Processing user register job', {
        userId: job.data.userId,
        email: job.data.email,
      });
    }
  }
}
