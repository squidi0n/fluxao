import { existsSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Nur Bilddateien erlaubt' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    // console.error('Upload error:', error);
    return NextResponse.json({ error: 'Fehler beim Hochladen' }, { status: 500 });
  }
}
