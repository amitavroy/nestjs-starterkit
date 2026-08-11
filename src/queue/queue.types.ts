export interface UserRegisterJobPayload {
  userId: string;
  email: string;
  name: string;
}

export interface JobContext {
  requestId?: string;
}

export type QueueJobData<T> = T & { context: JobContext };
