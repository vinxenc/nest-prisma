import { env } from '@common/env';
import { CacheModule as RedisCacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';

export const CacheModule = RedisCacheModule.register<RedisClientOptions>({
  url: `rediss://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}/0`,
});
