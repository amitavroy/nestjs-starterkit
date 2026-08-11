import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cors from 'cors';
import { AppModule } from './app.module';
import { createRequestContextMiddleware } from './common/context/request-context.middleware';
import { RequestContextService } from './common/context/request-context.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(createRequestContextMiddleware(app.get(RequestContextService)));
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  const isProduction =
    configService.getOrThrow<string>('app.env') === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              'style-src': ["'self'", "'unsafe-inline'"],
            },
          },
    }),
  );

  const corsOrigins = configService.getOrThrow<string[]>('cors.origins');
  app.use(cors({ origin: corsOrigins, credentials: false }));

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Content Owl API')
      .setDescription('API documentation for Content Owl')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from POST /users/login',
        },
        'bearer',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const enableBullBoard = configService.getOrThrow<boolean>(
    'queue.enableBullBoard',
  );

  if (!isProduction || enableBullBoard) {
    const bullMQAdapter = new ExpressAdapter().setBasePath('/admin/queues');
    const userEventsQueue = app.get('BullQueue_user-events') as Queue;

    if (userEventsQueue) {
      createBullBoard({
        queues: [new BullMQAdapter(userEventsQueue)],
        serverAdapter: bullMQAdapter,
      });

      app.use('/admin/queues', bullMQAdapter.getRouter());
    }
  }

  await app.listen(configService.getOrThrow<number>('app.port'));
}
bootstrap();
