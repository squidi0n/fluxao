import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        order: 'asc'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    return NextResponse.json({
      categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}