import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
}

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, fn: () => T): T {
    return this.als.run(store, fn);
  }

  getRequestId(): string | undefined {
    return this.als.getStore()?.requestId;
  }
}
