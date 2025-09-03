import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'd. MMMM yyyy', { locale: de });
}

export function formatDateShort(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'd. MMM', { locale: de });
}

export function formatRelativeDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: de });
}

export function calculateReadTime(text: string): number {
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readTime); // Minimum 1 minute
}

export function formatReadTime(minutes: number): string {
  if (minutes === 1) return '1 Minute';
  return `${minutes} Minuten`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[äöüß]/g, (char) => {
      const replacements: Record<string, string> = {
        ä: 'ae',
        ö: 'oe',
        ü: 'ue',
        ß: 'ss',
      };
      return replacements[char] || char;
    })
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
