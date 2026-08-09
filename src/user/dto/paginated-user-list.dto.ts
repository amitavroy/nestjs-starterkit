import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/pagination/paginated-response.dto.js';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto.js';
import { UserResponseDto } from './user-response.dto.js';

export class PaginatedUserListDto extends PaginatedResponseDto<UserResponseDto> {
  @ApiProperty({ type: [UserResponseDto] })
  declare items: UserResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  declare meta: PaginationMetaDto;
}
