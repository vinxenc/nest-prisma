import { QueueName, QueueType } from '@common';
import { PromisePool } from '@supercharge/promise-pool'
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
import isString from 'lodash/isString';
import puppeteer, { Browser } from 'puppeteer';
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

    await PromisePool
      .withConcurrency(20)
      .for(stocks)
      .process((stock, i) => this.stockPriceQueue.add(
        QueueType.STOCK_PRICE_CRAWL_DETAIL,
        { code: stock.code, stockId: stock.id },
        {
          delay: delay * i,
          ...jobOptions,
        },
      ));

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
    let browser: Browser;

    try {
      if (!stockId) {
        return;
      }

      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      // Create a page
      const page = await browser.newPage();

      // Go to your site
      await page.goto(`https://24hmoney.vn/stock/${code}`);
      await page.waitForSelector('.price-detail .price');
      const priceStr = await page.$eval('.price-detail .price', (el) => el.textContent);
      this.logger.log(`${stockId} ${code} price: ${priceStr}`, this.contextName);
      await browser.close();

      return await this.prismaService.stockPrice.upsert({
        where: {
          stockId_date: {
            stockId,
            date: new Date(),
          },
        },
        update: {},
        create: {
          stockId,
          price: new Prisma.Decimal(priceStr).toNumber(),
          date: new Date(),
        },
      });
    } catch (error: unknown) {
      const message = isString(error) ? error : (error as Error).message;
      const stack = isString(error) ? (error as string) : (error as Error).stack;
      this.logger.error(`Process Crawl Price Stock Error: ${message}`, stack, this.contextName);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
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
