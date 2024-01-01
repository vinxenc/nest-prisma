import { Public } from '@common/decorators';
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('healthz')
export class HealthzController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaService: PrismaService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealthIndicator.pingCheck('database', this.prismaService),
    ]);
  }
}
