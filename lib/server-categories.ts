import { prisma } from '@/lib/prisma';

interface ServerCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Server-side function to fetch all categories
 * Used in server components like page.tsx
 */
export async function getServerCategories(): Promise<ServerCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error fetching server categories:', error);
    return [];
  }
}

/**
 * Get category by slug (server-side)
 */
export async function getServerCategoryBySlug(slug: string): Promise<ServerCategory | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return category ? {
      id: category.id,
      name: category.name,
      slug: category.slug,
    } : null;
  } catch (error) {
    console.error('Error fetching server category by slug:', error);
    return null;
  }
}