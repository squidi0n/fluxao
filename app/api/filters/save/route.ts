import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SaveFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.object({
    categories: z.array(z.string()).optional(),
    subcategories: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    difficultyLevels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    searchQuery: z.string().optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional(),
    estimatedReadTime: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }),
  isDefault: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
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
    const { name, filters, isDefault } = SaveFilterSchema.parse(body);

    // If setting as default, remove default from other filters
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create the saved filter
    const savedFilter = await prisma.savedFilter.create({
      data: {
        userId: user.id,
        name,
        filters: filters as any, // Prisma Json type
        isDefault
      }
    });

    return NextResponse.json({
      id: savedFilter.id,
      name: savedFilter.name,
      filters: savedFilter.filters,
      isDefault: savedFilter.isDefault,
      createdAt: savedFilter.createdAt.toISOString(),
      updatedAt: savedFilter.updatedAt.toISOString()
    });

  } catch (error) {
    console.error('Save filter API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}