import { NextRequest, NextResponse } from 'next/server';

import { getUserByEmail, verifyPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email und Passwort erforderlich' }, { status: 400 });
    }

    // Get user from database
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash || '');

    if (!isValid) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    // Create token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription?.plan,
    });

    // Set cookie
    await setAuthCookie(token);

    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription?.plan,
      },
    });
  } catch (error) {
    // console.error('Login error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
