import 'dotenv/config';
import './common/globals/runtime/app-info.global';
import './common/globals/runtime/services-status.global';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { APIDocs } from './common/api-docs/api-docs.module';
import { RabbitMQService } from './communication/rabbitMQ/rabbitmq.service';
import { DocumentBuilder } from '@nestjs/swagger';
import { LoggerService } from './common/logger/logger.service';
import { LoggerExceptionFilter } from './common/logger/logger-exception.filter';
import { SwaggerTagRegistry } from './common/api-docs/swagger-tag.registry';
import { registerTestWebhookListeners } from './webhooks/register-test-webhooks';
// import { bootstrapSocketIoRedis } from './communication/socketio/adapters/socketio-redis.boostrap';
import { StandardResponseInterceptor } from './utils/interceptors/message-response.interceptor';
import {
  bootstrapBullMqQueues,
  bootstrapQueueDash,
} from './common/queuedash/queuedash.bootstrap';
import { QueueDashManager } from './common/queuedash/queuedash.manager';
import {
  APP_DEFAULT_DOCS_HOST,
  APP_DEFAULT_DOCS_PATH,
  APP_DEFAULT_HEADER_LANGUAGE,
  APP_DEFAULT_PORT,
} from './config/types/app-const.type';
import { bootstrapAwsSecrets } from './config/aws-secrets-manager.bootstrap';

async function bootstrap() {
  // --- Secrets & app creation
  await bootstrapAwsSecrets();
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  // --- Resolve shared services
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);
  const rabbitMQService = app.get(RabbitMQService);
  const apiPrefix = configService.getOrThrow('app.apiPrefix', { infer: true });

  // --- Logging & global filters/interceptors/pipes
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.useGlobalFilters(
    new LoggerExceptionFilter(app.get(LoggerService), configService),
  );

  // Enable shutdown hooks (ensures close() is called)
  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new StandardResponseInterceptor(),
  );

  // --- Feature bootstraps (routes/middleware must be registered before listen)
  bootstrapBullMqQueues(app);
  bootstrapQueueDash(app);

  // --- API Docs (Swagger/Scalar) configuration
  const docsUrl = configService.get(
    'app.docsUrl',
    `${APP_DEFAULT_DOCS_HOST}:${APP.port}${APP_DEFAULT_DOCS_PATH}`,
    {
      infer: true,
    },
  );
  const openApiJsonUrl = docsUrl
    .replace(/\/docs\/?$/, '')
    .concat('/openapi.json');

  const builder = new DocumentBuilder()
    .setTitle(APP.name)
    .setDescription(
      [
        '[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)',
        `[![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)](${docsUrl})`,
        `[![ReadTheDocs](https://img.shields.io/badge/Readthedocs-%23000000.svg?style=for-the-badge&logo=readthedocs&logoColor=white)](${docsUrl.concat('/reference')})`,
        `[![OpenAPI JSON](https://img.shields.io/badge/OpenAPI-Download%20JSON-6BA539?style=for-the-badge&logo=openapi-initiative&logoColor=white)](${openApiJsonUrl})`,
      ].join(' '),
    )
    .setLicense('MIT', 'https://opensource.org/license/mit/')
    .addServer('/')
    .setExternalDoc('Documentation', docsUrl)
    .setVersion(APP.version)
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: configService.getOrThrow(
        'app.headerLanguage',
        APP_DEFAULT_HEADER_LANGUAGE,
        {
          infer: true,
        },
      ),
      schema: {
        example: 'en',
      },
    });
  const options = SwaggerTagRegistry.getInstance()
    .registerToBuilder(builder)
    .build();
  await APIDocs.setup(app, options); // doesn't need use swagger SwaggerModule.setup
  // --- Start HTTP server
  const httpPort = configService.getOrThrow('app.port', APP_DEFAULT_PORT, {
    infer: true,
  });
  try {
    await app.listen(httpPort, '0.0.0.0');
    // --- Post-start info logs (safe to call getUrl after listen)
    await APIDocs.info(app);
    await QueueDashManager.info(app);
  } catch (err) {
    logger.error(
      `Failed to start HTTP server on port ${httpPort}: ${
        (err as any)?.message ?? err
      }`,
    );
    throw err;
  }

  registerTestWebhookListeners(app);
  //
  // // Bootstrap Redis adapter for Socket.IO
  // const adapter = await bootstrapSocketIoRedis(app);
  // app.useWebSocketAdapter(adapter);

  // // Close adapter when HTTP server closes
  // app.getHttpServer().on('close', () => adapter.close());

  rabbitMQService.initialize(app);
  await app.startAllMicroservices();
  app.enableCors(); // <- Allow all CORS requests (default)
}
void bootstrap();
