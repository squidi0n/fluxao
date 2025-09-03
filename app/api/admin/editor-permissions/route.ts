import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
    const userId = searchParams.get('userId');

    if (userId) {
      // Get permissions for specific user
      const permissions = await prisma.editorPermissions.findMany({
        where: { userId },
        include: { category: true }
      });
      
      return NextResponse.json(permissions);
    } else {
      // Get all editor permissions
      const permissions = await prisma.editorPermissions.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: true
        }
      });
      
      return NextResponse.json(permissions);
    }
  } catch (error) {
    console.error('Error fetching editor permissions:', error);
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

    if (!can(session.user, 'manage_permissions', 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      categoryId,
      canCreatePosts = true,
      canEditPosts = true,
      canDeletePosts = false,
      canPublishPosts = false,
      canManageComments = false,
      canUploadMedia = true,
      maxPostsPerMonth,
      maxImagesPerPost = 10,
      maxVideoLength = 300
    } = body;

    if (!session?.user?.idId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Verify user exists and is an editor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!session?.user?.id || session.user.role !== 'EDITOR') {
      return NextResponse.json({ 
        error: 'User not found or not an editor' 
      }, { status: 400 });
    }

    // Upsert permissions
    const permissions = await prisma.editorPermissions.upsert({
      where: {
        userId_categoryId: {
          userId,
          categoryId: categoryId || null
        }
      },
      update: {
        canCreatePosts,
        canEditPosts,
        canDeletePosts,
        canPublishPosts,
        canManageComments,
        canUploadMedia,
        maxPostsPerMonth,
        maxImagesPerPost,
        maxVideoLength
      },
      create: {
        userId,
        categoryId: categoryId || null,
        canCreatePosts,
        canEditPosts,
        canDeletePosts,
        canPublishPosts,
        canManageComments,
        canUploadMedia,
        maxPostsPerMonth,
        maxImagesPerPost,
        maxVideoLength,
        grantedBy: session.user.id
      },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EDITOR_PERMISSIONS_UPDATED',
        userId: session.user.id,
        targetId: userId,
        targetType: 'EditorPermissions',
        metadata: {
          permissions: {
            categoryId,
            canCreatePosts,
            canEditPosts,
            canDeletePosts,
            canPublishPosts,
            canManageComments,
            canUploadMedia,
            maxPostsPerMonth,
            maxImagesPerPost,
            maxVideoLength
          },
          updatedBy: session.user.id
        },
        status: 'SUCCESS',
        message: `Editor permissions updated for ${permissions.user.email}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      permissions,
      message: 'Editor permissions updated successfully' 
    });
  } catch (error) {
    console.error('Error updating editor permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!can(session.user, 'manage_permissions', 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('id');
    
    if (!permissionId) {
      return NextResponse.json({ error: 'Missing permission ID' }, { status: 400 });
    }

    const deletedPermission = await prisma.editorPermissions.delete({
      where: { id: permissionId },
      include: {
        user: { select: { email: true } },
        category: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EDITOR_PERMISSIONS_DELETED',
        userId: session.user.id,
        targetId: permissionId,
        targetType: 'EditorPermissions',
        metadata: {
          deletedPermission: {
            userId: deletedPermission.userId,
            categoryId: deletedPermission.categoryId,
            categoryName: deletedPermission.category?.name
          },
          deletedBy: session.user.id
        },
        status: 'SUCCESS',
        message: `Editor permissions deleted for ${deletedPermission.user.email}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Editor permissions deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting editor permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}