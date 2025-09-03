import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  linkedin: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  youtube: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    const formData = await request.formData();

    // Parse form data
    const data = {
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      bio: (formData.get('bio') as string) || '',
      location: (formData.get('location') as string) || '',
      website: (formData.get('website') as string) || '',
      github: (formData.get('github') as string) || '',
      twitter: (formData.get('twitter') as string) || '',
      linkedin: (formData.get('linkedin') as string) || '',
      instagram: (formData.get('instagram') as string) || '',
      youtube: (formData.get('youtube') as string) || '',
    };

    // Validate input
    const result = profileUpdateSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const validatedData = result.data;

    // Check if username is already taken by another user
    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: validatedData.username },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
    }

    // Handle avatar upload if present
    let avatarUrl: string | undefined;
    const avatarFile = formData.get('avatar') as File | null;

    if (avatarFile && avatarFile.size > 0) {
      // TODO: Implement actual file upload to cloud storage
      // For now, we'll use a placeholder
      avatarUrl = `/api/avatar/${user.id}`;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validatedData.name,
        username: validatedData.username,
        bio: validatedData.bio,
        location: validatedData.location,
        website: validatedData.website || null,
        ...(avatarUrl && { avatar: avatarUrl }),
      },
    });

    // Update or create social links
    await prisma.socialLink.upsert({
      where: { userId: user.id },
      update: {
        github: validatedData.github || null,
        twitter: validatedData.twitter || null,
        linkedin: validatedData.linkedin || null,
        instagram: validatedData.instagram || null,
        youtube: validatedData.youtube || null,
      },
      create: {
        userId: user.id,
        github: validatedData.github || null,
        twitter: validatedData.twitter || null,
        linkedin: validatedData.linkedin || null,
        instagram: validatedData.instagram || null,
        youtube: validatedData.youtube || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          username: updatedUser.username,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    // console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
