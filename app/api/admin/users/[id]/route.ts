import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const updateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal('')),
  role: z.nativeEnum(Role),
  isAdmin: z.boolean(),
  isPublic: z.boolean(),
  emailVerified: z.boolean(),
});

// GET - Get single user
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            sessions: true,
            following: true,
            followers: true,
          },
        },
      },
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    // console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const data = validation.data;

    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'E-Mail-Adresse bereits vergeben' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name || null,
        username: data.username || null,
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        role: data.role,
        isAdmin: data.isAdmin,
        isPublic: data.isPublic,
        emailVerified: data.emailVerified ? new Date() : null,
      },
      include: {
        _count: {
          select: {
            posts: true,
            sessions: true,
            following: true,
            followers: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    // console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has posts
    const userWithPosts = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!session?.user?.idWithPosts) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has posts, delete them first (cascade delete)
    if (userWithPosts._count.posts > 0) {
      // Delete all posts from this user
      await prisma.post.deleteMany({
        where: { authorId: id },
      });
    }

    // Delete user (this will also cascade delete related records)
    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
