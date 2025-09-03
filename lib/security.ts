import { headers } from 'next/headers';

import { prisma } from './prisma';

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | 'user_created'
  | 'user_deleted'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'admin_action';

export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

interface LogSecurityEventParams {
  type: SecurityEventType;
  severity?: SecuritySeverity;
  userId?: string;
  email?: string;
  message: string;
  metadata?: any;
}

export async function logSecurityEvent({
  type,
  severity = 'info',
  userId,
  email,
  message,
  metadata,
}: LogSecurityEventParams) {
  try {
    // Get IP and User Agent from headers
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.securityEvent.create({
      data: {
        type,
        severity,
        userId,
        email,
        ipAddress,
        userAgent,
        message,
        metadata,
      },
    });
  } catch (error) {
    // console.error('Failed to log security event:', error);
  }
}

export async function getSecurityEvents(limit = 100) {
  return prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getSecurityStats() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalEvents,
    criticalEvents,
    warningEvents,
    failedLogins24h,
    successfulLogins24h,
    totalUsers,
    activeUsers24h,
  ] = await Promise.all([
    prisma.securityEvent.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
    prisma.securityEvent.count({
      where: {
        severity: 'critical',
        createdAt: { gte: oneWeekAgo },
      },
    }),
    prisma.securityEvent.count({
      where: {
        severity: 'warning',
        createdAt: { gte: oneWeekAgo },
      },
    }),
    prisma.securityEvent.count({
      where: {
        type: 'login_failed',
        createdAt: { gte: oneDayAgo },
      },
    }),
    prisma.securityEvent.count({
      where: {
        type: 'login_success',
        createdAt: { gte: oneDayAgo },
      },
    }),
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: { gte: oneDayAgo },
      },
    }),
  ]);

  return {
    totalEvents,
    criticalEvents,
    warningEvents,
    failedLogins24h,
    successfulLogins24h,
    totalUsers,
    activeUsers24h,
    systemStatus: criticalEvents === 0 ? 'healthy' : 'warning',
  };
}

// API Key Management
export async function generateApiKey(userId: string, name: string) {
  const key = `sk_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key,
      userId,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  await logSecurityEvent({
    type: 'api_key_created',
    userId,
    message: `API key "${name}" created`,
    metadata: { keyId: apiKey.id },
  });

  return apiKey;
}

export async function revokeApiKey(keyId: string, userId: string) {
  const apiKey = await prisma.apiKey.delete({
    where: { id: keyId },
  });

  await logSecurityEvent({
    type: 'api_key_revoked',
    userId,
    message: `API key "${apiKey.name}" revoked`,
    metadata: { keyId },
  });

  return apiKey;
}

export async function validateApiKey(key: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: true },
  });

  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() },
  });

  return apiKey;
}

// Rate limiting detection
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000,
): Promise<boolean> {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    // Rate limit exceeded - log security event
    await logSecurityEvent({
      type: 'rate_limit_exceeded',
      severity: 'warning',
      message: `Rate limit exceeded for ${identifier}`,
      metadata: { identifier, limit, windowMs },
    });
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

// Clean up old rate limit records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}
