import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// SET a saved filter as default
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check if the filter exists and belongs to the user
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!filter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    // Use a transaction to ensure consistency
    await prisma.$transaction([
      // First, remove default from all other filters for this user
      prisma.savedFilter.updateMany({
        where: {
          userId: user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      }),
      // Then set this filter as default
      prisma.savedFilter.update({
        where: {
          id: params.id
        },
        data: {
          isDefault: true
        }
      })
    ]);

    return NextResponse.json({ 
      success: true,
      message: 'Filter set as default' 
    });

  } catch (error) {
    console.error('Set default filter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}