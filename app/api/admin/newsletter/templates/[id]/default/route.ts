import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// PATCH set template as default for its category
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const template = await prisma.newsletterTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    // Toggle default status
    const newDefaultStatus = !template.isDefault;

    if (newDefaultStatus) {
      // If setting as default, unset other defaults in same category
      await prisma.newsletterTemplate.updateMany({
        where: {
          category: template.category,
          isDefault: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedTemplate = await prisma.newsletterTemplate.update({
      where: { id },
      data: {
        isDefault: newDefaultStatus,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    // console.error('Error setting default template:', error);
    return NextResponse.json({ error: 'Failed to set default template' }, { status: 500 });
  }
}
