import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiHttpErrorResponse(status: number, description: string, messageExample: string) {
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

export function ApiConflictWithMessage(description: string, message: string) {
  return ApiHttpErrorResponse(409, description, message);
}
