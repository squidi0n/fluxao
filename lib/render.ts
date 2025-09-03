import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { generateHTML } from '@tiptap/html';
import { JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// TipTap extensions configuration
const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  Link.configure({
    HTMLAttributes: {
      class: 'text-blue-600 hover:text-blue-800 underline',
      rel: 'noopener noreferrer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-lg w-full',
    },
  }),
  CodeBlock.configure({
    HTMLAttributes: {
      class: 'bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto',
    },
  }),
  Blockquote.configure({
    HTMLAttributes: {
      class: 'border-l-4 border-gray-300 pl-4 italic text-gray-700',
    },
  }),
];

export function renderTipTapToHtml(json: JSONContent): string {
  try {
    const html = generateHTML(json, extensions);
    return html;
  } catch (error) {
    // console.error('Error rendering TipTap JSON to HTML:', error);
    return '<p>Fehler beim Rendern des Inhalts.</p>';
  }
}

export function extractHeadings(json: JSONContent): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];

  function traverse(node: JSONContent) {
    if (node.type === 'heading' && node.attrs?.level) {
      const text = extractText(node);
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      headings.push({
        level: node.attrs.level,
        text,
        id,
      });
    }

    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  function extractText(node: JSONContent): string {
    if (node.type === 'text' && node.text) {
      return node.text;
    }

    if (node.content) {
      return node.content.map(extractText).join('');
    }

    return '';
  }

  traverse(json);
  return headings;
}

export function calculateReadTimeFromJson(json: JSONContent): number {
  function extractText(node: JSONContent): string {
    if (node.type === 'text' && node.text) {
      return node.text;
    }

    if (node.content) {
      return node.content.map(extractText).join(' ');
    }

    return '';
  }

  const text = extractText(json);
  const wordCount = text.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
