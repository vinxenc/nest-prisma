import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '@services';

import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { HealthzController } from '../../../modules/healthz/healthz.controller';
import { AppModule } from '../../../app.module';

describe('HealthzController', () => {
  let healthzController: HealthzController;
  let app: TestingModule;
  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule, TerminusModule],
      controllers: [HealthzController],
      providers: [PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    healthzController = app.get<HealthzController>(HealthzController);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/healthz (GET)', () => {
    it('should return susscess ping database check', async () => {
      const result = await healthzController.check();

      expect(result).toEqual({
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
