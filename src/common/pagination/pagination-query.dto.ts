import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ type: Number, description: 'Number of items per page (max 50)', example: 10, default: 10 })
  limit?: number;
}
