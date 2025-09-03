import { nanoid } from 'nanoid';

/**
 * Convert a string to a URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate a unique slug by appending a random suffix if needed
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = slugify(text);
  if (!baseSlug) {
    return nanoid(10).toLowerCase();
  }
  return baseSlug;
}

/**
 * Check if a slug already exists and generate a unique one
 */
export async function ensureUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 10,
): Promise<string> {
  let slug = slugify(text);

  // If empty slug, generate random one
  if (!slug) {
    slug = nanoid(10).toLowerCase();
  }

  // Check if slug exists
  let exists = await checkExists(slug);
  let attempts = 0;

  while (exists && attempts < maxAttempts) {
    // Append random suffix
    const suffix = nanoid(4).toLowerCase();
    slug = `${slugify(text)}-${suffix}`;
    exists = await checkExists(slug);
    attempts++;
  }

  if (exists) {
    // Final fallback: completely random slug
    return nanoid(10).toLowerCase();
  }

  return slug;
}

/**
 * Extract slug from URL path
 */
export function extractSlugFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens only
  // Cannot start or end with hyphen
  // Cannot have consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
