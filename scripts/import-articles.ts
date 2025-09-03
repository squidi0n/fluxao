#!/usr/bin/env tsx
/**
 * Import articles from FluxAO Writer export files
 * Usage: npm run import:articles [file-path]
 * Or watch mode: npm run import:watch
 */

import fs from 'fs/promises';
import path from 'path';

import { PrismaClient, PostStatus } from '@prisma/client';
import chokidar from 'chokidar';
import { z } from 'zod';

const prisma = new PrismaClient();

// Import schema matching export format
const ImportSchema = z.object({
  title: z.string(),
  slug: z.string(),
  teaser: z.string().optional(),
  content: z.string(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  provider: z.string().optional(),
  meta: z
    .object({
      tone: z.string().optional(),
      thinker: z.string().optional(),
      hook: z.string().optional(),
      length: z.number().optional(),
      time_horizon: z.number().optional(),
      style: z.string().optional(),
      audience: z.string().optional(),
    })
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'REVIEW']).default('DRAFT'),
  publishedAt: z.string().datetime().optional(),
  authorEmail: z.string().email().default('ai@fluxao.com'),
});

type ImportData = z.infer<typeof ImportSchema>;

async function importArticle(filePath: string): Promise<void> {
  try {
    // console.log(`📥 Importing: ${path.basename(filePath)}`);

    // Read and parse JSON file
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as ImportData;

    // Validate data
    const validated = ImportSchema.parse(data);

    // Find or create author
    let author = await prisma.user.findUnique({
      where: { email: validated.authorEmail },
    });

    if (!author) {
      // Create AI author if doesn't exist
      author = await prisma.user.create({
        data: {
          email: validated.authorEmail,
          name: 'AI Writer',
          role: 'AUTHOR',
        },
      });
    }

    // Check if post already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: validated.slug },
    });

    if (existingPost) {
      // console.log(`⚠️  Post already exists: ${validated.slug}`);

      // Optional: Update existing post
      if (process.argv.includes('--update')) {
        await prisma.post.update({
          where: { id: existingPost.id },
          data: {
            title: validated.title,
            teaser: validated.teaser,
            content: validated.content,
            excerpt: validated.excerpt || validated.teaser?.substring(0, 200),
            updatedAt: new Date(),
          },
        });
        // console.log(`✅ Updated: ${validated.title}`);
      }
      return;
    }

    // Process tags - find or create
    const tagRecords = [];
    if (validated.tags && validated.tags.length > 0) {
      for (const tagName of validated.tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            },
          });
        }

        tagRecords.push(tag);
      }
    }

    // Process category
    let categoryRecord = null;
    if (validated.category) {
      categoryRecord = await prisma.category.findUnique({
        where: { slug: validated.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      });

      if (!categoryRecord) {
        categoryRecord = await prisma.category.create({
          data: {
            name: validated.category,
            slug: validated.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
        });
      }
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        teaser: validated.teaser,
        content: validated.content,
        excerpt: validated.excerpt || validated.teaser?.substring(0, 200),
        status: validated.status as PostStatus,
        publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : null,
        authorId: author.id,
        meta: validated.meta || {},
        tags: {
          create: tagRecords.map((tag) => ({
            tag: {
              connect: { id: tag.id },
            },
          })),
        },
        categories: categoryRecord
          ? {
              create: [
                {
                  category: {
                    connect: { id: categoryRecord.id },
                  },
                },
              ],
            }
          : undefined,
      },
    });

    // console.log(`✅ Imported: ${post.title} (${post.slug})`);

    // Move processed file to archive
    const archiveDir = path.join(path.dirname(filePath), 'archived');
    await fs.mkdir(archiveDir, { recursive: true });

    const archivePath = path.join(
      archiveDir,
      `${new Date().toISOString().split('T')[0]}-${path.basename(filePath)}`,
    );
    await fs.rename(filePath, archivePath);
    // console.log(`📁 Archived to: ${path.basename(archivePath)}`);
  } catch (error) {
    // console.error(`❌ Error importing ${filePath}:`, error);

    // Move failed file to errors directory
    const errorDir = path.join(path.dirname(filePath), 'errors');
    await fs.mkdir(errorDir, { recursive: true });

    const errorPath = path.join(errorDir, path.basename(filePath));
    await fs.rename(filePath, errorPath);

    // Write error log
    const errorLog = {
      file: path.basename(filePath),
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    await fs.appendFile(path.join(errorDir, 'import-errors.log'), JSON.stringify(errorLog) + '\n');
  }
}

async function importDirectory(dirPath: string): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.startsWith('.'));

    // console.log(`Found ${jsonFiles.length} files to import`);

    for (const file of jsonFiles) {
      await importArticle(path.join(dirPath, file));
      // Small delay between imports
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    // console.error('Error reading directory:', error);
  }
}

async function watchDirectory(dirPath: string): Promise<void> {
  // console.log(`👁️  Watching for new articles in: ${dirPath}`);

  const watcher = chokidar.watch(path.join(dirPath, '*.json'), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher.on('add', async (filePath) => {
    // console.log(`🆕 New file detected: ${path.basename(filePath)}`);
    await importArticle(filePath);
  });

  watcher.on('error', (error) => {
    // console.error('Watcher error:', error);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    // console.log('\n👋 Stopping import watcher...');
    await watcher.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Default import directory
  const IMPORT_DIR =
    process.env.IMPORT_DIR || path.join(process.cwd(), '..', '..', 'writer', 'exports');

  try {
    if (args.includes('--watch')) {
      // Watch mode
      await watchDirectory(IMPORT_DIR);
    } else if (args[0] && !args[0].startsWith('--')) {
      // Import specific file
      await importArticle(args[0]);
    } else {
      // Import all files in directory
      await importDirectory(IMPORT_DIR);
    }
  } finally {
    if (!args.includes('--watch')) {
      await prisma.$disconnect();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    // console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importArticle, importDirectory, watchDirectory };
