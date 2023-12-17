import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ObserveLogger } from '../plugins/logger';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly logger: ObserveLogger) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
      .then(() => this.logger.log('connect databae success', PrismaService.name))
      .catch((err) => this.logger.error('connect database error', err, PrismaService.name));
  }
}
