import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!can(session.user, 'read', 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (search) {
      // SQLite doesn't support mode: 'insensitive', so we'll use LOWER() approach
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          isPublic: true,
          editorPermissions: {
            include: {
              category: { select: { id: true, name: true, slug: true } }
            }
          },
          _count: {
            select: {
              posts: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!can(session.user, 'create', 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, name, password, role } = await request.json();

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        emailVerifiedLegacy: new Date(),
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
