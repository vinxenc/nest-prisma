import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { env } from '@common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

require('module-alias/register');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(env.PORT);
}
bootstrap();
