import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    // console.warn('Redis not configured - some features will be disabled');
    return null;
  }

  if (!redisClient) {
    try {
      if (process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        });
      } else if (process.env.REDIS_HOST) {
        redisClient = new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        });
      }

      if (redisClient) {
        redisClient.on('error', (err) => {
          // console.error('Redis connection error:', err);
        });

        redisClient.on('connect', () => {
          // console.log('Redis connected successfully');
        });
      }
    } catch (error) {
      // console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
