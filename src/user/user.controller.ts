import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { PaginationQuerySchema } from '../common/pagination/pagination-query.schema.js';
import { ApiEnvelopeResponse } from '../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../common/dto/response-api.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LoginUserDto, LoginUserSchema } from './dto/login-user.dto.js';
import { PaginatedUserListDto } from './dto/paginated-user-list.dto.js';
import { RegisterResponseDto } from './dto/register-response.dto.js';
import { RegisterUserDto, RegisterUserSchema } from './dto/register-user.dto.js';
import { UserService } from './user.service.js';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users with pagination' })
  @ApiEnvelopeResponse(200, 'Users fetched successfully', PaginatedUserListDto)
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async findAll(@Query() query: PaginationQueryDto): Promise<ResponseApiDto<PaginatedUserListDto>> {
    const result = PaginationQuerySchema.safeParse(query);
    if (!result.success) {
      throw new UnprocessableEntityException(result.error.issues.map((e) => e.message));
    }

    const data = await this.userService.findAllPaginated(result.data);
    return { success: true, message: 'Users fetched successfully', data: data as PaginatedUserListDto };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiEnvelopeResponse(200, 'Login successful', LoginResponseDto)
  @ApiHttpErrorResponse(401, 'Unauthorized', "Credentials doesn't match")
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async login(@Body() body: LoginUserDto): Promise<ResponseApiDto<LoginResponseDto>> {
    const result = LoginUserSchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(result.error.issues.map((e) => e.message));
    }

    const data = await this.userService.login(result.data);
    return { success: true, message: 'Login successful', data };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiEnvelopeResponse(201, 'User registered successfully', RegisterResponseDto)
  @ApiHttpErrorResponse(409, 'Conflict', 'Email already registered')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async register(@Body() body: RegisterUserDto): Promise<ResponseApiDto<RegisterResponseDto>> {
    const result = RegisterUserSchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(result.error.issues.map((e) => e.message));
    }

    const data = await this.userService.register(result.data);
    return { success: true, message: 'User registered successfully', data };
  }
}
