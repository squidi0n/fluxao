import { logger } from './logger';

interface SpamCheckResult {
  isSpam: boolean;
  score: number;
  reason?: string;
}

interface HCaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
  'error-codes'?: string[];
}

/**
 * Verify hCaptcha token
 */
export async function verifyHCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;

  if (!secret) {
    logger.warn('hCaptcha secret key not configured');
    return true; // Allow in development if not configured
  }

  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    const data: HCaptchaVerifyResponse = await response.json();

    if (!data.success) {
      logger.warn({ errorCodes: data['error-codes'] }, 'hCaptcha verification failed');
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, 'hCaptcha verification error');
    return false;
  }
}

/**
 * Simple spam detection based on content patterns
 */
export function detectSpamPatterns(content: string): SpamCheckResult {
  const lowerContent = content.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  // Check for common spam patterns
  const spamPatterns = [
    { regex: /\b(viagra|cialis|levitra|pharmacy)\b/gi, weight: 30, reason: 'Pharmaceutical spam' },
    { regex: /\b(casino|poker|blackjack|slots)\b/gi, weight: 25, reason: 'Gambling spam' },
    { regex: /\b(loan|mortgage|credit|debt)\b/gi, weight: 20, reason: 'Financial spam' },
    { regex: /\b(weight.?loss|diet.?pills|lose.?weight)\b/gi, weight: 25, reason: 'Diet spam' },
    { regex: /(http|https|www\.).{0,50}(http|https|www\.)/gi, weight: 15, reason: 'Multiple URLs' },
    { regex: /[A-Z]{5,}/g, weight: 10, reason: 'Excessive capitals' },
    { regex: /(!{3,}|\?{3,})/g, weight: 10, reason: 'Excessive punctuation' },
  ];

  for (const pattern of spamPatterns) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      score += pattern.weight * matches.length;
      reasons.push(pattern.reason);
    }
  }

  // Check for suspicious link density
  const wordCount = content.split(/\s+/).length;
  const linkCount = (content.match(/https?:\/\//gi) || []).length;
  if (wordCount > 0 && linkCount > 0) {
    const linkDensity = linkCount / wordCount;
    if (linkDensity > 0.2) {
      score += 20;
      reasons.push('High link density');
    }
  }

  // Check for repetitive content
  const words = content.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 10 && uniqueWords.size < words.length * 0.5) {
    score += 15;
    reasons.push('Repetitive content');
  }

  return {
    isSpam: score >= 50,
    score: Math.min(score, 100),
    reason: reasons.join(', '),
  };
}

/**
 * Check if email is from a known spam domain
 */
export function isSpamEmail(email: string): boolean {
  const spamDomains = [
    'mailinator.com',
    'guerrillamail.com',
    'maildrop.cc',
    'throwaway.email',
    'tempmail.com',
    '10minutemail.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? spamDomains.includes(domain) : false;
}

/**
 * Check comment for spam using multiple methods
 */
export async function checkCommentSpam(comment: {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<SpamCheckResult> {
  let totalScore = 0;
  const reasons: string[] = [];

  // Check content patterns
  const contentCheck = detectSpamPatterns(comment.body);
  totalScore += contentCheck.score * 0.6; // 60% weight
  if (contentCheck.reason) {
    reasons.push(contentCheck.reason);
  }

  // Check author name for spam
  if (comment.authorName) {
    const nameCheck = detectSpamPatterns(comment.authorName);
    totalScore += nameCheck.score * 0.2; // 20% weight
    if (nameCheck.reason) {
      reasons.push(`Name: ${nameCheck.reason}`);
    }
  }

  // Check for spam email
  if (comment.authorEmail && isSpamEmail(comment.authorEmail)) {
    totalScore += 20;
    reasons.push('Disposable email');
  }

  // Check for missing user agent (bots often don't send proper headers)
  if (!comment.userAgent || comment.userAgent.length < 10) {
    totalScore += 10;
    reasons.push('Suspicious user agent');
  }

  // Check for common bot user agents
  const botUserAgents = ['bot', 'crawler', 'spider', 'scraper'];
  if (
    comment.userAgent &&
    botUserAgents.some((bot) => comment.userAgent!.toLowerCase().includes(bot))
  ) {
    totalScore += 15;
    reasons.push('Bot user agent');
  }

  // Honeypot check would go here if implemented

  const finalScore = Math.min(totalScore, 100);

  return {
    isSpam: finalScore >= 50,
    score: finalScore,
    reason: reasons.length > 0 ? reasons.join(', ') : undefined,
  };
}

/**
 * Rate limiting check for comments
 */
export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60000,
): Promise<boolean> {
  // This is a simplified in-memory rate limiter
  // In production, use Redis or a database
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  // Simple implementation - would need Redis in production
  // For now, just return true (allowed)
  return true;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return '0.0.0.0';
}
