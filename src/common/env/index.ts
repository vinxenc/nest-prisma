import 'dotenv/config';
import { cleanEnv, str, num } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: num(),
  NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
  DATABASE_URL: str(),
  JWT_SECRET_KEY: str(),
  REDIS_HOST: str(),
  REDIS_PORT: num(),
  REDIS_USERNAME: str(),
  REDIS_PASSWORD: str(),
  STOCK_PRICE_CRAWL_REPEAT_PATTERN: str(),
});
