import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from "@nestjs/testing";
import { faker } from '@faker-js/faker';
import { AuthModule } from "../../../modules/auth/auth.module";
import { PrismaService } from "@services";
import { PrismaClient } from "@prisma/client";
import { mockDeep } from 'jest-mock-extended';
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { expiresIn, saltRounds } from '../../../modules/auth/auth.constant';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@common';

// describe('AuthController', () => {
//   let authController: AuthController;
  // let prismaService: PrismaService;
  // let userFindFirstSpy = jest.fn()
  // let userCreateSpy = jest.fn();
  // let userFindUniqueSpy = jest.fn();

//   beforeAll(async () => {
//     const app: TestingModule = await Test.createTestingModule({
//       imports: [AuthModule],
//       controllers: [],
//       providers: [],
//     })
//       .overrideProvider(PrismaService)
//       .useValue(mockDeep<PrismaClient>())
//       .compile();

//     authController = app.get<AuthController>(AuthController);
    // prismaService = app.get<PrismaService>(PrismaService);
    // prismaService.user.findFirst = userFindFirstSpy;
    // prismaService.user.create = userCreateSpy;
    // prismaService.user.findUnique = userFindUniqueSpy;
//   });

  // afterEach(async () => {
  //   userFindFirstSpy.mockReset();
  //   userCreateSpy.mockReset();
  //   userFindUniqueSpy.mockReset();
  // });

//   describe('/auth/sign-up (POST)', () => {
//     it('should failed Bad Request: User Already Existed', async () => {
//       const mockUser = {
//         id: faker.number.int(),
//         username: faker.person.middleName(),
//         email: faker.internet.email(),
//         password: faker.internet.password(),
//       };
//       userFindFirstSpy.mockResolvedValueOnce(mockUser);

//       authController.signUp(mockUser)
//         .then(() => fail('it should not reach here'))
//         .catch((error) => {
//           expect(userFindFirstSpy).toHaveBeenCalledWith({
//             where: {
//               OR: [
//                 { email : mockUser.email },
//                 { username: mockUser.username }
//               ]
//             }
//           });
//           expect(error instanceof BadRequestException).toBeTruthy();
//           const err = error as BadRequestException;
//           expect(err.message).toEqual('User Already Existed');
//           expect(err.getResponse()).toEqual({
//             message: 'User Already Existed',
//             error: 'Bad Request',
//             statusCode: HttpStatus.BAD_REQUEST
//           });
//         });
//     });

//     it('should success', async () => {
//       const mockUser = {
//         id: faker.number.int(),
//         username: faker.person.middleName(),
//         email: faker.internet.email(),
//         password: faker.internet.password(),
//       };
//       userFindFirstSpy.mockResolvedValueOnce(null);
//       userCreateSpy.mockResolvedValueOnce(mockUser);

//       const res = await authController.signUp(mockUser);
     
//       expect(res).toEqual({
//         ...mockUser,
//         password: undefined,
//         email: undefined,
//       });
//       expect(userFindFirstSpy).toHaveBeenCalledWith({
//         where: {
//           OR: [
//             { email : mockUser.email },
//             { username: mockUser.username }
//           ]
//         }
//       });
//       expect(userCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: {
//         ...mockUser,
//         password: expect.any(String),
//       }}));
//     });
//   });

//   describe('/auth/sign-in (POST)', () => {
//     it('should failed Bad Request: User Not Found', async () => {
//       const mockUser = {
//         username: faker.person.middleName(),
//         password: faker.internet.password(),
//       };
//       userFindUniqueSpy.mockResolvedValueOnce(null);

//       authController.signIn(mockUser)
//         .then(() => fail('it should not reach here'))
//         .catch((error) => {
//           expect(error instanceof NotFoundException).toBeTruthy();
//           const err = error as NotFoundException;
//           expect(err.message).toEqual('User Not Found');
//           expect(err.getResponse()).toEqual({
//             message: 'User Not Found',
//             error: 'Not Found',
//             statusCode: HttpStatus.NOT_FOUND
//           });
//           expect(userFindUniqueSpy).toHaveBeenCalledWith({ where: { username: mockUser.username }});
//         });
//     });

//     it('should success', async () => {
//       const mockUser = {
//         id: faker.number.int(),
//         username: faker.person.middleName(),
//         email: faker.internet.email(),
//         password: faker.internet.password(),
//       };
//       const salt = bcrypt.genSaltSync(saltRounds);
//       const passwordHash = await bcrypt.hash(mockUser.password, salt);

