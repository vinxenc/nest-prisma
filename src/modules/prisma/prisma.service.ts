import { Injectable, OnApplicationShutdown, OnModuleInit, Scope } from '@nestjs/common';
import { ObserveLogger } from '@plugins/logger';
import { PrismaClient } from '@prisma/client';

@Injectable({ scope: Scope.DEFAULT })
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private context: string;

  constructor(private readonly logger: ObserveLogger) {
    super();
    this.context = PrismaService.name;
  }

  async onApplicationShutdown(signal: string): Promise<void> {
    this.logger.warn(`On Application Shutdown ${signal}`, this.context);
    await this.$disconnect();
    this.logger.warn(`Prisma $disconnect`, this.context);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
      .then(() => this.logger.log('connect databae success', PrismaService.name))
      .catch((err) => this.logger.error('connect database error', err, PrismaService.name));
  }
}
