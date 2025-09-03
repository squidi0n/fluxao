import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!can(session.user, 'manage_permissions', 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!session?.user?.idId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Valid roles for promotion
    const validRoles = ['USER', 'PREMIUM', 'EDITOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_ROLE_CHANGED',
        userId: session.user.id,
        targetId: userId,
        targetType: 'User',
        metadata: {
          oldRole: 'USER',
          newRole: role,
          promotedBy: session.user.id
        },
        status: 'SUCCESS',
        message: `User ${updatedUser.email} promoted to ${role}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: `User successfully promoted to ${role}` 
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}