//       userFindUniqueSpy.mockResolvedValueOnce({
//         ...mockUser,
//         password: passwordHash,
//       });

//       const res = await authController.signIn({ 
//         username: mockUser.username,
//         password: mockUser.password
//       });

//       expect(res).toMatchObject({
//         ...mockUser,
//         email: undefined,
//         password: undefined,
//         accessToken: expect.any(String),
//         expiresIn,
//       });
//       expect(userFindUniqueSpy).toHaveBeenCalledWith({ where: { username: mockUser.username }});
//     });
//   });
// });


describe('AuthController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userFindFirstSpy = jest.fn()
  let userCreateSpy = jest.fn();
  let userFindUniqueSpy = jest.fn();

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
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    app = testModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prismaService = app.get<PrismaService>(PrismaService);
    prismaService.user.findFirst = userFindFirstSpy;
    prismaService.user.create = userCreateSpy;
    prismaService.user.findUnique = userFindUniqueSpy;
  });

  afterAll(async () => {
    app.close();
  });

  afterEach(async () => {
    userFindFirstSpy.mockReset();
    userCreateSpy.mockReset();
    userFindUniqueSpy.mockReset();
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
      const mockUser = {
        id: faker.number.int(),
        ...bodyReq,
      };
      userFindFirstSpy.mockResolvedValueOnce(mockUser);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body).toEqual({
        error: 'Bad Request',
        message: 'User Already Existed',
        statusCode: HttpStatus.BAD_REQUEST,
      });
      expect(userFindFirstSpy).toHaveBeenCalledWith({
        where: {
          OR: [
            { email : bodyReq.email },
            { username: bodyReq.username }
          ]
        }
      });
    });

    it('should success sign up', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const mockUser = {
        id: faker.number.int(),
        ...bodyReq,
      };
      userFindFirstSpy.mockResolvedValueOnce(null);
      userCreateSpy.mockResolvedValueOnce(mockUser);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.CREATED);
      expect(body).toEqual({
        ...mockUser,
        email: undefined,
        password: undefined,
      });
      expect(userFindFirstSpy).toHaveBeenCalledWith({
        where: {
          OR: [
            { email : mockUser.email },
            { username: mockUser.username }
          ]
        }
      });
      expect(userCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: {
        ...bodyReq,
        password: expect.any(String),
      }}));
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
      userFindUniqueSpy.mockResolvedValueOnce(null);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(body).toEqual({
        error: 'Not Found',
        message: 'User Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      });
      expect(userFindUniqueSpy).toHaveBeenCalledWith({ where: { username: bodyReq.username }});
    });

    it('should success sign in', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        password: faker.internet.password(),
      };

      const salt = bcrypt.genSaltSync(saltRounds);
      const passwordHash = await bcrypt.hash(bodyReq.password, salt);

      const mockUser = {
        id: faker.number.int(),
        ...bodyReq,
        email: faker.internet.email(),
        password: passwordHash,
      };
      

      userFindUniqueSpy.mockResolvedValueOnce(mockUser);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(bodyReq);

      expect(status).toBe(HttpStatus.OK);
      expect(body).toMatchObject({
        id: mockUser.id,
        username: mockUser.username,
        accessToken: expect.any(String),
        expiresIn,
      });
      expect(userFindUniqueSpy).toHaveBeenCalledWith({ where: { username: mockUser.username }});
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

    it('should success get profile: ', async () => {
      const bodyReq = {
        username: faker.person.middleName(),
        password: faker.internet.password(),
      };

      const salt = bcrypt.genSaltSync(saltRounds);
      const passwordHash = await bcrypt.hash(bodyReq.password, salt);

      const mockUser = {
        id: faker.number.int(),
        ...bodyReq,
        email: faker.internet.email(),
        password: passwordHash,
      };
      

      userFindUniqueSpy.mockResolvedValueOnce(mockUser);

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(bodyReq);

      const accessToken = body.accessToken as string;
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set({ Authorization: `Bearer ${accessToken}` });

      expect(status).toBe(HttpStatus.OK);
      expect(body).toMatchObject({
        id: mockUser.id,
        username: mockUser.username,
        accessToken: expect.any(String),
        expiresIn,
      });
      expect(userFindUniqueSpy).toHaveBeenCalledWith({ where: { username: mockUser.username }});

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        id: mockUser.id,
        username: mockUser.username,
      })
    })
  });
});
