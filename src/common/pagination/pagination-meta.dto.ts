import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: true })
  isFirstPage: boolean;

  @ApiProperty({ example: false })
  isLastPage: boolean;

  @ApiProperty({ example: null, nullable: true })
  previousPage: number | null;

  @ApiProperty({ example: 2, nullable: true })
  nextPage: number | null;

  @ApiProperty({ example: 10 })
  pageCount: number;

  @ApiProperty({ example: 100 })
  totalCount: number;
}
