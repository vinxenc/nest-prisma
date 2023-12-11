import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@services';
import { Public } from '../auth/auth.constant';

@Controller('healthz')
export class HealthzController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaService: PrismaService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealthIndicator.pingCheck('database', this.prismaService),
    ]);
  }
}
