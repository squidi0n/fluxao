import { z } from 'zod';
import { checkBudget, recordUsage } from './budget';
import { getAIProvider } from './provider';

import { logger } from '@/lib/logger';

export interface ModerationResult {
  status: 'ok' | 'review' | 'spam' | 'toxic';
  reason?: string;
  score: number; // Confidence score 0-1
  categories?: string[]; // Specific violation categories
}

export interface ModerationInput {
  content: string;
  authorName?: string;
  authorEmail?: string;
  context?: string; // Post title or other context
}

const ModerationSchema = z.object({
  status: z.enum(['ok', 'review', 'spam', 'toxic']).describe(
    'Moderation decision: ok (approve), review (needs human review), spam (reject as spam), toxic (reject as harmful)'
  ),
  reason: z.string().optional().describe('Brief explanation for the moderation decision'),
  score: z.number().min(0).max(1).describe('Confidence score for the decision (0-1)'),
  categories: z.array(z.enum([
    'spam',
    'hate-speech', 
    'harassment',
    'violence',
    'adult-content',
    'off-topic',
    'promotional',
    'low-quality',
  ])).optional().describe('Specific violation categories if applicable'),
});

function generateModerationPrompt(input: ModerationInput): string {
  let prompt = `Du bist ein KI-Moderator für Blog-Kommentare auf einer deutschsprachigen Tech-Website über KI und Machine Learning.

Bewerte den folgenden Kommentar und kategorisiere ihn:

Kommentar: "${input.content}"
`;

  if (input.authorName) {
    prompt += `Autor: ${input.authorName}\n`;
  }

  if (input.context) {
    prompt += `Kontext (Blog-Post): ${input.context}\n`;
  }

  prompt += `
Bewertungskriterien:
- "ok": Konstruktiver, relevanter Kommentar ohne Probleme
- "review": Grenzfall, der menschliche Überprüfung braucht
- "spam": Werbung, irrelevante Links, automatisierte Inhalte
- "toxic": Beleidigungen, Hassrede, Diskriminierung, Gewaltaufrufe

Besonders achten auf:
- Spam: Werbung, repetitive Texte, verdächtige Links, KeywordStuffing
- Toxizität: Beleidigungen, Diskriminierung, Hassrede, Bedrohungen
- Off-Topic: Komplett themenfremde Inhalte zu Tech/KI-Themen
- Low-Quality: Sehr kurze, sinnlose oder unleserliche Kommentare

Sprachen: Deutsch und Englisch akzeptiert

Gib eine strukturierte Bewertung zurück mit Status, Begründung, Vertrauenswert und ggf. spezifischen Kategorien.`;

  return prompt;
}

export async function moderateComment(input: ModerationInput): Promise<ModerationResult> {
  // Check budget (moderate token usage for moderation)
  const hasCapacity = await checkBudget(512);
  if (!hasCapacity) {
    logger.warn('Monthly AI token limit exceeded for comment moderation');
    // Fall back to pending status when budget exceeded
    return {
      status: 'review',
      reason: 'AI moderation unavailable - budget exceeded',
      score: 0.5,
    };
  }

  const provider = getAIProvider();
  const prompt = generateModerationPrompt(input);

  try {
    const result = await provider.generate({
      system: 'You are an AI content moderator for a German tech blog.',
      user: prompt,
      jsonSchema: ModerationSchema,
      maxTokens: 512,
    });

    // Record token usage
    await recordUsage(result.tokensUsed);

    const parsed = JSON.parse(result.content);
    const moderation: ModerationResult = {
      status: parsed.status || 'review',
      reason: parsed.reason,
      score: Math.min(Math.max(parsed.score || 0.5, 0), 1), // Clamp to 0-1
      categories: parsed.categories || [],
    };

    logger.info(
      {
        tokensUsed: result.tokensUsed,
        status: moderation.status,
        score: moderation.score,
        categories: moderation.categories,
      },
      'Comment moderated by AI',
    );

    return moderation;
  } catch (error) {
    logger.error({ error, content: input.content?.slice(0, 100) }, 'Failed to moderate comment');

    // Fall back to review status on error
    return {
      status: 'review',
      reason: 'AI moderation failed - requires manual review',
      score: 0.5,
    };
  }
}

// Quick spam detection using patterns (fallback)
export function detectSpamPatterns(content: string): { isSpam: boolean; reason?: string } {
  // Check for excessive links first
  const linkMatches = content.match(/https?:\/\/[^\s]+/gi);
  if (linkMatches && linkMatches.length > 2) {
    return { isSpam: true, reason: 'Excessive links detected' };
  }

  const spamPatterns = [
    // Excessive caps (at least 30 consecutive caps)
    /[A-Z\s]{30,}/,
    // Repetitive characters
    /(.)\1{10,}/,
    // Common spam phrases (German)
    /(klicken sie hier|jetzt kaufen|gratis|kostenlos|verdienen sie|schnell geld)/i,
    // Common spam phrases (English)
    /(click here|buy now|free money|earn fast|weight loss|make money)/i,
    // Excessive punctuation
    /[!]{5,}|[?]{5,}/,
    // Multiple email patterns (more than one email = suspicious)
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}.*){2,}/g,
  ];

  // Check spam patterns (but exclude URL patterns to allow single links)
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isSpam: true, reason: 'Spam pattern detected' };
    }
  }

  // Check for very short or very long comments
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < 2) {
    return { isSpam: true, reason: 'Comment too short' };
  }

  if (wordCount > 500) {
    return { isSpam: true, reason: 'Comment excessively long' };
  }

  return { isSpam: false };
}

// Combine AI and pattern-based detection
export async function comprehensiveModeration(input: ModerationInput): Promise<ModerationResult> {
  // First check for obvious spam patterns
  const spamCheck = detectSpamPatterns(input.content);
  if (spamCheck.isSpam) {
    return {
      status: 'spam',
      reason: spamCheck.reason,
      score: 0.9,
      categories: ['spam'],
    };
  }

  // If not obvious spam, use AI moderation
  return moderateComment(input);
}

// Get moderation statistics
export interface ModerationStats {
  total: number;
  ok: number;
  review: number;
  spam: number;
  toxic: number;
  pending: number;
  aiReviewedPercent: number;
}

// Helper to determine final comment status based on moderation
export function getCommentStatusFromModeration(
  moderationStatus: string,
  moderationScore: number,
): 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' {
  switch (moderationStatus) {
    case 'ok':
      return moderationScore > 0.7 ? 'APPROVED' : 'PENDING';
    case 'spam':
      return 'SPAM';
    case 'toxic':
      return 'REJECTED';
    case 'review':
    default:
      return 'PENDING';
  }
}
