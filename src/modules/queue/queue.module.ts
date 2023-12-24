import { Module, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@services';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, QueueType, env } from '@common';
import { ObserveLogger } from '@plugins';
import { StockPriceProcessor, StockPriceQueueEvents } from './prcessors/stock-price.processor';
import { LoggerModule } from '../logger/logger.module';
import { jobOptions } from './queue.constant';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.STOCK_PRICE_QUEUE,
    }),
    LoggerModule,
  ],
  providers: [PrismaService, StockPriceProcessor, StockPriceQueueEvents],
})
export class QueueModule implements OnModuleInit, OnApplicationShutdown {
  constructor(
    @InjectQueue(QueueName.STOCK_PRICE_QUEUE) public stockPriceQueue: Queue,
    private readonly logger: ObserveLogger,
  ) {}

  async onApplicationShutdown(signal: string): Promise<void> {
    this.logger.warn(`Before Application Shutdown ${signal}`, QueueModule.name);
    await this.stockPriceQueue.close();
    this.logger.warn(`Queue Closed`, QueueModule.name);
  }

  async onModuleInit(): Promise<void> {
    await this.stockPriceQueue.add(
      QueueType.STOCK_PRICE_CRAWL,
      { code: null },
      {
        repeat: { pattern: env.STOCK_PRICE_CRAWL_REPEAT_PATTERN },
        ...jobOptions,
      },
    );
  }
}
