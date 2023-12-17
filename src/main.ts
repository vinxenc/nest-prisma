import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { env } from '@common';
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

  await app.listen(3000, '0.0.0.0');

  logger.log(`Application is runnong and listening port: ${env.PORT}`);
}

bootstrap();
