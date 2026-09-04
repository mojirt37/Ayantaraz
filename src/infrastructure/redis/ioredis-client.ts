import { Redis } from "ioredis";

export type RateLimitResult = "ALLOWED" | "RATE_LIMITED";

export class RedisRateLimiter {
  public constructor(
    private readonly redis: Redis,
    private readonly windowSeconds: number = 60,
    private readonly maxRequests: number = 5
  ) {}

  public async acquire(identifier: string): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }
    return current > this.maxRequests ? "RATE_LIMITED" : "ALLOWED";
  }

  public async reset(identifier: string): Promise<void> {
    await this.redis.del(`ratelimit:${identifier}`);
  }
}

export function createRedisClient(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 5000,
    commandTimeout: 3000,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
}
