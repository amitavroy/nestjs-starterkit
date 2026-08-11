export interface UserRegisterJobPayload {
  userId: string;
}

export interface JobContext {
  requestId?: string;
}

export type QueueJobData<T> = T & { context: JobContext };
