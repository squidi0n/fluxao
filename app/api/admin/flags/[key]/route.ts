import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auditAdminAction } from '@/lib/audit';
import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

const updateFlagSchema = z.object({
  value: z.string(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await context.params;
    const session = await auth();

    if (!session || !can(session.user, 'read', 'flags')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to view flags',
      });
    }

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Flag not found',
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    // console.error('Get flag error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch flag',
    });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await context.params;
    const session = await auth();

    if (!session || !can(session.user, 'update', 'flags')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to update flags',
      });
    }

    const body = await request.json();
    const validation = updateFlagSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const { value } = validation.data;

    // Get current value for audit log
    const currentSetting = await prisma.setting.findUnique({
      where: { key },
    });

    // Update or create the setting
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Audit log
    await auditAdminAction(session.user.id, 'update_flag', 'setting', key, {
      key,
      previousValue: currentSetting?.value,
      newValue: value,
    });

    return NextResponse.json(setting);
  } catch (error) {
    // console.error('Update flag error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to update flag',
    });
  }
}
