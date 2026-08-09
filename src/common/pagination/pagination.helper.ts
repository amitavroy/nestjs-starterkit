import { PageNumberPaginationMeta } from 'prisma-extension-pagination';
import { PaginatedResponseDto } from './paginated-response.dto.js';

export function mapToPaginatedResponse<TRow, TDto>(
  result: [TRow[], PageNumberPaginationMeta<true>],
  mapper: (row: TRow) => TDto,
): PaginatedResponseDto<TDto> {
  const [rows, meta] = result;
  const dto = new PaginatedResponseDto<TDto>();
  dto.items = rows.map(mapper);
  dto.meta = meta;
  return dto;
}
