import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
  htmlContent: z.string().min(1).optional(),
  jsonContent: z.any().optional(),
  category: z.enum(['welcome', 'announcement', 'weekly', 'promotional']).optional(),
  isDefault: z.boolean().optional(),
});

// GET single template
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const template = await prisma.newsletterTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    // console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT update template
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validation = updateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const data = validation.data;

    // Check if template exists
    const existing = await prisma.newsletterTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    // Check if slug is being changed and if it's unique
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.newsletterTemplate.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Ein Template mit diesem Slug existiert bereits' },
          { status: 400 },
        );
      }
    }

    // If setting as default, unset other defaults in same category
    if (data.isDefault) {
      const category = data.category || existing.category;
      await prisma.newsletterTemplate.updateMany({
        where: {
          category,
          isDefault: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.newsletterTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(template);
  } catch (error) {
    // console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE template
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check if template has campaigns
    const template = await prisma.newsletterTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    if (template._count.campaigns > 0) {
      return NextResponse.json(
        { error: 'Template kann nicht gelöscht werden, da es in Kampagnen verwendet wird' },
        { status: 400 },
      );
    }

    await prisma.newsletterTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
