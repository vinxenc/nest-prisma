import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionFilter, env } from '@common';
import { HealthzModule } from './modules/healthz/healthz.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggerModule } from './modules/logger/logger.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    LoggerModule,
    QueueModule,
    BullModule.forRoot({
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    }),
    LoggerModule,
    HealthzModule,
    AuthModule,
    // GracefulShutdownModule.forRoot({
    //   cleanup: async (app: INestApplication) => {
    //     logger.log('Graceful Shutdown Cleanup', GracefulShutdownModule.name);
    //     // releasing resources
    //     const queue = app.get(`BullQueue_${QueueName.SCHEDULE_QUEUE}`) as Queue;
    //     await queue.close();
    //     logger.log('Graceful Shutdown Cleanup Queue', `BullQueue_${QueueName.SCHEDULE_QUEUE}`);
    //     // const scheduleModule = app.select<ScheduleModule>(ScheduleModule);
    //     // console.log(scheduleModule,'scheduleModule')
    //     // const scheduleQueue = scheduleModule.get<Queue>(Queue);

    //   },
    //   gracefulShutdownTimeout: 10000,
    //   keepNodeProcessAlive: true,
    // }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule {}
