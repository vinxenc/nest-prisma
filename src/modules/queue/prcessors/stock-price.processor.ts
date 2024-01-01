import { QueueName, QueueType } from '@common/constants';
import { PromisePool } from '@supercharge/promise-pool';
import { Processor, WorkerHost, InjectQueue, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ObserveLogger } from '@plugins/logger';
import pick from 'lodash/pick';
import { Prisma } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { CACHE_KEY_HOLIDAYS, CACHE_ONE_DAY_TTL } from '@modules/cache/cache.constants';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ChildProcessService } from '@modules/child-process/child-process.service';
import { delay, jobOptions } from '../queue.constant';

dayjs.extend(utc);

type JobData = { stockId: number; code: string };
@Processor(QueueName.STOCK_PRICE_QUEUE)
export class StockPriceProcessor extends WorkerHost {
  private contextName: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue(QueueName.STOCK_PRICE_QUEUE) public stockPriceQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly logger: ObserveLogger,
    private readonly childProcessService: ChildProcessService,
  ) {
    super();
    this.contextName = StockPriceProcessor.name;
  }

  private async processCrawlPriceStocks(): Promise<number> {
    const holidays = await this.cacheManager.wrap<string[]>(
      CACHE_KEY_HOLIDAYS,
      async () => {
        const holidayRecords = await this.prismaService.holiday.findMany();

        return holidayRecords.map((holiday) => holiday.date.toISOString());
      },
      CACHE_ONE_DAY_TTL,
    );

    const currentDay = dayjs.utc().startOf('day').toDate().toISOString();

    if (holidays.includes(currentDay)) {
      return 0;
    }

    const stocks = await this.prismaService.stock.findMany();

    await PromisePool.withConcurrency(20)
      .for(stocks)
      .process((stock, i) =>
        this.stockPriceQueue.add(
          QueueType.STOCK_PRICE_CRAWL_DETAIL,
          { code: stock.code, stockId: stock.id },
          {
            delay: delay * i,
            ...jobOptions,
          },
        ),
      );

    return stocks.length;
  }

  private async processCrawlPriceStock(
    stockId: number,
    code: string,
  ): Promise<{
    id: number;
    stockId: number;
    price: number;
    date: Date;
  }> {
    const price = await this.childProcessService.getPrice(code);

    this.logger.log(`${stockId} ${code} price: ${price}`, this.contextName);

    const where = { stockId_date: { stockId, date: new Date() } };
    const data = {
      stockId,
      price: new Prisma.Decimal(price).toNumber(),
      date: new Date(),
    };

    return this.prismaService.stockPrice.upsert({
      where,
      update: data,
      create: data,
    });
  }

  async process(job: Job<JobData, null, QueueType>): Promise<number> {
    this.logger.log(
      `Process job: ${JSON.stringify(pick(job, ['id', 'name', 'data']))}`,
      this.contextName,
    );

    switch (job.name) {
      case QueueType.STOCK_PRICE_CRAWL: {
        return this.processCrawlPriceStocks();
      }

      case QueueType.STOCK_PRICE_CRAWL_DETAIL: {
        const { stockId, code } = job.data;
        const res = await this.processCrawlPriceStock(stockId, code);
        return res?.price;
      }

      default: {
        this.logger.warn('job name not support', this.contextName);
      }
    }

    return 0;
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<JobData, null, QueueType>, result: number): Promise<void> {
    this.logger.log(
      `job ${job.id} completed ${JSON.stringify(job)} result ${result}`,
      this.contextName,
    );

    await job.remove();
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobData>, error: Error): Promise<void> {
    this.logger.error(
      `job ${JSON.stringify(job)} failed error ${error.message} `,
      error.stack,
      this.contextName,
    );
  }

  @OnWorkerEvent('stalled')
  async onStalled(jobId: string, prev: string): Promise<void> {
    this.logger.warn(`job ${jobId} prev ${prev}`, this.contextName);
  }
}
