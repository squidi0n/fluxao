import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'a',
      'blockquote',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
  };

  // Additional safety: ensure links open in new tab with security
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Escape HTML entities for display
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize author name
 */
export function sanitizeAuthorName(name: string): string {
  // Remove any HTML and limit length
  const sanitized = sanitizeText(name).trim();
  return sanitized.substring(0, 100);
}

/**
 * Prepare comment for display
 */
export function prepareCommentForDisplay(comment: {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
}): {
  body: string;
  authorName: string;
  authorEmail?: string | null;
} {
  return {
    body: sanitizeHtml(comment.body),
    authorName: comment.authorName ? sanitizeAuthorName(comment.authorName) : 'Anonymous',
    authorEmail: comment.authorEmail ? sanitizeEmail(comment.authorEmail) : null,
  };
}
