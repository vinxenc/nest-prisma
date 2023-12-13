import request from 'supertest';
import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthModule } from "../../../src/modules/auth/auth.module";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaService } from "@services";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "@common";
import { expiresIn } from '../../../src/modules/auth/auth.constant';

describe('AuthController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [],
      providers: [
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = testModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    app.close();
  });

  afterEach(async () => {
    await prismaService.user.deleteMany({ where: { id: { gt: 0 } }});
  });

  describe('/auth/sign-up (POST)', () => {
    it('should failed Bad Request: password should not be empty', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          username: faker.person.middleName(),
          email: faker.internet.email(),
        });

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body).toEqual({
        error: 'Bad Request',
        message: ["password must be a string", 'password should not be empty'],
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should failed Bad Request: User Already Existed', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(bodyReq);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body).toEqual({
        error: 'Bad Request',
        message: 'User Already Existed',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should success sign up', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.CREATED);
      expect(body).toMatchObject({
        id: expect.any(Number),
        username: bodyReq.username,
      });
    })
  });

  describe('/auth/sign-in (POST)', () => {
    it('should failed Bad Request: password should not be empty', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          username: faker.person.middleName(),
        });

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body).toEqual({
        error: 'Bad Request',
        message: ["password must be a string", 'password should not be empty'],
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should failed Bad Request: User Not Found', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        password: faker.internet.password(),
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body).toEqual({
        error: 'Not Found',
        message: 'User Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    it('should success sign in', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        password: faker.internet.password(),
      };

      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ ...bodyReq, email: faker.internet.email() });

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.OK);
      expect(body).toMatchObject({
        id: expect.any(Number),
        username: bodyReq.username,
        accessToken: expect.any(String),
        expiresIn,
      });
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should failed Unauthorized: ', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get('/auth/profile');

      expect(status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body).toEqual({
        message: "Unauthorized",
        statusCode: HttpStatus.UNAUTHORIZED
      });
    });

    it('should success get profile', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        password: faker.internet.password(),
      };

      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ ...bodyReq, email: faker.internet.email() });

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(bodyReq);

      const accessToken = body.accessToken as string;
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set({ Authorization: `Bearer ${accessToken}` });

      expect(status).toBe(HttpStatus.OK);
      expect(body).toMatchObject({
        id: expect.any(Number),
        username: bodyReq.username,
        accessToken: expect.any(String),
        expiresIn,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        id: body.id,
        username: bodyReq.username,
      })
    })
  });
});