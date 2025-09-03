import { z } from 'zod';

// Enhanced environment schema with optional Sentry and security configs
const envSchema = z.object({
  // Core configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BASE_URL: z.string().url().default('http://localhost:3004'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Email service (optional for development)
  RESEND_API_KEY: z.string().optional(),

  // Optional: Sentry error tracking
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),

  // Optional: Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),

  // Security settings
  JWT_SECRET: z.string().min(32).default('your-secret-key-change-this-in-production'),
  NEXTAUTH_SECRET: z.string().min(32).default('your-nextauth-secret-change-this-in-production'),
  NEXTAUTH_URL: z.string().url().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .positive()
    .default(10 * 60 * 1000), // 10 minutes

  // CORS allowed origins (comma-separated)
  CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Optional: CDN configuration
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

class Config {
  private static instance: Config;
  private env: Env;

  private constructor() {
    try {
      // Parse environment variables with defaults
      this.env = envSchema.parse({
        DATABASE_URL: process.env.DATABASE_URL,
        BASE_URL: process.env.BASE_URL || 'http://localhost:3004',
        NODE_ENV: process.env.NODE_ENV || 'development',
        RESEND_API_KEY: process.env.RESEND_API_KEY,

        // Security
        JWT_SECRET: process.env.JWT_SECRET,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,

        // Optional configs
        SENTRY_DSN: process.env.SENTRY_DSN,
        SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        SENTRY_RELEASE: process.env.SENTRY_RELEASE,

        NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,

        // Security
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
        CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,

        // CDN
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues
          .map((issue) => {
            const path = issue.path.join('.');
            return `  - ${path}: ${issue.message}`;
          })
          .join('\n');

        // console.error('❌ Environment validation failed:');
        // console.error(errors);

        // More detailed error message for development
        if (process.env.NODE_ENV === 'development') {
          // console.error(
          //   '\n💡 Tip: Check your .env file and ensure all required variables are set.',
          // );
          // console.error('You can copy .env.sample to .env to get started.');
        }

        throw new Error(`Environment validation failed. Check the logs above for details.`);
      }
      throw error;
    }
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key];
  }

  public getAll(): Env {
    return this.env;
  }

  public isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  public isStaging(): boolean {
    return this.env.NODE_ENV === 'staging';
  }

  public hasSentry(): boolean {
    return Boolean(this.env.SENTRY_DSN);
  }

  public getCorsOrigins(): string[] {
    const defaultOrigins = [this.env.BASE_URL];

    // Add Vercel preview URLs in development/staging
    if (!this.isProduction()) {
      defaultOrigins.push('https://*.vercel.app', 'http://localhost:3000', 'http://localhost:3001');
    }

    // Add custom origins from environment
    if (this.env.CORS_ALLOWED_ORIGINS) {
      const customOrigins = this.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());
      defaultOrigins.push(...customOrigins);
    }

    return [...new Set(defaultOrigins)]; // Remove duplicates
  }

  public getRateLimitConfig() {
    return {
      maxRequests: this.env.RATE_LIMIT_MAX_REQUESTS,
      windowMs: this.env.RATE_LIMIT_WINDOW_MS,
    };
  }

  public getJwtSecret(): string {
    return this.env.JWT_SECRET;
  }
}

// Export singleton instance
export const config = Config.getInstance();
export type { Env };
