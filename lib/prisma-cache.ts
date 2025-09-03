import { getCache, setCache, clearCache } from './cache';

export async function cachedQuery<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
  const cached = getCache(key);
  if (cached) {
    return cached as T;
  }

  const result = await queryFn();
  setCache(key, result);

  return result;
}

export class PrismaCache {
  static async get(key: string) {
    return getCache(key);
  }

  static async set(key: string, value: any) {
    return setCache(key, value);
  }

  static async invalidate(key: string) {
    // Just clear all for now
    clearCache();
  }

  static async invalidateAll() {
    clearCache();
  }
}
