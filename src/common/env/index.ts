import 'dotenv/config';
import { cleanEnv, str, num } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: num(),
  NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
  DATABASE_URL: str(),
  JWT_SECRET_KEY: str(),
});
