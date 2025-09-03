import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies, verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromCookies();

    if (!user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Aktuelles und neues Passwort sind erforderlich' },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Neues Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 },
      );
    }

    // Get user from database with password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 401 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      message: 'Passwort erfolgreich geändert',
    });
  } catch (error) {
    // console.error('Password change error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
