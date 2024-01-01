import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthzController } from './healthz.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, TerminusModule],
  controllers: [HealthzController],
  providers: [],
})
export class HealthzModule {}
