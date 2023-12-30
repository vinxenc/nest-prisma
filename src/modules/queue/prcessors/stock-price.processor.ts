import { fork } from 'node:child_process';
import * as path from 'path';
import { QueueName, QueueType } from '@common';
import { PromisePool } from '@supercharge/promise-pool';
import {
  QueueEventsListener,
  QueueEventsHost,
  Processor,
  WorkerHost,
  OnQueueEvent,
  InjectQueue,
} from '@nestjs/bullmq';
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
    const processPath = path.resolve(__dirname + '../../../../child-processor/stock-price.processor');
    const child = fork(processPath);

    return new Promise((resolve, reject) => {
      child.on('message', (result: number) => {
        child.kill('SIGINT');
        resolve(result);
      });

      child.on('error', (error: Error) => {
        reject(error)
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
      }
    };
    const data = {
      stockId,
      price: new Prisma.Decimal(price).toNumber(),
      date: new Date(),
    };

    return await this.prismaService.stockPrice.upsert({
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

  // @OnWorkerEvent('completed')
  // onCompleted(job: Job<any, any, any>) {
  //   console.log(' job completed ', job.id);
  // }
}

@QueueEventsListener(QueueName.STOCK_PRICE_QUEUE)
export class StockPriceQueueEvents extends QueueEventsHost {
  private contextName: string;

  constructor(private readonly logger: ObserveLogger) {
    super();
    this.contextName = StockPriceQueueEvents.name;
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string }): void {
    this.logger.log(`job completed: ${JSON.stringify(job)} `, this.contextName);
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; failedReason: string }): void {
    this.logger.error(`job failed: ${JSON.stringify(job)} `, job.failedReason, this.contextName);
  }

  @OnQueueEvent('progress')
  onProgress(job: { jobId: string; failedReason: string }): void {
    this.logger.log(`job progess: ${JSON.stringify(job)} `, this.contextName);
  }

  @OnQueueEvent('error')
  onError(error: Error): void {
    this.logger.error(`job error: ${error.message}`, error.stack, this.contextName);
  }

  // @OnQueueEvent('waiting')
  // onWaiting(job: unknown) {
  //   console.error(' job waiting ', job);
  // }

  // @OnQueueEvent('active')
  // onActive(job: unknown) {
  //   console.error(' job active ', job);
  // }

  // @OnQueueEvent('added')
  // onAdded(job: unknown) {
  //   console.error(' job added ', job);
  // }

  // @OnQueueEvent('cleaned')
  // onCleaned(job: unknown) {
  //   console.error(' job cleaned ', job);
  // }

  // @OnQueueEvent('delayed')
  // onDelayed(job: unknown) {
  //   console.error(' job delayed ', job);
  // }

  // @OnQueueEvent('drained')
  // onDrained(job: unknown) {
  //   console.error(' job drained ', job);
  // }

  // @OnQueueEvent('duplicated')
  // onDuplicated(job: unknown) {
  //   console.error(' job duplicated', job);
  // }

  // @OnQueueEvent('paused')
  // onPaused(job: unknown) {
  //   console.error(' job paused ', job);
  // }

  // @OnQueueEvent('removed')
  // onRemoved(job: unknown) {
  //   console.error(' job removed ', job);
  // }

  // @OnQueueEvent('resumed')
  // onResumed(job: unknown) {
  //   console.error(' job resumed ', job);
  // }

  // @OnQueueEvent('retries-exhausted')
  // onRetriesExhausted(job: unknown) {
  //   console.error(' job retries-exhausted ', job);
  // }

  // @OnQueueEvent('stalled')
  // onStalled(job: unknown) {
  //   console.error(' job stalled ', job);
  // }

  // @OnQueueEvent('waiting-children')
  // onWaitingChildren(job: unknown) {
  //   console.error(' job waiting-children ', job);
  // }
}
