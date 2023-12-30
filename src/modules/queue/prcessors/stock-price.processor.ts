import { fork } from 'node:child_process';
import * as path from 'path';
import { QueueName, QueueType } from '@common';
import { PromisePool } from '@supercharge/promise-pool';
import { Processor, WorkerHost, InjectQueue, OnWorkerEvent } from '@nestjs/bullmq';
import { PrismaService } from '@services';
import { Job, Queue } from 'bullmq';
import { ObserveLogger } from '@plugins';
import pick from 'lodash/pick';
import { Prisma } from '@prisma/client';
import { delay, jobOptions } from '../queue.constant';

@Processor(QueueName.STOCK_PRICE_QUEUE)
export class StockPriceProcessor extends WorkerHost {
  private contextName: string;

  constructor(
    @InjectQueue(QueueName.STOCK_PRICE_QUEUE) public stockPriceQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly logger: ObserveLogger,
  ) {
    super();
    this.contextName = StockPriceProcessor.name;
  }

  private async processCrawlPriceStocks(): Promise<number> {
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

  private getPrice(code: string): Promise<number> {
    const processPath = path.resolve(
      `${__dirname}../../../../child-processor/stock-price.processor`,
    );

    return new Promise((resolve, reject) => {
      const child = fork(processPath);
      child.on('message', (result: number) => {
        // child.kill('SIGINT');
        resolve(result);
      });

      child.on('error', (error: Error) => {
        reject(error);
      });

      child.send(code);
    });
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
    const price = await this.getPrice(code);

    this.logger.log(`${stockId} ${code} price: ${price}`, this.contextName);
    const where = {
      stockId_date: {
        stockId,
        date: new Date(),
      },
    };
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

  async process(job: Job<{ stockId: number; code: string }, null, QueueType>): Promise<any> {
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
        return this.processCrawlPriceStock(stockId, code);
      }

      default: {
        this.logger.log('job name not support', this.contextName);
      }
    }

    return 0;
  }

  @OnWorkerEvent('completed')
  async onCompleted(
    job: Job<{ stockId: number; code: string }, null, QueueType>, 
    result: any
  ): Promise<void> {
    this.logger.log(
      `job ${job.id} completed ${JSON.stringify(job)} result ${JSON.stringify(result)}`,
      this.contextName,
    );

    await job.remove();
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ stockId: number; code: string }>, error: Error): Promise<void> {
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
