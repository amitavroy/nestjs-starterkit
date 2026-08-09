import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseApiDto } from '../dto/response-api.dto.js';

export function ApiEnvelopeResponse(status: number, description: string, dataType: Type<unknown>) {
  return applyDecorators(
    ApiExtraModels(ResponseApiDto, dataType),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseApiDto) },
          { properties: { data: { $ref: getSchemaPath(dataType) } } },
        ],
      },
    }),
  );
}
