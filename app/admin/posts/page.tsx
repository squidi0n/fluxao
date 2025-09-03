import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, FileText, CheckCircle, Edit, Archive, Star } from 'lucide-react';

import PostTable from '@/components/admin/PostTable';
import { prisma } from '@/lib/prisma';
import { 
  AdminPageHeader, 
  AdminStatCard, 
  AdminSection,
  CreateButton 
} from '@/components/admin/AdminDesignSystem';
// Auth temporarily disabled for testing

export const metadata: Metadata = {
  title: 'Posts - Admin - FluxAO',
};

interface GetPostsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function getPosts({
  page = 1,
  pageSize = 20,
  searchTerm,
  status,
  categoryId,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: GetPostsParams) {
  const skip = (page - 1) * pageSize;
  
  const where: any = {};
  
  // Search filter - SQLite doesn't support case-insensitive search, so we'll handle it differently
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    where.OR = [
      { title: { contains: lowerSearchTerm } },
      { slug: { contains: lowerSearchTerm } },
      { teaser: { contains: lowerSearchTerm } },
    ];
  }
  
  // Status filter
  if (status && status !== 'all') {
    if (status === 'featured') {
      where.isFeatured = true;
    } else {
      where.status = status;
    }
  }
  
  // Category filter
  if (categoryId && categoryId !== 'all') {
    where.categories = {
      some: {
        categoryId: categoryId
      }
    };
  }
  
  // Dynamic sorting
  const getOrderBy = () => {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'title':
        return { title: order };
      case 'status':
        return { status: order };
      case 'publishedAt':
        return { publishedAt: order };
      case 'viewCount':
        return { viewCount: order };
      case 'updatedAt':
        return { updatedAt: order };
      default:
        return { createdAt: order };
    }
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        isFeatured: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            articleVotes: {
              where: { type: 'like' }
            }
          }
        }
      },
      orderBy: getOrderBy(),
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    pageSize,
  };
}

// Get categories for filter dropdown
async function getCategories() {
  try {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  status: 'PUBLISHED'
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function AdminPostsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === 'string' ? params.search : '';
  const status = typeof params.status === 'string' ? params.status : 'all';
  const categoryId = typeof params.category === 'string' ? params.category : 'all';
  const sortBy = typeof params.sort === 'string' ? params.sort : 'createdAt';
  const sortOrder = typeof params.order === 'string' ? params.order : 'desc';

  const [{ posts, totalCount, totalPages, currentPage }, categories] = await Promise.all([
    getPosts({ page, pageSize: 20, searchTerm: search, status, categoryId, sortBy, sortOrder }),
    getCategories()
  ]);

  // Calculate stats - need to get all posts for stats
  const allPosts = await prisma.post.findMany({
    select: { status: true, isFeatured: true }
  });
  
  const stats = {
    total: allPosts.length,
    published: allPosts.filter((p) => p.status === 'PUBLISHED').length,
    draft: allPosts.filter((p) => p.status === 'DRAFT').length,
    archived: allPosts.filter((p) => p.status === 'ARCHIVED').length,
    featured: allPosts.filter((p) => p.isFeatured).length,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <AdminPageHeader
        title="Beiträge verwalten"
        description="Erstelle, bearbeite und verwalte deine Artikel"
        actions={
          <CreateButton href="/admin/posts/new">
            Neuer Beitrag erstellen
          </CreateButton>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Beiträge' }
        ]}
      />

      {/* Quick Stats */}
      <AdminSection 
        title="Übersicht" 
        description="Artikel-Statistiken auf einen Blick"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <AdminStatCard
            label="Gesamt"
            value={stats.total}
            icon="FileText"
            color="gray"
          />
          
          <AdminStatCard
            label="Veröffentlicht"
            value={stats.published}
            icon="CheckCircle"
            color="green"
            trend={{
              value: `${Math.round((stats.published / stats.total) * 100)}%`,
              direction: 'up'
            }}
          />
          
          <AdminStatCard
            label="Entwürfe"
            value={stats.draft}
            icon="Edit"
            color="blue"
            trend={{
              value: `${Math.round((stats.draft / stats.total) * 100)}%`,
              direction: 'neutral'
            }}
          />
          
          <AdminStatCard
            label="Archiviert"
            value={stats.archived}
            icon="Archive"
            color="red"
            trend={{
              value: `${Math.round((stats.archived / stats.total) * 100)}%`,
              direction: 'down'
            }}
          />
          
          <AdminStatCard
            label="Featured"
            value={stats.featured}
            icon="Star"
            color="yellow"
            trend={{
              value: `${Math.round((stats.featured / stats.total) * 100)}%`,
              direction: 'up'
            }}
          />
        </div>
      </AdminSection>

      {/* Posts Management */}
      <AdminSection>
        <PostTable 
          posts={posts} 
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          initialSearch={search}
          initialStatus={status}
          initialCategory={categoryId}
          initialSortBy={sortBy}
          initialSortOrder={sortOrder}
          categories={categories}
        />
      </AdminSection>
    </div>
  );
}
