import { Module, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@services';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, QueueType, env } from '@common';
import { ObserveLogger } from '@plugins';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { StockPriceProcessor, StockPriceQueueEvents } from './prcessors/stock-price.processor';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.STOCK_PRICE_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: QueueName.STOCK_PRICE_QUEUE,
      adapter: BullMQAdapter, // or use BullAdapter if you're using bull instead of bullMQ
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
    this.logger.warn(`On Application Shutdown ${signal}`, QueueModule.name);
    await this.stockPriceQueue.close();
    this.logger.warn(`Queue Closed`, QueueModule.name);
  }

  async onModuleInit(): Promise<void> {
    const repeatableJobs = await this.stockPriceQueue.getRepeatableJobs();

    await Promise.all(
      repeatableJobs.map((repeatableJob) =>
        this.stockPriceQueue.removeRepeatableByKey(repeatableJob.key),
      ),
    );

    await this.stockPriceQueue.add(
      QueueType.STOCK_PRICE_CRAWL,
      { code: null },
      {
        repeat: { pattern: env.STOCK_PRICE_CRAWL_REPEAT_PATTERN },
      },
    );
  }
}
