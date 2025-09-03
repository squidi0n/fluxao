import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security';

// DELETE revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Check if user owns this API key or is admin
    if (apiKey.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: { id },
    });

    // Log the revocation
    await logSecurityEvent({
      type: 'api_key_revoked',
      severity: 'warning',
      userId: session.user.id,
      message: `API key "${apiKey.name}" was revoked`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
