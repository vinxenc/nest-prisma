import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionFilter } from '@common';
import { HealthzModule } from './modules/healthz/healthz.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ObserveLogger } from './plugins/logger';

@Module({
  imports: [HealthzModule, AuthModule],
  controllers: [],
  providers: [
    ObserveLogger,
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
