This is a Nestjs based project

# Naming conventions 
- In loops like forEach or  `return mapToPaginatedResponse(result, (u) => this.toDto(u));` single line variables should not be used. instead of the above example, you can do `return mapToPaginatedResponse(results, (uresult) => this.toDto(uresult));`. The entity in plural and then single is much more readable.

# Validations
- validations should be done using zod package.

# Type safe
- Code should be type safe. Always add types to function params, return types and other places where types are required.

# Function arguments
- Any function with multiple inputs or optional parameters must use a single object argument (destructured in the callee) instead of multiple positional arguments.

# Code architecture
- each module should have repositories which are responsible for database activities like select, insert, update and delete. No other place should directly have queries. 
- services should call repositories for data and return the data. if the data needs any kind of modification, service should do that.
- services should always return data in form of a dto. 
- each module should have a dto folder where dtos should be kept

# API request and response
- HTTP APIs use a standard success envelope (`ResponseApiDto`), NestJS error shape, Zod validation at the boundary, and Swagger DTOs for documentation.
- See [API request and response architecture](./api-req-resp.md) for envelopes, error formats, Swagger conventions, and the checklist for new endpoints.

# Events and background work
- Services emit in-process events via `EventEmitter2` with minimal payloads after successful writes; listeners enqueue jobs; queue processors perform side effects and load fresh data from repositories.
- See [Event architecture](./event-architecture.md) for the service → listener → queue → processor flow, payload rules, and `EventEmitter2` async/error-handling conventions.
