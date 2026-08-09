import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { pagination } from 'prisma-extension-pagination';
import { PrismaClient } from '../../generated/prisma/client.js';

const paginationExtension = pagination({
  pages: {
    limit: 10,
    includePageCount: true,
  },
});

function extendWithPagination(client: PrismaClient) {
  return client.$extends(paginationExtension);
}

export type ExtendedPrismaClient = ReturnType<typeof extendWithPagination>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  readonly extendedClient: ExtendedPrismaClient;

  constructor(config: ConfigService) {
    const pool = new Pool({ connectionString: config.getOrThrow<string>('database.url') });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
    this.extendedClient = extendWithPagination(this);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
