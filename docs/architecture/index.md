The Nest Stay API

# Architecture references
- for any event-driven code task (services emitting events, listeners, queues, processors), refer to `docs/architecture/event-driven-architecture.md`

# Database and Models
- Models should be singular for example User, Property, Location etc. and their database table name will be plural. So, users, properties, locations etc.
- Foreign keys should follow camel case naming convention. so, locationId instead of location_id
- queries should be inside repositories and service should call the repositories to fetch data
- add models should have primary key as BigInt. But the models which will be public facing, will have a slug column and it will use ulid

# Data integrity

- When a single operation writes to multiple tables, analyse whether those writes need to be atomic.
- If it's clear that partial completion would leave inconsistent or orphaned data (e.g. one row updated but its corresponding audit/log row missing), wrap the writes in a single database transaction (e.g. Prisma's `$transaction`).
- If it's not clear, ask the operator what they want before implementing, and plan accordingly based on their answer.
- Example: a balance decrement paired with a corresponding ledger/audit row insert — wrap both in one `prisma.$transaction`, since a crash between the two writes would leave the balance changed with no corresponding record of why.

# Global rules
- only services should be injected into other modules and should be exported from the parent modules
- repositories should never be used outside module
- controllers should always call services and not repositories
- requests, responses should always have a DTO
- service, repository should always define the type of data that they are taking as arguments and the response type
- prefer loading related data (e.g. images, favourite counts) via the database relation on the parent resource's response instead of a separate endpoint the client has to call per item. This matters most for anything returned in a paginated list — one extra API call per list item does not scale, so the relation must be embedded at the repository level (Prisma `include`) rather than fetched client-side in a loop
- when a relation is embedded into a parent resource's response DTO, strip identity fields (`id`) from the embedded shape — the relation is not being addressed on its own in that response, so its internal id has no reason to leak out.
- when planning a change that embeds a relation, always ask whether the relation's `createdAt`/`updatedAt` timestamps are actually needed by any consumer before including them in the embedded response shape — do not include them by default
