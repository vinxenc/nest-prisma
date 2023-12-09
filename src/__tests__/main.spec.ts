import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@services';

import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';

describe('HealthzController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [],
      providers: [PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    app = testModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  describe('/healthz (GET)', () => {
    it('response success', () => {
      return request(app.getHttpServer())
        .get('/healthz')
        .expect(200)
        .expect({
          status: 'ok',
          info: {
            database: {
              status: 'up',
            },
          },
          error: {},
          details: {
            database: {
              status: 'up',
            },
          },
        });
    });
  });
});
