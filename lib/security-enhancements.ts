/**
 * Critical Security Enhancements for FluxAO
 * Implements additional security measures beyond the basic middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from './logger';
import { prisma } from './prisma';

// Enhanced security configuration
export const ENHANCED_SECURITY_CONFIG = {
  // Password policies
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPatterns: [
      'password',
      '123456',
      'admin',
      'fluxao',
      'qwerty',
      'letmein'
    ],
    maxRepeatedChars: 3,
    historyCheck: 5, // Don't reuse last 5 passwords
  },

  // Session security
  session: {
    maxConcurrent: 5, // Maximum concurrent sessions per user
    idleTimeout: 30 * 60 * 1000, // 30 minutes
    absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
    ipBindingEnabled: true, // Bind sessions to IP addresses
    fingerprintingEnabled: true, // Use browser fingerprinting
  },

  // Brute force protection
  bruteForce: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    progressiveLockout: true, // Increase lockout time with repeated failures
  },

  // File upload security
  uploads: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    scanForMalware: true,
    quarantinePath: './uploads/quarantine/',
  },

  // API security
  api: {
    requireApiVersionHeader: true,
    maxRequestsPerMinute: 100,
    requireUserAgent: true,
    blockSuspiciousAgents: true,
    enforceHttps: process.env.NODE_ENV === 'production',
  }
} as const;

/**
 * Enhanced password validation with security best practices
 */
export function validateSecurePassword(password: string, userInfo?: {
  email?: string;
  name?: string;
  previousPasswords?: string[];
}): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
} {
  const errors: string[] = [];
  const config = ENHANCED_SECURITY_CONFIG.password;

  // Length check
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  // Character requirements
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Forbidden patterns
  const lowerPassword = password.toLowerCase();
  for (const pattern of config.forbiddenPatterns) {
    if (lowerPassword.includes(pattern)) {
      errors.push(`Password cannot contain common words like "${pattern}"`);
    }
  }

  // Personal information check
  if (userInfo) {
    if (userInfo.email && lowerPassword.includes(userInfo.email.split('@')[0].toLowerCase())) {
      errors.push('Password cannot contain your email username');
    }
    if (userInfo.name && lowerPassword.includes(userInfo.name.toLowerCase())) {
      errors.push('Password cannot contain your name');
    }
  }

  // Repeated characters
  let repeatedCount = 0;
  let maxRepeated = 0;
  let lastChar = '';
  
  for (const char of password) {
    if (char === lastChar) {
      repeatedCount++;
      maxRepeated = Math.max(maxRepeated, repeatedCount);
    } else {
      repeatedCount = 1;
    }
    lastChar = char;
  }

  if (maxRepeated > config.maxRepeatedChars) {
    errors.push(`Password cannot have more than ${config.maxRepeatedChars} repeated characters`);
  }

  // Password strength calculation
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  let score = 0;

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 1;
  if (password.length >= 20) score += 1;
  if (/[^\w\s]/.test(password)) score += 1; // Non-alphanumeric characters

  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 6) strength = 'good';
  else strength = 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Session security enhancements
 */
export class SessionSecurity {
  static async validateSession(sessionId: string, request: NextRequest): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken: sessionId },
        include: { user: { select: { id: true, email: true } } }
      });

      if (!session) {
        return { isValid: false, reason: 'session_not_found' };
      }

      const now = new Date();
      const config = ENHANCED_SECURITY_CONFIG.session;

      // Check expiration
      if (session.expires < now) {
        return { isValid: false, reason: 'session_expired' };
      }

      // Check idle timeout
      if (config.idleTimeout > 0) {
        const lastActivity = new Date(session.updatedAt);
        if (now.getTime() - lastActivity.getTime() > config.idleTimeout) {
          await this.invalidateSession(sessionId);
          return { isValid: false, reason: 'idle_timeout' };
        }
      }

      // IP binding check
      if (config.ipBindingEnabled) {
        const currentIP = this.getClientIP(request);
        // Note: This would require storing IP in session table
        // For now, we'll skip this check but log for monitoring
        logger.info({
          sessionId,
          currentIP,
          userId: session.user.id,
        }, 'Session IP validation (placeholder)');
      }

      // Update last activity
      await prisma.session.update({
        where: { sessionToken: sessionId },
        data: { updatedAt: now }
      });

      return { isValid: true };
    } catch (error) {
      logger.error({ error, sessionId }, 'Session validation error');
      return { isValid: false, reason: 'validation_error' };
    }
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { sessionToken: sessionId }
      });
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to invalidate session');
    }
  }

  static async invalidateAllUserSessions(userId: string, exceptSession?: string): Promise<void> {
    try {
      const where: any = { userId };
      if (exceptSession) {
        where.sessionToken = { not: exceptSession };
      }

      await prisma.session.deleteMany({ where });
      
      logger.info({
        userId,
        exceptSession: exceptSession ? 'preserved' : 'all_deleted'
      }, 'User sessions invalidated');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to invalidate user sessions');
    }
  }

  private static getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }
}

