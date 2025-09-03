import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's saved filters
    const savedFilters = await prisma.savedFilter.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { isDefault: 'desc' }, // Default filters first
        { updatedAt: 'desc' }   // Then by most recently updated
      ]
    });

    const transformedFilters = savedFilters.map(filter => ({
      id: filter.id,
      name: filter.name,
      filters: filter.filters,
      isDefault: filter.isDefault,
      createdAt: filter.createdAt.toISOString(),
      updatedAt: filter.updatedAt.toISOString()
    }));

    return NextResponse.json(transformedFilters);

  } catch (error) {
    console.error('Get saved filters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}