import { Injectable } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class CacheService {
    private redisClient: RedisClient;

    async onModuleInit() {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      });
  
      this.redisClient.on('connect', () => {
        console.log('✅ Redis 연결 성공');
      });
  
      this.redisClient.on('error', (err) => {
        console.error('❌ Redis 연결 실패:', err);
      });
  
      const pong = await this.redisClient.ping();
      console.log('📦 Redis 연결 상태:', pong);
    }
  
    async get(key: string): Promise<string | null> {
      return this.redisClient.get(key);
    }
  
    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
      if (ttlSeconds) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    }
  
    async del(key: string): Promise<void> {
      await this.redisClient.del(key);
    }
}
