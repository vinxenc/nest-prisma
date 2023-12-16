import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  async onModuleInit(): Promise<void> {
    await this.$connect()
      .then(() => console.log('connect success'))
      .catch((err) => console.error('connect error', err));
  }
}
