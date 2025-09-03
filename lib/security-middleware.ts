/**
 * Production Security Middleware
 * Comprehensive security hardening for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from './rate-limiter';
import { logger } from './logger';

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimiting: {
    enabled: process.env.NODE_ENV === 'production',
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // per window per IP
    skipSuccessfulRequests: false,
    message: 'Too many requests from this IP, please try again later',
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3010'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-ID',
      'X-API-Key'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Security headers
  headers: {
    contentSecurityPolicy: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://vercel.live'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'data:', 'https:', 'http:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https:', 'wss:'],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }
  },

  // Request validation
  validation: {
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
      'text/html',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  }
} as const;

/**
 * IP address extraction with proxy support
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded IP headers (common in production setups)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  const xClientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (xClientIP) return xClientIP;

  // Fallback to connection IP (may not be available in serverless)
  return 'unknown';
}

/**
 * Generate security headers
 */
function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent embedding in frames
    'X-Frame-Options': 'DENY',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Prevent DNS prefetching
    'X-DNS-Prefetch-Control': 'off',
    
    // Remove server information
    'Server': 'FluxAO',
    
    // Permissions policy
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()'
    ].join(', ')
  };

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    const hsts = SECURITY_CONFIG.headers.hsts;
    headers['Strict-Transport-Security'] = 
      `max-age=${hsts.maxAge}${hsts.includeSubDomains ? '; includeSubDomains' : ''}${hsts.preload ? '; preload' : ''}`;
  }

  // Content Security Policy
  if (SECURITY_CONFIG.headers.contentSecurityPolicy.enabled) {
    const csp = SECURITY_CONFIG.headers.contentSecurityPolicy.directives;
    const cspString = Object.entries(csp)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    headers['Content-Security-Policy'] = cspString;
  }

  return headers;
}

/**
 * CORS middleware
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const { cors } = SECURITY_CONFIG;

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    
    // Check origin
    if (origin && cors.origin.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (cors.origin.includes('*')) {
      headers.set('Access-Control-Allow-Origin', '*');
    }

    headers.set('Access-Control-Allow-Methods', cors.methods.join(', '));
    headers.set('Access-Control-Allow-Headers', cors.allowedHeaders.join(', '));
    headers.set('Access-Control-Max-Age', cors.maxAge.toString());

    if (cors.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new NextResponse(null, { status: 200, headers });
  }

  return null; // Continue processing
}

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  if (!SECURITY_CONFIG.rateLimiting.enabled) {
    return null; // Skip rate limiting
  }

  const ip = getClientIP(request);
  const { pathname } = request.nextUrl;

  try {
    // Different limits for different endpoints
    let limit = SECURITY_CONFIG.rateLimiting.maxRequests;
    let windowMs = SECURITY_CONFIG.rateLimiting.windowMs;

    // Stricter limits for sensitive endpoints
    if (pathname.startsWith('/api/auth')) {
      limit = 20; // More restrictive for auth
      windowMs = 15 * 60 * 1000; // 15 minutes
    } else if (pathname.startsWith('/api/admin')) {
      limit = 50; // Admin endpoints
      windowMs = 15 * 60 * 1000;
    } else if (pathname.startsWith('/api/newsletter/subscribe')) {
      limit = 10; // Newsletter signup
      windowMs = 60 * 60 * 1000; // 1 hour
    }

    const isAllowed = await rateLimit(ip, {
      windowMs,
      maxRequests: limit,
      skipSuccessfulRequests: SECURITY_CONFIG.rateLimiting.skipSuccessfulRequests
    });

    if (!isAllowed) {
      logger.warn({ ip, pathname }, 'Rate limit exceeded');

      return NextResponse.json(
        { 
          error: 'Too Many Requests', 
          message: SECURITY_CONFIG.rateLimiting.message,
          retryAfter: Math.ceil(windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-Rate-Limit-Limit': limit.toString(),
            'X-Rate-Limit-Remaining': '0',
            'X-Rate-Limit-Reset': (Date.now() + windowMs).toString()
          }
        }
      );
    }

    return null; // Continue processing
  } catch (error) {
    logger.error({ error, ip, pathname }, 'Rate limiting error');
    return null; // Continue processing on error
  }
}

/**
 * Request validation middleware
 */
