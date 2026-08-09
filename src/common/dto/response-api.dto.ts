import { ApiProperty } from '@nestjs/swagger';

export class ResponseApiDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty()
  data: T;
}
