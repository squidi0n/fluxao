import { NextRequest, NextResponse } from 'next/server';

import { config } from './config';

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = config.getCorsOrigins();

  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns (e.g., https://*.vercel.app)
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Add CORS headers to response
 */
export function setCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Always set these headers for preflight requests
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Correlation-ID, X-Requested-With',
  );
  response.headers.set(
    'Access-Control-Max-Age',
    '86400', // 24 hours
  );

  return response;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, request);
  }
  return null;
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight
    const preflightResponse = handleCorsPreflightRequest(req);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Process request
    const response = await handler(req);

    // Add CORS headers
    return setCorsHeaders(response, req);
  };
}
