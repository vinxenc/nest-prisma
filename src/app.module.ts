import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthzModule } from './modules/healthz/healthz.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [HealthzModule, AuthModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
