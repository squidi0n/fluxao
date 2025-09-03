import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import { prisma } from './prisma';
import { hashPassword as hashPasswordUtil, verifyPassword as verifyPasswordUtil } from './password';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-change-in-production'
);
const TOKEN_NAME = 'auth-token';

export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription?: string;
}

// Hash password - use utility from password.ts
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordUtil(password);
}

// Verify password - use utility from password.ts
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return verifyPasswordUtil(password, hashedPassword);
}

// Create JWT token
export async function createToken(user: UserPayload): Promise<string> {
  const jwt = await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
  return jwt;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as UserPayload;
  } catch {
    return null;
  }
}

// Get current user from cookies
export async function getCurrentUser(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME);

    if (!token) return null;

    return await verifyToken(token.value);
  } catch (error) {
    // // console.error('Error getting current user:', error);
    return null;
  }
}

// Alias for compatibility
export const getUserFromCookies = getCurrentUser;

// Get user by email
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      subscription: true,
    },
  });
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
}
