import pino from 'pino';

const logger = pino({
  name: 'reliability',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

/**
 * Circuit Breaker implementation for fault tolerance
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 10,
    private readonly timeout: number = 60000, // 1 minute
    private readonly name: string = 'default',
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info({ breaker: this.name }, 'Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info({ breaker: this.name }, 'Circuit breaker CLOSED');
    }
    this.failures = 0;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.error(
        { breaker: this.name, failures: this.failures },
        'Circuit breaker OPEN - threshold exceeded',
      );
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
    logger.info({ breaker: this.name }, 'Circuit breaker manually reset');
  }
}

/**
 * Idempotency key manager to prevent duplicate operations
 */
export class IdempotencyManager {
  private readonly keys = new Map<string, { timestamp: number; result?: any }>();
  private readonly ttl: number;

  constructor(ttlMinutes: number = 60) {
    this.ttl = ttlMinutes * 60 * 1000;
    // Clean up old keys periodically
    setInterval(() => this.cleanup(), this.ttl / 2);
  }

  generateKey(operation: string, ...params: any[]): string {
    return `${operation}:${JSON.stringify(params)}`;
  }

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { returnCached?: boolean },
  ): Promise<T> {
    const existing = this.keys.get(key);

    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < this.ttl) {
        logger.debug({ key }, 'Idempotent operation detected');
        if (options?.returnCached && existing.result !== undefined) {
          return existing.result;
        }
        throw new Error(`Duplicate operation detected: ${key}`);
      }
    }

    try {
      const result = await fn();
      this.keys.set(key, { timestamp: Date.now(), result });
      return result;
    } catch (error) {
      // Don't cache failures
      this.keys.delete(key);
      throw error;
    }
  }

  has(key: string): boolean {
    const existing = this.keys.get(key);
    if (!existing) return false;

    const age = Date.now() - existing.timestamp;
    if (age >= this.ttl) {
      this.keys.delete(key);
      return false;
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.keys.entries()) {
      if (now - value.timestamp >= this.ttl) {
        this.keys.delete(key);
      }
    }
    logger.debug({ size: this.keys.size }, 'Idempotency cache cleaned');
  }
}

/**
 * Backpressure manager to control concurrency
 */
export class BackpressureManager {
  private activeJobs = 0;
  private queue: Array<() => void> = [];

  constructor(
    private readonly maxConcurrency: number = 5,
    private readonly name: string = 'default',
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();

    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeJobs < this.maxConcurrency) {
        this.activeJobs++;
        resolve();
      } else {
        this.queue.push(resolve);
        logger.debug(
          { manager: this.name, queueSize: this.queue.length },
          'Job queued due to backpressure',
        );
      }
    });
  }

  private release() {
    this.activeJobs--;

    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.activeJobs++;
        next();
      }
    }
  }

  getStatus() {
    return {
      activeJobs: this.activeJobs,
      queuedJobs: this.queue.length,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

// Singleton instances
export const newsletterCircuitBreaker = new CircuitBreaker(10, 60000, 'newsletter');
export const idempotencyManager = new IdempotencyManager(60);
export const backpressureManager = new BackpressureManager(5, 'newsletter');
