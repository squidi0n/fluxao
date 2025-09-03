import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const FilterSchema = z.object({
  categories: z.array(z.string()).optional(),
  subcategories: z.array(z.string()).optional(),
  contentTypes: z.array(z.enum(['TUTORIAL', 'NEWS', 'OPINION', 'INTERVIEW', 'REVIEW', 'DEEP_DIVE'])).optional(),
  difficultyLevels: z.array(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])).optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).optional(),
  estimatedReadTime: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  sortBy: z.enum(['publishedAt', 'viewCount', 'fluxCount', 'createdAt']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters = FilterSchema.parse(body);

    // Build where clause dynamically
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: {
        not: null
      }
    };

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      where.categories = {
        some: {
          category: {
            slug: {
              in: filters.categories
            }
          }
        }
      };
    }

    // Subcategories filter
    if (filters.subcategories && filters.subcategories.length > 0) {
      where.subcategory = {
        in: filters.subcategories
      };
    }

    // Content types filter
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      where.contentType = {
        in: filters.contentTypes
      };
    }

    // Difficulty levels filter
    if (filters.difficultyLevels && filters.difficultyLevels.length > 0) {
      where.difficultyLevel = {
        in: filters.difficultyLevels
      };
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            slug: {
              in: filters.tags
            }
          }
        }
      };
    }

    // Search query filter - SQLite doesn't support case-insensitive search
    if (filters.searchQuery) {
      const searchTerms = filters.searchQuery.split(' ').filter(term => term.length > 0);
      if (searchTerms.length > 0) {
        const lowerQuery = filters.searchQuery.toLowerCase();
        where.OR = [
          {
            title: {
              contains: lowerQuery
            }
          },
          {
            excerpt: {
              contains: lowerQuery
            }
          },
          {
            content: {
              contains: lowerQuery
            }
          }
        ];
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const dateWhere: any = {};
      if (filters.dateRange.from) {
        dateWhere.gte = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        dateWhere.lte = new Date(filters.dateRange.to);
      }
      if (Object.keys(dateWhere).length > 0) {
        where.publishedAt = dateWhere;
      }
    }

    // Estimated read time filter
    if (filters.estimatedReadTime) {
      const readTimeWhere: any = {};
      if (filters.estimatedReadTime.min !== undefined) {
        readTimeWhere.gte = filters.estimatedReadTime.min;
      }
      if (filters.estimatedReadTime.max !== undefined) {
        readTimeWhere.lte = filters.estimatedReadTime.max;
      }
      if (Object.keys(readTimeWhere).length > 0) {
        where.estimatedReadTime = readTimeWhere;
      }
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;

    // Build order by clause
    const orderBy: any = {};
    orderBy[filters.sortBy] = filters.sortOrder;

    // Execute query with include for related data
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          _count: {
            select: {
              comments: true,
              articleVotes: true
            }
          }
        },
        orderBy,
        skip,
        take: filters.limit
      }),
      prisma.post.count({ where })
    ]);

    // Transform posts to include computed fields
    const transformedPosts = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      summary: post.summary,
      contentType: post.contentType,
      difficultyLevel: post.difficultyLevel,
      subcategory: post.subcategory,
      estimatedReadTime: post.estimatedReadTime,
      publishedAt: post.publishedAt?.toISOString(),
      viewCount: post.viewCount,
      fluxCount: post.fluxCount,
      author: post.author,
      categories: post.categories.map(pc => pc.category),
      tags: post.tags.map(pt => pt.tag),
      commentsCount: post._count.comments,
      votesCount: post._count.articleVotes,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / filters.limit),
        hasNextPage: skip + filters.limit < totalCount,
        hasPreviousPage: filters.page > 1
      },
      appliedFilters: {
        categories: filters.categories,
        subcategories: filters.subcategories,
        contentTypes: filters.contentTypes,
        difficultyLevels: filters.difficultyLevels,
        tags: filters.tags,
        searchQuery: filters.searchQuery,
        dateRange: filters.dateRange,
        estimatedReadTime: filters.estimatedReadTime
      }
    });

  } catch (error) {
    console.error('Filtered posts API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple filtering (query params)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const filters = {
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      subcategories: searchParams.get('subcategories')?.split(',').filter(Boolean),
      contentTypes: searchParams.get('contentTypes')?.split(',').filter(Boolean) as any,
      difficultyLevels: searchParams.get('difficultyLevels')?.split(',').filter(Boolean) as any,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      searchQuery: searchParams.get('q') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: (searchParams.get('sortBy') as any) || 'publishedAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    };

    // Validate and process using the same logic as POST
    const validatedFilters = FilterSchema.parse(filters);
    
    // Use the same filtering logic as POST
    // (For brevity, reusing the same logic structure)
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: { not: null }
    };

    if (validatedFilters.categories && validatedFilters.categories.length > 0) {
      where.categories = {
        some: {
          category: {
            slug: { in: validatedFilters.categories }
          }
        }
      };
    }

    if (validatedFilters.searchQuery) {
      const lowerQuery = validatedFilters.searchQuery.toLowerCase();
      where.OR = [
        { title: { contains: lowerQuery } },
        { excerpt: { contains: lowerQuery } },
        { content: { contains: lowerQuery } }
      ];
    }

    const skip = (validatedFilters.page - 1) * validatedFilters.limit;
    const orderBy: any = {};
    orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy,
        skip,
        take: validatedFilters.limit
      }),
      prisma.post.count({ where })
    ]);

    const transformedPosts = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      contentType: post.contentType,
      difficultyLevel: post.difficultyLevel,
      subcategory: post.subcategory,
      estimatedReadTime: post.estimatedReadTime,
      publishedAt: post.publishedAt?.toISOString(),
      author: post.author,
      categories: post.categories.map(pc => pc.category),
      tags: post.tags.map(pt => pt.tag)
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / validatedFilters.limit)
      }
    });

  } catch (error) {
    console.error('GET Filtered posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}