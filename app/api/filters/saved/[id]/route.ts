import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE a saved filter
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete the filter
    await prisma.savedFilter.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete saved filter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE a saved filter
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

    const body = await request.json();
    const { name, filters, isDefault } = body;

    // Check if the filter exists and belongs to the user
    const existingFilter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingFilter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    // If setting as default, remove default from other filters
    if (isDefault && !existingFilter.isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: params.id }
        },
        data: {
          isDefault: false
        }
      });
    }

    // Update the filter
    const updatedFilter = await prisma.savedFilter.update({
      where: {
        id: params.id
      },
      data: {
        ...(name && { name }),
        ...(filters && { filters: filters as any }),
        ...(isDefault !== undefined && { isDefault })
      }
    });

    return NextResponse.json({
      id: updatedFilter.id,
      name: updatedFilter.name,
      filters: updatedFilter.filters,
      isDefault: updatedFilter.isDefault,
      createdAt: updatedFilter.createdAt.toISOString(),
      updatedAt: updatedFilter.updatedAt.toISOString()
    });

  } catch (error) {
    console.error('Update saved filter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}