# Nestjs Starter Kit

A [NestJS](https://nestjs.com/) starter kit backed by PostgreSQL (via [Prisma](https://www.prisma.io/)), with Redis-backed caching and BullMQ job queues built in.

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL, accessed through Prisma ORM (`@prisma/adapter-pg`)
- **Cache / Queues:** Redis, via `ioredis` (cache) and BullMQ (job queues, with an optional Bull Board dashboard)
- **Auth:** JWT (Passport)
- **Validation:** Zod

## Prerequisites

- Node.js
- A running PostgreSQL instance
- A running Redis instance

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your own values:

   ```bash
   cp .env.example .env
   ```

   At minimum, set `DATABASE_URL` to point at your PostgreSQL instance and `JWT_SECRET` to a long random string.

3. Run database migrations:

   ```bash
   npm run prisma:migrate
   ```

4. Start the app:

   ```bash
   npm run start:dev
   ```

## Database

This project uses Prisma to manage the PostgreSQL schema and migrations.

| Command | Description |
| --- | --- |
| `npm run prisma:migrate` | Create/apply migrations in development |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:studio` | Open Prisma Studio to browse data |
| `npm run prisma:seed` | Run the database seeder |

### Seeding

The seeder lives at `prisma/seed.ts` and populates the database with development data:

- An admin user, upserted from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (defaults to `admin@example.com` / `password123` if unset)
- A configurable number of fake users (via [Faker](https://fakerjs.dev/)), generated up to `SEED_USER_COUNT` (default `10`), all created with the password in `SEED_USER_PASSWORD`

The seeder refuses to run when `APP_ENV=production`, so it's safe to keep `prisma:seed` wired into your workflow without risking a production database.

Run it with:

```bash
npm run prisma:seed
```

Seed-related environment variables (see `.env.example`):

```
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-me-to-secure-password
SEED_USER_COUNT=10
SEED_USER_PASSWORD=change-me-to-secure-password
```

## Useful Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start the app in watch mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Run the production build |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |
