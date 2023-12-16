import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { env } from '@common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

require('module-alias/register');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    snapshot: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000, '0.0.0.0');

  console.log(`app running and listen in port: ${env.PORT}`);
}

bootstrap();
