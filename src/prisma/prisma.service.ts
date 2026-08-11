import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Logger } from 'nestjs-pino';
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
export class PrismaService
  extends PrismaClient<{
    adapter: PrismaPg;
    log: [{ level: 'query'; emit: 'event' }];
  }>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;
  private readonly debug: boolean;
  readonly extendedClient: ExtendedPrismaClient;

  constructor(
    config: ConfigService,
    private readonly logger: Logger,
  ) {
    const pool = new Pool({
      connectionString: config.getOrThrow<string>('database.url'),
    });
    const debug = config.getOrThrow<boolean>('app.debug');
    const options = {
      adapter: new PrismaPg(pool),
      ...(debug
        ? { log: [{ level: 'query' as const, emit: 'event' as const }] }
        : {}),
    } as { adapter: PrismaPg; log: [{ level: 'query'; emit: 'event' }] };
    super(options);
    this.pool = pool;
    this.debug = debug;
    this.extendedClient = extendWithPagination(this);
  }

  async onModuleInit() {
    await this.$connect();

    if (this.debug) {
      this.$on('query', (event) => {
        this.logger.debug({
          msg: event.query,
          params: event.params,
          duration: event.duration,
        });
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
