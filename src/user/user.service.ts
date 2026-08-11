import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { PaginatedResponseDto } from '../common/pagination/paginated-response.dto.js';
import { mapToPaginatedResponse } from '../common/pagination/pagination.helper.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { RegisterResponseDto } from './dto/register-response.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserRepository } from './user.repository.js';
import { EVENT_USER_REGISTER } from './events/user.events.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: { email: string; password: string }): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail({ email });
    if (!user) throw new UnauthorizedException("Credentials doesn't match");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException("Credentials doesn't match");

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    await this.userRepository.updateLastLoggedIn({ id: user.id });
    this.eventEmitter.emit('user.loggedin', { userId: user.id });

    const dto = new LoginResponseDto();
    dto.token = token;
    dto.id = user.id;
    dto.email = user.email;
    return dto;
  }

  async register({ name, email, password }: { name: string; email: string; password: string }): Promise<RegisterResponseDto> {
    const existing = await this.userRepository.findByEmail({ email });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      data: { name, email, password: hashed, emailVerifiedAt: null },
    });

    this.eventEmitter.emit(EVENT_USER_REGISTER, { userId: user.id });

    const dto = new RegisterResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    return dto;
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.toDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByEmail({ email });
    return user ? this.toDto(user) : null;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.toDto(u));
  }

  async findAllPaginated({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }): Promise<PaginatedResponseDto<UserResponseDto>> {
    const result = await this.userRepository.findAllPaginated({ page, limit });
    return mapToPaginatedResponse(result, (u) => this.toDto(u));
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const data: UpdateUserDto = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    const user = await this.userRepository.update({ id, data });
    return this.toDto(user);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete({ id });
  }

  private toDto(user: {
    id: string;
    name: string | null;
    email: string;
    lastLoggedIn: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.lastLoggedIn = user.lastLoggedIn;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
