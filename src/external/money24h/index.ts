import puppeteer, { Browser } from 'puppeteer';
import { ObserveLogger } from '../../plugins';

export class Money24hService {
  private contextName: string;

  private code: string;

  private domain: string = 'https://24hmoney.vn';

  private stockPage: string = 'stock';

  private priceSelector: string = '.price-detail .price';

  private logger: ObserveLogger;

  public constructor(code: string) {
    this.code = code;
    this.contextName = Money24hService.name;
    this.logger = new ObserveLogger();
  }

  public async getPrice(): Promise<number> {
    let browser: Browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();

      const path = `${this.domain}/${this.stockPage}/${this.code}`;

      await page.goto(path, {
        waitUntil: ['domcontentloaded', 'networkidle2'],
      });
      await page.waitForSelector(this.priceSelector);

      const priceStr = await page.$eval(this.priceSelector, (el) => el.textContent);

      this.logger.log(`${this.code} price: ${priceStr}`, this.contextName);

      return Number(priceStr);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(err.message, err.stack, Money24hService.name);
    } finally {
      await browser.close();
    }
  }
}
