import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { PageNumberPaginationMeta } from 'prisma-extension-pagination';
import { UserModel } from '../../generated/prisma/models/User.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById({ id }: { id: string }): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail({ email }: { email: string }): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll(): Promise<UserModel[]> {
    return this.prisma.user.findMany();
  }

  async findAllPaginated({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }): Promise<[UserModel[], PageNumberPaginationMeta<true>]> {
    return this.prisma.extendedClient.user.paginate().withPages({ page, limit }) as Promise<
      [UserModel[], PageNumberPaginationMeta<true>]
    >;
  }

  async create({ data }: { data: CreateUserDto }): Promise<UserModel> {
    return this.prisma.user.create({
      data: {
        id: ulid(),
        name: data.name ?? null,
        email: data.email,
        password: data.password,
        emailVerifiedAt: data.emailVerifiedAt ?? null,
      },
    });
  }

  async update({ id, data }: { id: string; data: UpdateUserDto }): Promise<UserModel> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateLastLoggedIn({ id }: { id: string }): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoggedIn: new Date() },
    });
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
