import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { env } from '@common/env';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ObserveLogger } from './plugins/logger';

require('module-alias/register');

async function bootstrap(): Promise<void> {
  const logger = new ObserveLogger();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    snapshot: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // setupGracefulShutdown({ app });

  await app.listen(3000, '0.0.0.0');

  logger.log(`Running and listening port: ${env.PORT}`, 'Application');
}

bootstrap();
