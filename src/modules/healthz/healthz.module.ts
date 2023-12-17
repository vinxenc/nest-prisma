import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '@services';
import { HealthzController } from './healthz.controller';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule, TerminusModule],
  controllers: [HealthzController],
  providers: [PrismaService],
})
export class HealthzModule {}
