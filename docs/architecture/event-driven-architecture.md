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

Event names must be defined once as an exported constant (colocated with the other queue/event constants for that module) and imported by both the emitting service and the `@OnEvent` listener — never a raw string literal on either side. This keeps `emit()` and `@OnEvent(...)` from silently drifting apart on a typo.

```typescript
@Injectable()
export class UserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async register(dto: RegisterDto) {
    const user = await this.createUser(dto);

    this.eventEmitter.emit(EVENT_USER_REGISTERED, {
      userId: user.id,
    });

    return user;
  }
}
```

### Minimal event payloads

Pass only identifiers and other data the listener needs to decide _what_ to do—not full entity snapshots.

| Do                             | Don't                                              |
| ------------------------------ | -------------------------------------------------- |
| `{ userId: user.id }`          | Pass the entire Prisma model or DTO                |
| Keep payloads small and stable | Include fields that may change before the job runs |
| Use typed event interfaces     | Use untyped or `any` payloads                      |

Listeners and processors are responsible for loading current data. If a job runs after a delay, the processor queries the repository for the latest row so it always works against data that exists at execution time.

## Listeners enqueue work

When side effects should run in the background, the **listener** adds jobs to queues. Do not enqueue from the service.

Job names must also be defined once as an exported constant, colocated with the other queue/job constants for that module, and imported by both the listener that calls `queue.add(...)` and the processor's `@Process(...)` decorator — never a raw string literal on either side. This is the same failure mode as event names (see above): a typo or rename on one side otherwise fails silently, since nothing connects `queue.add('send-welcome', ...)` to `@Process('send-welcome')` at compile time.

```typescript
@Injectable()
export class UserRegisteredListener {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  @OnEvent(EVENT_USER_REGISTERED)
  async handle(payload: UserRegisteredEvent) {
    await this.emailQueue.add(JOB_SEND_WELCOME_EMAIL, {
      userId: payload.userId,
    });

    await this.analyticsQueue.add(JOB_TRACK_SIGNUP, {
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

  @Process(JOB_SEND_WELCOME_EMAIL)
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
@OnEvent(EVENT_USER_REGISTERED, { async: true })
async handle(payload: UserRegisteredEvent) {
  try {
    await this.emailQueue.add(JOB_SEND_WELCOME_EMAIL, { userId: payload.userId });
  } catch (err) {
    this.logger.error('Failed to queue welcome email', err);
    // Log and alert; do not rethrow — registration already succeeded
  }
}
```

Treat event emission as fire-and-forget from the caller’s perspective. The primary transaction (create user, update record, etc.) must succeed even when downstream enqueue or notification steps fail.

## Module layout

| Piece          | Location                                                                                                                     | Responsibility                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Event emission | `*.service.ts`                                                                                                               | Emit after successful write; minimal payload             |
| Event types    | `events/` or next to the module                                                                                              | Typed payloads (e.g. `UserRegisteredEvent`)              |
| Listeners      | `<domain-module>/listeners/*.listener.ts`                                                                                    | `@OnEvent` handlers; enqueue jobs; error handling        |
| Processors     | `<domain-module>/processors/*.processor.ts`                                                                                  | `@Processor` / `@Process`; load fresh data; side effects |
| Queues         | Central queue module: `BullModule.registerQueue`, queue name/job constants, shared job payload types, `QueueProducerService` | Generic BullMQ infra only — no domain logic              |

Listeners and processors are domain logic (they know what a `product.created` job means and what to do with it), so they belong in the module that owns that domain — e.g. `src/user/listeners/`, `src/user/processors/`, `src/product/listeners/`, `src/product/processors/` — not in the central queue module. The queue module stays infra-only: it wires `BullModule.forRootAsync`/`registerQueue`, exposes `QueueProducerService` with typed `enqueueXxx` methods, and holds the shared queue name/job constants and payload types that producers, listeners, and processors all import. `@Processor` classes don't need to import the central queue module to work — NestJS's BullMQ integration discovers them application-wide, so a processor can live in its domain module as a plain provider. Wire `EventEmitterModule.forRoot()` once in `AppModule`.

## Checklist for new side effects

- [ ] Service emits an event after the database write succeeds, with a minimal typed payload.
- [ ] Service returns the response DTO without awaiting listeners or queues.
- [ ] Listener uses `@OnEvent('...', { async: true })` and try/catch around queue adds.
- [ ] Processor loads fresh data via a repository before calling external systems.
- [ ] Job payload uses IDs; avoid stale copies of mutable fields when a DB read is cheap.
- [ ] Failures in listeners/processors are logged and monitored; they do not roll back the primary operation.
