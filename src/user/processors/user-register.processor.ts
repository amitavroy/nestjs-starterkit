import { Logger } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RequestContextService } from '../../common/context/request-context.service.js';
import { ContextAwareProcessor } from '../../queue/context-aware.processor.js';
import {
  QUEUE_USER_EVENTS,
  JOB_USER_REGISTER,
} from '../../queue/queue.constants.js';
import {
  QueueJobData,
  UserRegisterJobPayload,
} from '../../queue/queue.types.js';
import { UserRepository } from '../user.repository.js';

@Processor(QUEUE_USER_EVENTS)
export class UserRegisterProcessor extends ContextAwareProcessor<UserRegisterJobPayload> {
  private readonly logger = new Logger(UserRegisterProcessor.name);

  constructor(
    requestContextService: RequestContextService,
    private readonly userRepository: UserRepository,
  ) {
    super(requestContextService);
  }

  protected async handle(
    job: Job<QueueJobData<UserRegisterJobPayload>>,
  ): Promise<void> {
    if (job.name !== JOB_USER_REGISTER) return;

    const user = await this.userRepository.findById({ id: job.data.userId });
    if (!user) {
      this.logger.warn('User not found for register job', {
        userId: job.data.userId,
      });
      return;
    }

    this.logger.log('Processing user register job', {
      userId: user.id,
      email: user.email,
    });
  }
}
