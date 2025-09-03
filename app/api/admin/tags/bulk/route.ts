import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slugify';

const bulkCreateSchema = z.object({
  tags: z.string().min(1, 'Bitte geben Sie mindestens einen Tag ein'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = bulkCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    // Parse tags - unterstützt verschiedene Trennzeichen
    const { tags: tagsInput } = validation.data;

    // Entferne # und split by comma, semicolon, space, or newline
    const tagNames = tagsInput
      .replace(/#/g, '') // Entferne alle #
      .split(/[,;\s\n]+/) // Split by comma, semicolon, space oder newline
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0) // Entferne leere Strings
      .filter((tag, index, self) => self.indexOf(tag) === index); // Entferne Duplikate

    if (tagNames.length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Tags gefunden' }, { status: 400 });
    }

    // Prüfe welche Tags bereits existieren
    const existingTags = await prisma.tag.findMany({
      where: {
        name: {
          in: tagNames,
        },
      },
    });

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = tagNames.filter((name) => !existingTagNames.includes(name));

    // Erstelle neue Tags
    const createdTags = [];
    const errors = [];

    for (const tagName of newTagNames) {
      try {
        const slug = slugify(tagName);

        // Prüfe ob Slug bereits existiert
        const existingSlug = await prisma.tag.findUnique({
          where: { slug },
        });

        if (existingSlug) {
          errors.push(`Tag "${tagName}" konnte nicht erstellt werden (Slug bereits vorhanden)`);
          continue;
        }

        const newTag = await prisma.tag.create({
          data: {
            name: tagName,
            slug,
          },
        });

        createdTags.push(newTag);
      } catch (error) {
        errors.push(`Fehler beim Erstellen von "${tagName}"`);
      }
    }

    return NextResponse.json({
      success: true,
      created: createdTags.length,
      skipped: existingTagNames.length,
      errors: errors.length,
      details: {
        createdTags: createdTags.map((t) => t.name),
        skippedTags: existingTagNames,
        errors,
      },
    });
  } catch (error) {
    // console.error('Bulk create tags error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Tags' }, { status: 500 });
  }
}
