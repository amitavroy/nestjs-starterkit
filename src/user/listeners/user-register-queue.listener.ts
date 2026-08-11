import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisterProducer } from '../producers/user-register.producer.js';
import { EVENT_USER_REGISTER } from '../events/user.events.js';
import type { UserRegisteredEvent } from '../events/user.events.js';

@Injectable()
export class UserRegisterQueueListener {
  private readonly logger = new Logger(UserRegisterQueueListener.name);

  constructor(private readonly userRegisterProducer: UserRegisterProducer) {}

  @OnEvent(EVENT_USER_REGISTER, { async: true })
  async handleUserRegister(payload: UserRegisteredEvent): Promise<void> {
    try {
      await this.userRegisterProducer.enqueueUserRegister({
        userId: payload.userId,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue user register job', error);
    }
  }
}