export function validateRequestMiddleware(request: NextRequest): NextResponse | null {
  const { validation } = SECURITY_CONFIG;
  const contentType = request.headers.get('content-type') || '';
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);

  // Check request size
  if (contentLength > validation.maxRequestSize) {
    logger.warn({ contentLength, maxSize: validation.maxRequestSize }, 'Request too large');
    
    return NextResponse.json(
      { 
        error: 'Payload Too Large', 
        message: `Request size exceeds maximum allowed size of ${validation.maxRequestSize} bytes`
      },
      { status: 413 }
    );
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const mimeType = contentType.split(';')[0].trim();
    
    if (!validation.allowedMimeTypes.includes(mimeType)) {
      logger.warn({ contentType: mimeType }, 'Invalid content type');
      
      return NextResponse.json(
        { 
          error: 'Unsupported Media Type', 
          message: `Content type '${mimeType}' is not supported`
        },
        { status: 415 }
      );
    }
  }

  return null; // Continue processing
}

/**
 * Security logging middleware
 */
export function securityLoggingMiddleware(request: NextRequest): void {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const { pathname } = request.nextUrl;

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,           // Directory traversal
    /<script/i,         // XSS attempt
    /union.*select/i,   // SQL injection
    /eval\(/i,          // Code injection
    /javascript:/i,     // JavaScript protocol
    /vbscript:/i,       // VBScript protocol
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(pathname) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    logger.warn({
      ip,
      userAgent,
      pathname,
      method: request.method,
      type: 'suspicious_request'
    }, 'Suspicious request detected');
  }

  // Log admin access attempts
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
    logger.info({
      ip,
      userAgent,
      pathname,
      method: request.method,
      type: 'admin_access'
    }, 'Admin endpoint access');
  }
}

/**
 * Main security middleware
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Security logging
    securityLoggingMiddleware(request);

    // CORS handling
    const corsResponse = corsMiddleware(request);
    if (corsResponse) {
      return corsResponse;
    }

    // Request validation
    const validationResponse = validateRequestMiddleware(request);
    if (validationResponse) {
      return validationResponse;
    }

    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // If we reach here, continue with the request
    const response = NextResponse.next();

    // Add security headers
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add CORS headers to response
    const origin = request.headers.get('origin');
    if (origin && SECURITY_CONFIG.cors.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Expose-Headers', SECURITY_CONFIG.cors.exposedHeaders.join(', '));
      
      if (SECURITY_CONFIG.cors.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }

    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

    return response;

  } catch (error) {
    logger.error({ error, pathname: request.nextUrl.pathname }, 'Security middleware error');

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * API key validation middleware
 */
export async function validateApiKey(request: NextRequest): Promise<string | null> {
  const apiKey = request.headers.get('x-api-key') || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return null;
  }

  // In production, validate against database
  try {
    const { prisma } = await import('./prisma');
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { select: { id: true, role: true, isAdmin: true } } }
    });

    if (!keyRecord) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() }
    });

    return keyRecord.user.id;
  } catch (error) {
    logger.error({ error }, 'API key validation error');
    return null;
  }
}

/**
 * Admin authentication middleware
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    const { auth } = await import('../auth');
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check for elevated admin access
    const elevatedAdmins = process.env.ELEVATED_ADMIN_EMAILS?.split(',') || [];
    if (elevatedAdmins.includes(session.user.email || '')) {
      return null; // Allow access
    }

    // Check regular admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return null; // Allow access
  } catch (error) {
    logger.error({ error }, 'Admin authentication error');
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

/**
 * Input sanitization helpers
 */
export const sanitize = {
  /**
   * Sanitize HTML input
   */
  html(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Sanitize SQL input (basic)
   */
  sql(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  },

  /**
   * Sanitize filename
   */
  filename(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .substring(0, 255); // Max filename length
  },

  /**
   * Sanitize email
   */
  email(input: string): string {
    return input.toLowerCase().trim();
  }
};

// Export types for use in other files
export type SecurityConfig = typeof SECURITY_CONFIG;