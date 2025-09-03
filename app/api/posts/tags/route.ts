import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCount = searchParams.get('includeCount') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    let tags;

    if (includeCount) {
      // Get tags with post counts
      const tagsWithCount = await prisma.tag.findMany({
        where: search ? {
          name: {
            contains: search.toLowerCase()
          }
        } : {},
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              posts: {
                where: {
                  post: {
                    status: 'PUBLISHED',
                    publishedAt: {
                      not: null
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          posts: {
            _count: 'desc'
          }
        },
        take: limit
      });

      tags = tagsWithCount.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: tag._count.posts
      }));
    } else {
      // Simple tags list
      const simpleTags = await prisma.tag.findMany({
        where: search ? {
          name: {
            contains: search.toLowerCase()
          }
        } : {},
        select: {
          id: true,
          name: true,
          slug: true
        },
        orderBy: {
          name: 'asc'
        },
        take: limit
      });

      tags = simpleTags;
    }

    return NextResponse.json({
      tags,
      totalCount: tags.length
    });

  } catch (error) {
    console.error('Tags API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get popular tags
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'popular', limit = 20 } = body;

    let tags;

    switch (type) {
      case 'popular':
        // Most used tags
        tags = await prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                posts: {
                  where: {
                    post: {
                      status: 'PUBLISHED',
                      publishedAt: {
                        not: null
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            posts: {
              _count: 'desc'
            }
          },
          take: limit
        });
        break;

      case 'trending':
        // Tags used in recent popular posts
        const trendingTags = await prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            posts: {
              select: {
                post: {
                  select: {
                    viewCount: true,
                    publishedAt: true
                  }
                }
              },
              where: {
                post: {
                  status: 'PUBLISHED',
                  publishedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                  }
                }
              }
            }
          },
          where: {
            posts: {
              some: {
                post: {
                  status: 'PUBLISHED',
                  publishedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          }
        });

        // Calculate trending score (views per post in last 30 days)
        tags = trendingTags
          .map(tag => {
            const totalViews = tag.posts.reduce((sum, p) => sum + p.post.viewCount, 0);
            const postCount = tag.posts.length;
            return {
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
              trendingScore: postCount > 0 ? totalViews / postCount : 0,
              postCount
            };
          })
          .sort((a, b) => b.trendingScore - a.trendingScore)
          .slice(0, limit);
        break;

      case 'recent':
        // Recently created tags
        tags = await prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            _count: {
              select: {
                posts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid tag type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: '_count' in tag ? tag._count.posts : ('postCount' in tag ? tag.postCount : 0),
        ...(type === 'trending' && 'trendingScore' in tag && { trendingScore: tag.trendingScore }),
        ...(type === 'recent' && 'createdAt' in tag && { createdAt: tag.createdAt })
      })),
      type,
      totalCount: tags.length
    });

  } catch (error) {
    console.error('Tags POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}