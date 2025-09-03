import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// POST duplicate template
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const template = await prisma.newsletterTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    // Generate unique slug
    let newSlug = `${template.slug}-copy`;
    let counter = 1;

    while (true) {
      const exists = await prisma.newsletterTemplate.findUnique({
        where: { slug: newSlug },
      });

      if (!exists) break;

      counter++;
      newSlug = `${template.slug}-copy-${counter}`;
    }

    const newTemplate = await prisma.newsletterTemplate.create({
      data: {
        name: `${template.name} (Kopie)`,
        slug: newSlug,
        description: template.description,
        htmlContent: template.htmlContent,
        jsonContent: template.jsonContent,
        category: template.category,
        isDefault: false, // Copies are never default
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    // console.error('Error duplicating template:', error);
    return NextResponse.json({ error: 'Failed to duplicate template' }, { status: 500 });
  }
}
