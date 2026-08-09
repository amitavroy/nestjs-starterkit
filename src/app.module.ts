import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import {
  appConfig,
  corsConfig,
  databaseConfig,
  jwtConfig,
  queueConfig,
  redisConfig,
  validateEnv,
} from './config/index.js';
import { CacheModule } from './cache/cache.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, corsConfig, databaseConfig, jwtConfig, redisConfig, queueConfig],
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    CacheModule,
    QueueModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
