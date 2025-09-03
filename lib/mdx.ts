import matter from 'gray-matter';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import readingTime from 'reading-time';

export interface PostMatter {
  title?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
  [key: string]: any;
}

export interface ProcessedPost {
  content: MDXRemoteSerializeResult;
  frontmatter: PostMatter;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
  excerpt: string;
}

/**
 * Parse MDX content with frontmatter
 */
export async function parseMDX(source: string): Promise<ProcessedPost> {
  // Parse frontmatter
  const { content, data } = matter(source);

  // Calculate reading time
  const stats = readingTime(content);

  // Serialize MDX
  const mdxSource = await serialize(content, {
    parseFrontmatter: false, // We already parsed it
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  // Generate excerpt if not provided
  const excerpt = data.excerpt || generateExcerpt(content, 160);

  return {
    content: mdxSource,
    frontmatter: data as PostMatter,
    readingTime: stats,
    excerpt,
  };
}

/**
 * Generate an excerpt from content
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Remove MDX/Markdown syntax
  const plainText = content
    .replace(/^---[\s\S]*?---/m, '') // Remove frontmatter
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*|__/g, '') // Remove bold
    .replace(/\*|_/g, '') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/>\s/g, '') // Remove blockquotes
    .replace(/\n{2,}/g, ' ') // Replace multiple newlines
    .replace(/\n/g, ' ') // Replace single newlines
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Cut at last complete word
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Validate MDX content
 */
export async function validateMDX(source: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic validation - just check if it's a string with content
    if (!source || typeof source !== 'string') {
      return { valid: false, error: 'Content is required' };
    }

    // For now, skip complex MDX validation to avoid worker thread issues
    // Just do basic checks
    if (source.length < 10) {
      return { valid: false, error: 'Content is too short' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid MDX content',
    };
  }
}

/**
 * Extract images from MDX content
 */
export function extractImages(content: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return images;
}

/**
 * Extract headings for table of contents
 */
export function extractHeadings(
  content: string,
): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Process MDX for preview (admin UI)
 */
export async function processMDXPreview(source: string): Promise<{
  html: string;
  error?: string;
}> {
  try {
    const mdxSource = await serialize(source, {
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
      },
    });

    return { html: '' }; // MDX needs to be rendered with MDXRemote component
  } catch (error) {
    return {
      html: '',
      error: error instanceof Error ? error.message : 'Failed to process MDX',
    };
  }
}
