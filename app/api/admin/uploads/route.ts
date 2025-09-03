import { existsSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // Validiere Dateityp
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ungültiger Dateityp. Nur JPEG, PNG, GIF und WebP erlaubt.' },
        { status: 400 },
      );
    }

    // Validiere Dateigröße (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Datei zu groß. Maximal 5MB erlaubt.' }, { status: 400 });
    }

    // Erstelle Upload-Verzeichnis falls nicht vorhanden
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generiere eindeutigen Dateinamen
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name);
    const filename = `${timestamp}-${randomString}${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Konvertiere File zu Buffer und speichere
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Gebe öffentliche URL zurück
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    // console.error('Upload error:', error);
    return NextResponse.json({ error: 'Fehler beim Hochladen der Datei' }, { status: 500 });
  }
}
