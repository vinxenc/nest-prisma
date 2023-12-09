import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '@services';
import { HealthzController } from './healthz.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthzController],
  providers: [PrismaService],
})
export class HealthzModule {}
