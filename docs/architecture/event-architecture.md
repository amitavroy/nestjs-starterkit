# Event architecture

Side effects (email, analytics, notifications, etc.) must not live in services. Services complete their primary work, emit an in-process event with a minimal payload, and return. Listeners react to events and may enqueue background jobs. Queue processors perform the actual work and load fresh data from the database when needed.

## Flow

```
Service → EventEmitter2 → Listener → Queue → Processor → Repository / external APIs
   ↑                           ↓
 returns DTO              (fan-out, enqueue)
```

1. The **service** persists or updates data via a repository, emits an event, and returns a DTO to the caller.
2. The **listener** handles the event in-process. It may fan out to one or more queues but should not perform heavy or slow work directly.
3. The **queue processor** runs asynchronously. It loads the latest row from the database (or calls external services) and performs the side effect.

This keeps HTTP handlers and core business flows fast and decoupled from downstream failures.

## Services emit events

When state change in a service should emit an event after the write succeeds if instructed by the operator (do not automatically add it). The service must not send email, call analytics, or enqueue jobs itself.

Event names use dot notation and past tense (e.g. `user.registered`, `user.loggedin`).

```typescript
@Injectable()
export class UserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async register(dto: RegisterDto) {
    const user = await this.createUser(dto);

    this.eventEmitter.emit('user.registered', {
      userId: user.id,
    });

    return user;
  }
}
```

### Minimal event payloads

Pass only identifiers and other data the listener needs to decide *what* to do—not full entity snapshots.

| Do | Don't |
|----|-------|
| `{ userId: user.id }` | Pass the entire Prisma model or DTO |
| Keep payloads small and stable | Include fields that may change before the job runs |
| Use typed event interfaces | Use untyped or `any` payloads |

Listeners and processors are responsible for loading current data. If a job runs after a delay, the processor queries the repository for the latest row so it always works against data that exists at execution time.

## Listeners enqueue work

When side effects should run in the background, the **listener** adds jobs to queues. Do not enqueue from the service.

```typescript
@Injectable()
export class UserRegisteredListener {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  @OnEvent('user.registered')
  async handle(payload: UserRegisteredEvent) {
    await this.emailQueue.add('send-welcome', {
      userId: payload.userId,
    });

    await this.analyticsQueue.add('track-signup', {
      userId: payload.userId,
    });
  }
}
```

Listeners may fan out to multiple queues. Job payloads can include a bit more context than the domain event (e.g. queue-specific fields), but prefer IDs and let the processor fetch names, emails, and other mutable fields from the database.

## Processors do the work

Queue processors perform the actual side effect. They should load fresh data before acting:

```typescript
@Processor('email')
export class EmailProcessor {
  constructor(private readonly userRepository: UserRepository) {}

  @Process('send-welcome')
  async sendWelcome(job: Job<{ userId: string }>) {
    const user = await this.userRepository.findById({ id: job.data.userId });
    if (!user) {
      // Row may have been deleted; log and complete or fail the job as appropriate
      return;
    }

    // Call mailer with user.email, user.name, etc.
  }
}
```

Processors call repositories (never raw queries elsewhere) and external services (mailer, analytics SDK, etc.). They must not emit the same domain event again unless that is an explicit part of the design.

## EventEmitter2 is in-process and synchronous by default

`EventEmitter2` runs inside the same Node process as the HTTP request. By default, listeners run **synchronously** in the same call stack as `emit()`. If a listener throws—or if an `async` listener rejects before you detach it—the error can bubble back to the service method (e.g. `register()`).

Use `{ async: true }` on `@OnEvent` so the handler runs asynchronously, and **always** catch errors inside the listener so a failed queue add does not fail the user-facing operation:

```typescript
@OnEvent('user.registered', { async: true })
async handle(payload: UserRegisteredEvent) {
  try {
    await this.emailQueue.add('send-welcome', { userId: payload.userId });
  } catch (err) {
    this.logger.error('Failed to queue welcome email', err);
    // Log and alert; do not rethrow — registration already succeeded
  }
}
```

Treat event emission as fire-and-forget from the caller’s perspective. The primary transaction (create user, update record, etc.) must succeed even when downstream enqueue or notification steps fail.

## Module layout

| Piece | Location | Responsibility |
|-------|----------|----------------|
| Event emission | `*.service.ts` | Emit after successful write; minimal payload |
| Event types | `events/` or next to the module | Typed payloads (e.g. `UserRegisteredEvent`) |
| Listeners | `*.listener.ts` | `@OnEvent` handlers; enqueue jobs; error handling |
| Processors | `*.processor.ts` | `@Processor` / `@Process`; load fresh data; side effects |
| Queues | Module imports `BullModule.registerQueue` | Named queues (`email`, `analytics`, etc.) |

Register listeners and processors in the module that owns the domain or in a dedicated integration module, and wire `EventEmitterModule.forRoot()` once in `AppModule`.

## Checklist for new side effects

- [ ] Service emits an event after the database write succeeds, with a minimal typed payload.
- [ ] Service returns the response DTO without awaiting listeners or queues.
- [ ] Listener uses `@OnEvent('...', { async: true })` and try/catch around queue adds.
- [ ] Processor loads fresh data via a repository before calling external systems.
- [ ] Job payload uses IDs; avoid stale copies of mutable fields when a DB read is cheap.
- [ ] Failures in listeners/processors are logged and monitored; they do not roll back the primary operation.
