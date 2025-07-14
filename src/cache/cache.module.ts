import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CacheService } from './cache.service';
import { RedisCache, redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync<RedisCache>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const store = await redisStore({
          host: config.get('REDIS_HOST', 'redis'),
          port: config.get('REDIS_PORT', 6379),
        });

        return {
          store,
          ttl: 60 * 1000,
        };
      },
    }),
    ConfigModule,
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CacheConfigModule {}
