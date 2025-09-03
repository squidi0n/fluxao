import { z } from 'zod';

/**
 * Schema for keywords response
 */
export const KeywordsSchema = z.object({
  keywords: z.array(z.string()).min(5).max(8),
});

/**
 * Schema for tags response
 */
export const TagsSchema = z.object({
  tags: z.array(z.string()).min(3).max(6),
});

/**
 * Generate summary prompt
 */
export function getSummaryPrompt(): string {
  return `Du bist ein professioneller Content-Editor für einen deutschsprachigen Tech-Blog.
Deine Aufgabe ist es, präzise und sachliche Zusammenfassungen von Blogartikeln zu erstellen.

Regeln:
- Die Zusammenfassung muss zwischen 80 und 120 Wörter lang sein
- Verwende einen neutralen, faktenorientierten Stil
- Keine Marketing-Sprache oder Übertreibungen
- Fokussiere dich auf die Hauptpunkte des Artikels
- Verwende deutsche Sprache
- Keine Halluzinationen - nur Informationen aus dem gegebenen Text verwenden`;
}

/**
 * Generate keywords prompt
 */
export function getKeywordsPrompt(): string {
  return `Du bist ein SEO-Experte für einen Tech-Blog.
Extrahiere 5-8 relevante Schlüsselwörter aus dem gegebenen Artikel.

Regeln:
- Verwende lowercase (kleinbuchstaben)
- Verwende kebab-case für zusammengesetzte Wörter (z.B. "web-development")
- Wähle spezifische, suchrelevante Begriffe
- Priorisiere technische Fachbegriffe und Hauptthemen
- Antworte im JSON-Format: {"keywords": ["keyword1", "keyword2", ...]}`;
}

/**
 * Generate tags prompt with existing tags
 */
export function getTagsPrompt(existingTags: string[]): string {
  const tagsList =
    existingTags.length > 0 ? `\n\nVorhandene Tags im System:\n${existingTags.join(', ')}` : '';

  return `Du bist ein Content-Kategorisierungs-Experte für einen Tech-Blog.
Schlage 3-6 passende Tags für den gegebenen Artikel vor.

Regeln:
- Bevorzuge vorhandene Tags aus der Liste, wenn sie passen
- Neue Tags nur vorschlagen, wenn keine passenden vorhanden sind
- Tags sollten kurz und prägnant sein (1-2 Wörter)
- Verwende lowercase
- Antworte im JSON-Format: {"tags": ["tag1", "tag2", ...]}${tagsList}`;
}

/**
 * Format content for AI processing
 */
export function formatContentForAI(title: string, content: string): string {
  return `Titel: ${title}

Inhalt:
${content}`;
}

/**
 * Validate summary length
 */
export function validateSummary(summary: string): boolean {
  const wordCount = summary.split(/\s+/).filter((w) => w.length > 0).length;
  return wordCount >= 80 && wordCount <= 120;
}

/**
 * Clean and normalize keywords
 */
export function normalizeKeywords(keywords: string[]): string[] {
  return keywords
    .map((k) =>
      k
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter((k) => k.length > 0);
}

/**
 * Clean and normalize tags
 */
export function normalizeTags(tags: string[]): string[] {
  return tags.map((t) => t.toLowerCase().trim().replace(/\s+/g, ' ')).filter((t) => t.length > 0);
}
