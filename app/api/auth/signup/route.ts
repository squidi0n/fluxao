import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { prisma } from '@/lib/prisma';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Generate unique username from email
async function generateUniqueUsername(email: string): Promise<string> {
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let username = baseUsername;
  let counter = 0;

  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    counter++;
    username = `${baseUsername}${counter}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Signup attempt:', { name: body.name, email: body.email, passwordLength: body.password?.length });

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.issues);
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: passwordValidation.errors.map((error) => ({
            field: 'password',
            message: error,
          })),
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique username
    const username = await generateUniqueUsername(email);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        username,
        passwordHash,
        role: 'USER',
        emailVerified: null,
        emailVerifiedLegacy: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}