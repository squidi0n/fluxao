/**
 * Generate a random nonce for CSP using Web Crypto API (Edge compatible)
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use Web Crypto API (available in Edge Runtime)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  } else {
    // Fallback - generate a less secure but deterministic nonce
    // This should not happen in production as crypto.getRandomValues is available
    return btoa(Date.now().toString() + Math.random().toString());
  }
}

/**
 * Generate CSP header with nonce
 */
export function generateCSPHeader(nonce: string, isDevelopment: boolean = false): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow Next.js dev scripts in development
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow inline styles in development for hot reload
      ...(isDevelopment ? ["'unsafe-inline'"] : []),
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      // Cloudinary CDN
      'https://res.cloudinary.com',
      // Vercel image optimization
      'https://*.vercel.app',
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      // API endpoints
      'https://api.resend.com',
      // Analytics
      'https://vitals.vercel-insights.com',
      'https://vercel.live',
      // Sentry error reporting (if enabled)
      'https://*.sentry.io',
      // Development
      ...(isDevelopment ? ['ws://localhost:*', 'wss://localhost:*'] : []),
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  // Convert directives to string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Store nonce in request context using WeakMap
 */
const nonceStore = new WeakMap<Request, string>();

export function setNonce(request: Request, nonce: string): void {
  nonceStore.set(request, nonce);
}

export function getNonce(request: Request): string | undefined {
  return nonceStore.get(request);
}
