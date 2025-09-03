import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createProblemResponse, ForbiddenError, InternalServerError, BadRequestError } from '@/lib/errors';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60) + '-' + nanoid(6);
}

function extractTeaser(content: string): string {
  // Extract first paragraph or first 200 chars
  const lines = content.split('\\n').filter(line => line.trim());
  
  for (const line of lines) {
    const cleanLine = line.replace(/^#+\\s*/, '').trim(); // Remove markdown headers
    if (cleanLine.length > 50 && !cleanLine.startsWith('**')) { // Skip bold headers
      return cleanLine.substring(0, 300);
    }
  }
  
  return content.replace(/#+\\s*/g, '').substring(0, 200);
}

function generateTags(title: string, content: string, category: string): string[] {
  const tags: string[] = [];
  const text = (title + ' ' + content).toLowerCase();
  
  // Tech keywords
  const techKeywords = ['ki', 'ai', 'künstliche intelligenz', 'machine learning', 
                       'deep learning', 'neural', 'algorithm', 'quantum', 'blockchain',
                       'metaverse', 'vr', 'ar', 'robotik', 'automatisierung'];
  
  for (const keyword of techKeywords) {
    if (text.includes(keyword)) {
      tags.push(keyword);
    }
  }
  
  // Category-specific tags
  const categoryMapping: Record<string, string[]> = {
    'KI & Tech': ['technologie', 'zukunft', 'innovation'],
    'Mensch & Gesellschaft': ['gesellschaft', 'sozial', 'kultur'],
    'Style & Ästhetik': ['design', 'lifestyle', 'kreativität'],
    'Gaming & Kultur': ['gaming', 'unterhaltung', 'digital'],
    'Mindset & Philosophie': ['philosophie', 'mindset', 'denken'],
    'Wirtschaft & Innovation': ['wirtschaft', 'business', 'startup']
  };
  
  const categoryTags = categoryMapping[category] || [];
  tags.push(...categoryTags);
  
  // Add current year
  const currentYear = new Date().getFullYear().toString();
  tags.push(currentYear);
  
  return [...new Set(tags)].slice(0, 8); // Unique tags, max 8
}

function mapCategoryToFluxAO(category: string): string {
  const mapping: Record<string, string> = {
    'KI & Tech': 'technologie',
    'Mensch & Gesellschaft': 'gesellschaft', 
    'Style & Ästhetik': 'lifestyle',
    'Gaming & Kultur': 'gaming',
    'Mindset & Philosophie': 'philosophie',
    'Wirtschaft & Innovation': 'wirtschaft'
  };
  
  return mapping[category] || 'technologie';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user?.id || !can(session.user, 'create', 'posts')) {
      return createProblemResponse(new ForbiddenError('Insufficient permissions to export content'));
    }

    const body = await request.json();
    const {
      title,
      content,
      teaser,
      provider,
      category = 'KI & Tech',
      tags = []
    } = body;

    // Validation
    if (!title || !content) {
      return createProblemResponse(new BadRequestError('Title and content are required'));
    }

    // Generate missing data
    const slug = generateSlug(title);
    const extractedTeaser = teaser || extractTeaser(content);
    const autoTags = generateTags(title, content, category);
    const allTags = [...new Set([...tags, ...autoTags])];
    const fluxCategory = mapCategoryToFluxAO(category);
    
    try {
      // Find or create category
      let categoryRecord = await prisma.category.findUnique({
        where: { slug: fluxCategory }
      });
      
      if (!categoryRecord) {
        categoryRecord = await prisma.category.create({
          data: {
            name: fluxCategory.charAt(0).toUpperCase() + fluxCategory.slice(1),
            slug: fluxCategory
          }
        });
      }

      // Create or find tags
      const tagRecords = [];
      for (const tagName of allTags) {
        const tagSlug = tagName.toLowerCase().replace(/\\s+/g, '-');
        let tag = await prisma.tag.findUnique({
          where: { slug: tagSlug }
        });
        
        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagSlug
            }
          });
        }
        tagRecords.push(tag);
      }

      // Create the post
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          teaser: extractedTeaser,
          content,
          excerpt: extractedTeaser.substring(0, 160),
          status: 'DRAFT', // Always create as draft for review
          authorId: session.user.id,
          contentType: 'DEEP_DIVE',
          difficultyLevel: 'INTERMEDIATE',
          estimatedReadTime: Math.ceil(content.split(/\\s+/).length / 200), // Assume 200 words per minute
          categories: {
            create: [{
              category: {
                connect: { id: categoryRecord.id }
              }
            }]
          },
          tags: {
            create: tagRecords.map(tag => ({
              tag: {
                connect: { id: tag.id }
              }
            }))
          }
        },
        include: {
          categories: {
            include: { category: true }
          },
          tags: {
            include: { tag: true }
          }
        }
      });

      // Log the creation
      await prisma.aITaskLog.create({
        data: {
          userId: session.user.id,
          provider: provider || 'writer-system',
          model: 'export',
          task: 'content-export',
          success: true,
          tokensUsed: 0,
          responseTime: 0,
          metadata: {
            postId: post.id,
            category: fluxCategory,
            tagsCount: tagRecords.length,
            wordCount: content.split(/\\s+/).length
          }
        }
      });

      return NextResponse.json({
        success: true,
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          categories: post.categories.map(pc => pc.category.name),
          tags: post.tags.map(pt => pt.tag.name),
          url: `/admin/posts/${post.id}/edit`
        },
        message: `Article "${title}" successfully created as draft`,
        adminUrl: `/admin/posts/${post.id}/edit`
      });

    } catch (dbError: any) {
      console.error('Database Error during export:', dbError);
      return createProblemResponse(new InternalServerError(`Failed to create post: ${dbError.message}`));
    }

  } catch (error) {
    console.error('Writer Export API Error:', error);
    return createProblemResponse(new InternalServerError('Failed to export content'));
  }
}