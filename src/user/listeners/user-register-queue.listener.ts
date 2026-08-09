import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueProducerService } from '../../queue/queue-producer.service';

@Injectable()
export class UserRegisterQueueListener {
  private readonly logger = new Logger(UserRegisterQueueListener.name);

  constructor(private readonly queueProducer: QueueProducerService) {}

  @OnEvent('user.register', { async: true })
  async handleUserRegister(payload: {
    id: string;
    email: string;
    name: string | null;
  }): Promise<void> {
    try {
      await this.queueProducer.enqueueUserRegister({
        payload: {
          userId: payload.id,
          email: payload.email,
          name: payload.name || '',
        },
      });
    } catch (error) {
      this.logger.error('Failed to enqueue user register job', error);
    }
  }
}
