import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  htmlContent: z.string().min(1),
  jsonContent: z.any().optional(),
  category: z.enum(['welcome', 'announcement', 'weekly', 'promotional']),
  isDefault: z.boolean().optional(),
});

// GET all templates
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.newsletterTemplate.findMany({
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    // console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const data = validation.data;

    // Check if slug already exists
    const existing = await prisma.newsletterTemplate.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ein Template mit diesem Slug existiert bereits' },
        { status: 400 },
      );
    }

    // If setting as default, unset other defaults in same category
    if (data.isDefault) {
      await prisma.newsletterTemplate.updateMany({
        where: {
          category: data.category,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.newsletterTemplate.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        htmlContent: data.htmlContent,
        jsonContent: data.jsonContent,
        category: data.category,
        isDefault: data.isDefault || false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    // console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
