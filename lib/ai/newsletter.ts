import { checkBudget, recordUsage } from './budget';
import { AIProviderFactory } from './provider';

import type { NewsletterSource } from '@prisma/client';

import { logger } from '@/lib/logger';

export interface NewsletterTopic {
  title: string;
  summary: string;
  url?: string;
}

export interface NewsletterDraftContent {
  subject: string;
  intro: string;
  topics: NewsletterTopic[];
  cta?: string;
}

const NEWSLETTER_SCHEMA = {
  type: 'object',
  properties: {
    subject: {
      type: 'string',
      description: 'Catchy newsletter subject line in German',
    },
    intro: {
      type: 'string',
      description: 'Newsletter introduction in German, max 100 words',
    },
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string', description: 'Summary in German, max 50 words' },
          url: { type: 'string' },
        },
        required: ['title', 'summary'],
      },
      minItems: 3,
      maxItems: 5,
    },
    cta: {
      type: 'string',
      description: 'Call to action text in German',
    },
  },
  required: ['subject', 'intro', 'topics'],
} as const;

export function generateNewsletterPrompt(sources: NewsletterSource[]): string {
  const sourcesText = sources
    .map((source) => {
      let text = `Titel: ${source.title}\n`;
      if (source.content) {
        text += `Inhalt: ${source.content.slice(0, 500)}...\n`;
      }
      if (source.url) {
        text += `URL: ${source.url}\n`;
      }
      if (source.metadata && typeof source.metadata === 'object') {
        const meta = source.metadata as any;
        if (meta.publishedAt) {
          text += `Veröffentlicht: ${meta.publishedAt}\n`;
        }
      }
      return text;
    })
    .join('\n---\n');

  return `Du bist ein Newsletter-Redakteur für einen deutschsprachigen KI-Newsletter, der 3x wöchentlich erscheint.

Erstelle aus den folgenden Quellen einen Newsletter-Entwurf:

${sourcesText}

Richtlinien:
- Sprache: Deutsch, sachlich-informativ aber inspirierend
- Zielgruppe: Tech-Professionals und KI-Interessierte
- Intro: Kurze Begrüßung und Überblick (max. 100 Wörter)
- Topics: 3-5 wichtigste News mit prägnanter Zusammenfassung (je max. 50 Wörter)
- Fokus auf: Relevanz, Neuigkeitswert, praktische Anwendbarkeit
- Vermeide: Spekulationen, Übertreibungen, nicht belegte Aussagen
- CTA: Motivierender Abschluss mit Handlungsaufforderung

Erstelle einen strukturierten Newsletter-Entwurf mit ansprechendem Betreff.`;
}

export async function generateNewsletterDraft(
  sources: NewsletterSource[],
): Promise<NewsletterDraftContent> {
  // Check budget
  const hasCapacity = await checkBudget(2000);
  if (!hasCapacity) {
    throw new Error('Monthly AI token limit exceeded for newsletter generation');
  }

  const provider = AIProviderFactory.getProvider();
  const prompt = generateNewsletterPrompt(sources);

  try {
    const result = await provider.generate({
      prompt,
      schema: NEWSLETTER_SCHEMA,
      maxTokens: 2000,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate newsletter draft');
    }

    // Record token usage
    await recordUsage(result.tokensUsed);

    logger.info(
      {
        tokensUsed: result.tokensUsed,
        topicsCount: result.data.topics?.length,
      },
      'Newsletter draft generated',
    );

    // Validate and clean the result
    const draft: NewsletterDraftContent = {
      subject: result.data.subject || 'KI-Newsletter',
      intro: result.data.intro || '',
      topics: Array.isArray(result.data.topics)
        ? result.data.topics.map((topic) => ({
            title: topic.title || '',
            summary: topic.summary || '',
            url: topic.url,
          }))
        : [],
      cta: result.data.cta,
    };

    // Ensure we have at least 3 topics
    if (draft.topics.length < 3) {
      throw new Error(`Not enough topics generated: ${draft.topics.length}`);
    }

    return draft;
  } catch (error) {
    logger.error({ error }, 'Failed to generate newsletter draft');
    throw error;
  }
}

// Helper to format newsletter draft for email
export function formatNewsletterHtml(draft: NewsletterDraftContent): string {
  const topicsHtml = draft.topics
    .map(
      (topic) => `
    <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
      <h3 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 18px;">
        ${topic.title}
      </h3>
      <p style="margin: 0 0 8px 0; color: #4a4a4a; line-height: 1.6;">
        ${topic.summary}
      </p>
      ${
        topic.url
          ? `
        <a href="${topic.url}" style="color: #0066cc; text-decoration: none; font-size: 14px;">
          Mehr erfahren →
        </a>
      `
          : ''
      }
    </div>
  `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${draft.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px;">
    <h1 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
      ${draft.subject}
    </h1>
    
    <div style="margin-bottom: 32px; color: #4a4a4a; line-height: 1.6;">
      ${draft.intro.replace(/\n/g, '<br>')}
    </div>
    
    <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">
      Die wichtigsten Themen dieser Ausgabe
    </h2>
    
    ${topicsHtml}
    
    ${
      draft.cta
        ? `
      <div style="margin-top: 32px; padding: 20px; background: #0066cc; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: white; font-size: 16px;">
          ${draft.cta}
        </p>
      </div>
    `
        : ''
    }
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center; color: #888; font-size: 14px;">
      <p>© ${new Date().getFullYear()} FluxAO. Alle Rechte vorbehalten.</p>
      <p>
        <a href="%unsubscribe_url%" style="color: #888;">Newsletter abbestellen</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper to format newsletter draft for plain text
export function formatNewsletterText(draft: NewsletterDraftContent): string {
  const topicsText = draft.topics
    .map(
      (topic, index) => `
${index + 1}. ${topic.title}
${topic.summary}
${topic.url ? `→ ${topic.url}` : ''}
`,
    )
    .join('\n');

  return `
${draft.subject}
${'='.repeat(draft.subject.length)}

${draft.intro}

Die wichtigsten Themen dieser Ausgabe:
${topicsText}

${draft.cta || ''}

---
© ${new Date().getFullYear()} FluxAO. Alle Rechte vorbehalten.
Newsletter abbestellen: %unsubscribe_url%
  `.trim();
}