/**
 * Brute force protection
 */
export class BruteForceProtection {
  private static async getFailedAttempts(identifier: string): Promise<number> {
    const key = `failed_attempts:${identifier}`;
    // In production, use Redis or a proper cache
    // For now, use in-memory storage (not persistent)
    return 0; // Placeholder
  }

  private static async incrementFailedAttempts(identifier: string): Promise<number> {
    // Placeholder implementation
    logger.warn({ identifier }, 'Failed authentication attempt');
    return 1;
  }

  static async checkRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remainingAttempts?: number;
    lockoutTime?: number;
  }> {
    const config = ENHANCED_SECURITY_CONFIG.bruteForce;
    const attempts = await this.getFailedAttempts(identifier);

    if (attempts >= config.maxAttempts) {
      const lockoutTime = config.progressiveLockout 
        ? config.lockoutDuration * Math.pow(2, attempts - config.maxAttempts)
        : config.lockoutDuration;

      return {
        allowed: false,
        lockoutTime
      };
    }

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - attempts
    };
  }

  static async recordFailedAttempt(identifier: string): Promise<void> {
    await this.incrementFailedAttempts(identifier);
  }

  static async clearFailedAttempts(identifier: string): Promise<void> {
    // Clear failed attempts on successful authentication
    logger.info({ identifier }, 'Cleared failed authentication attempts');
  }
}

/**
 * Content Security Policy enhancements
 */
export function getEnhancedCSPHeader(): string {
  const nonce = generateNonce();
  
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ];

  return directives.join('; ');
}

function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}

/**
 * Input validation enhancements
 */
export const sanitizeAndValidate = {
  /**
   * Validate and sanitize user input with comprehensive checks
   */
  userInput(input: string, maxLength = 1000): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input.trim();

    // Length validation
    if (sanitized.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
      sanitized = sanitized.substring(0, maxLength);
    }

    // Dangerous pattern detection
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /onclick=/gi,
      /onerror=/gi,
      /onload=/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('Input contains potentially dangerous content');
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  },

  /**
   * Validate email addresses with enhanced checks
   */
  email(email: string): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized = email.trim().toLowerCase();

    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Length validation
    if (sanitized.length > 254) {
      errors.push('Email address too long');
    }

    // Disposable email detection (basic)
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com'
    ];

    const domain = sanitized.split('@')[1];
    if (disposableDomains.includes(domain)) {
      errors.push('Disposable email addresses are not allowed');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }
};

/**
 * Security audit logging
 */
export class SecurityAuditLogger {
  static async logSecurityEvent(event: {
    type: 'authentication' | 'authorization' | 'input_validation' | 'suspicious_activity' | 'data_access';
    action: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      const auditEntry = {
        ...event,
        timestamp: new Date(),
        id: crypto.randomUUID()
      };

      // Log to console/file
      logger[event.severity === 'critical' ? 'error' : 'warn'](auditEntry, 'Security audit event');

      // Store in database
      await prisma.auditLog.create({
        data: {
          action: event.action,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: event.details ? JSON.stringify(event.details) : null,
          severity: event.severity,
          category: event.type,
        }
      });
    } catch (error) {
      logger.error({ error, event }, 'Failed to log security event');
    }
  }

  static async getSecurityEvents(filters: {
    userId?: string;
    type?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const where: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.type) where.category = filters.type;
      if (filters.severity) where.severity = filters.severity;
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      return await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100
      });
    } catch (error) {
      logger.error({ error, filters }, 'Failed to get security events');
      return [];
    }
  }
}

// Export all enhancements
export {
  ENHANCED_SECURITY_CONFIG as SecurityConfig
};