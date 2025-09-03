import { createHash } from 'crypto';

import { remark } from 'remark';
import strip from 'strip-markdown';

import { logger } from '@/lib/logger';

/**
 * Convert MDX content to plain text
 */
export async function mdxToPlainText(mdxContent: string): Promise<string> {
  try {
    // Remove MDX/JSX components
    const cleanedMdx = mdxContent
      .replace(/<[^>]+>/g, '') // Remove HTML/JSX tags
      .replace(/import\s+.*?from\s+['"].*?['"];?/g, '') // Remove imports
      .replace(/export\s+default\s+.*?;?/g, '') // Remove exports
      .replace(/\{[^}]*\}/g, ''); // Remove JSX expressions

    // Convert markdown to plain text
    const result = await remark().use(strip).process(cleanedMdx);

    return result
      .toString()
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();
  } catch (error) {
    logger.error({ error }, 'Failed to convert MDX to plain text');
    // Fallback: basic text extraction
    return mdxContent
      .replace(/<[^>]+>/g, '')
      .replace(/[#*_`~\[\]()]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

/**
 * Truncate text to approximate token count
 * Rough estimate: 1 token ≈ 4 characters
 */
export function truncateByTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) {
    return text;
  }

  // Try to truncate at sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?'),
  );

  if (lastSentenceEnd > maxChars * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // Fallback: truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Create content hash for idempotency
 */
export function hashContent(title: string, content: string): string {
  const combined = `${title}:${content}`;
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Extract text statistics
 */
export function getTextStats(text: string): {
  wordCount: number;
  charCount: number;
  estimatedTokens: number;
} {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  return {
    wordCount,
    charCount,
    estimatedTokens,
  };
}

/**
 * Clean text for AI processing
 */
export function cleanTextForAI(text: string): string {
  return (
    text
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove special characters that might confuse AI
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove excessive punctuation
      .replace(/([.!?]){2,}/g, '$1')
      .trim()
  );
}

/**
 * Prepare post content for AI processing
 */
export async function preparePostForAI(
  title: string,
  content: string,
  maxTokens: number = 2000,
): Promise<string> {
  // Convert MDX to plain text
  const plainText = await mdxToPlainText(content);

  // Clean the text
  const cleanedText = cleanTextForAI(plainText);

  // Truncate if needed
  const truncatedText = truncateByTokens(cleanedText, maxTokens);

  // Format for AI
  return `Titel: ${title}\n\nInhalt:\n${truncatedText}`;
}
