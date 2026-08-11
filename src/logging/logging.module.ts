import { join } from 'node:path';
import { IncomingMessage } from 'node:http';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule, Params } from 'nestjs-pino';
import pino from 'pino';
import { RequestContextModule } from '../common/context/request-context.module';
import { RequestContextService } from '../common/context/request-context.service';

@Module({
  imports: [
    RequestContextModule,
    LoggerModule.forRootAsync({
      imports: [RequestContextModule],
      inject: [ConfigService, RequestContextService],
      useFactory: (
        configService: ConfigService,
        requestContextService: RequestContextService,
      ): Params => {
        const isProduction =
          configService.getOrThrow<string>('app.env') === 'production';
        const level = configService.getOrThrow<string>('logging.level');
        const toFile = configService.getOrThrow<boolean>('logging.toFile');
        const filePath = configService.getOrThrow<string>('logging.filePath');
        const fileLevel = configService.getOrThrow<string>('logging.fileLevel');

        const targets: pino.TransportTargetOptions[] = [
          isProduction
            ? { target: 'pino/file', level, options: { destination: 1 } }
            : { target: 'pino-pretty', level, options: { colorize: true } },
        ];

        if (toFile) {
          targets.push({
            target: 'pino-roll',
            level: fileLevel,
            options: {
              file: join(filePath, 'app'),
              frequency: 'daily',
              dateFormat: 'yyyy-MM-dd',
              extension: 'log',
              mkdir: true,
            },
          });
        }

        return {
          pinoHttp: {
            level,
            genReqId: (req: IncomingMessage & { id?: string }) => req.id,
            transport: { targets },
            mixin: () => {
              const requestId = requestContextService.getRequestId();
              return requestId ? { requestId } : {};
            },
          },
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
