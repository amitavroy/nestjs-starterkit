# API request and response architecture

HTTP APIs in this project follow a consistent request validation, response envelope, and error shape. Controllers expose endpoints; services return typed DTOs; controllers wrap successful results in a standard envelope before sending the response.

## Request flow

```
Client → Controller → (Zod validation) → Service → Repository → Database
                ↓
         Response envelope or HTTP error
```

1. The **controller** receives the HTTP request and maps body/query/params to a request DTO.
2. **Validation** runs via Zod schemas before the request reaches business logic.
3. The **service** performs work and returns a typed response DTO (never raw Prisma models).
4. The **controller** wraps the service result in `ResponseApiDto` and returns it to the client.

Validation belongs at the HTTP boundary. Services assume they receive already-validated input.

## Request objects

Request DTOs live in each module’s `dto/` folder (e.g. `src/user/dto/create-user.dto.ts`).

### Validation (runtime)

Use **Zod** for runtime validation, per project standards. Define a Zod schema and validate incoming data in the controller (or via a shared pipe/guard) before calling the service.

### Documentation (Swagger)

Use **class-based DTOs with `@ApiProperty()` / `@ApiPropertyOptional()`** so OpenAPI schemas and examples render correctly in Swagger UI. Zod handles correctness at runtime; Swagger DTOs handle documentation.

Request DTO fields should include:

- **type** — accurate OpenAPI type (`string`, `number`, `boolean`, etc.)
- **description** — what the field means
- **example** — a realistic, valid example value
- **required vs optional** — match the Zod schema

Example request shape for user creation:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

Password fields use `format: 'password'` in Swagger and are never included in response DTOs.

## Success response envelope

Every successful API response (except legacy endpoints documented otherwise) uses `ResponseApiDto`:

```typescript
export class ResponseApiDto<T = unknown> {
  success: boolean;   // e.g. true
  message: string;    // human-readable summary
  data: T;            // typed payload
}
```

Example:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "01JABC1234567890ABCDEFGH",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "lastLoggedIn": null,
    "createdAt": "2026-06-29T10:00:00.000Z",
    "updatedAt": "2026-06-29T10:00:00.000Z"
  }
}
```

### Controller responsibility

Services return plain DTOs. Controllers assemble the envelope:

```typescript
return {
  success: true,
  message: 'User created successfully',
  data: await this.userService.create(dto),
};
```

Do not return Prisma models or internal types from controllers.

## Error responses

Errors use NestJS built-in HTTP exceptions. The response body follows this shape:

```json
{
  "statusCode": 404,
  "message": "User 01JABC1234567890ABCDEFGH not found"
}
```

For validation failures, `message` may be a string or an array of constraint messages depending on the exception filter in use.

Common status codes:

| Status | When |
|--------|------|
| `400` | Invalid request body or query (validation failed) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `500` | Unexpected server error |

Services throw appropriate NestJS exceptions (`NotFoundException`, `ConflictException`, etc.). Controllers do not catch and re-wrap these unless adding context.

## Swagger documentation

Swagger UI is available at `/docs` in **development only** (disabled in production). The gate is controlled by the `APP_ENV` variable in `.env`, read via `ConfigService` in `src/main.ts`. Set `APP_ENV=development` to enable it locally.

### Reusable decorators

Shared decorators live under `src/common/swagger/` (or equivalent):

**`ApiEnvelopeResponse`** — documents a success response with typed `data`:

```typescript
export function ApiEnvelopeResponse(
  status: number,
  description: string,
  dataType: Type<unknown>,
) {
  return applyDecorators(
    ApiExtraModels(ResponseApiDto, dataType),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseApiDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dataType) },
            },
          },
        ],
      },
    }),
  );
}
```

**`ApiHttpErrorResponse`** — documents standard error shape:

```typescript
export function ApiHttpErrorResponse(
  status: number,
  description: string,
  messageExample: string,
) {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: status },
          message: { type: 'string', example: messageExample },
        },
      },
    }),
  );
}
```

Convenience helpers (e.g. `ApiConflictWithMessage`) wrap `ApiHttpErrorResponse` for common cases.

### Per-endpoint documentation

Each controller method should include:

- `@ApiTags()` on the controller
- `@ApiOperation()` with summary and description
- `@ApiEnvelopeResponse()` for success responses (with the correct `dataType`)
- `@ApiHttpErrorResponse()` (or convenience variants) for each applicable error status
- `@ApiProperty()` on all DTO fields referenced in the schema

Success responses must show a fully typed `data` object in Swagger, not an opaque `object`.

## Layer summary

| Layer | Returns | Notes |
|-------|---------|-------|
| Repository | Prisma model / DB row | Never exposed over HTTP |
| Service | Response DTO | No envelope; no password in user DTOs |
| Controller | `ResponseApiDto<T>` | Wraps service result; documents with Swagger decorators |

## Checklist for new endpoints

- [ ] Request DTO with Zod schema and `@ApiProperty()` examples
- [ ] Response DTO in module `dto/` folder (no sensitive fields)
- [ ] Service returns response DTO only
- [ ] Controller wraps result in `ResponseApiDto`
- [ ] `@ApiEnvelopeResponse()` and error decorators on the handler
- [ ] Realistic examples in Swagger for both request and response
