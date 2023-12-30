import { ObserveLogger } from '../plugins';
import { Money24hService } from '../external';

export class StockPriceProcessor {
  private context: string;

  private pageCrawlService: Money24hService;

  private logger: ObserveLogger;

  constructor() {
    this.context = StockPriceProcessor.name;
    this.logger = new ObserveLogger();
  }

  async onApplicationShutdown(signal: string): Promise<void> {
    this.logger.warn(`On Application Shutdown ${signal}`, this.context);
    // this.logger.warn(`Prisma $disconnect`, this.context);
  }

  async getPrice(code: string): Promise<number> {
    this.pageCrawlService = new Money24hService(code);

    const price = await this.pageCrawlService.getPrice();

    return price;
  }
}

process.on('message', async (code: string) => {
  const processor = new StockPriceProcessor();
  const result = await processor.getPrice(code);
  process.send(result);

  process.kill(process.pid, 'SIGINT');

  process.exit(0);
});
