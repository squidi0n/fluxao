import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/security';

// GET all API keys for current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Mask API keys for security
    const maskedKeys = apiKeys.map((key) => ({
      ...key,
      key: key.key.substring(0, 7) + '...' + key.key.substring(key.key.length - 4),
    }));

    return NextResponse.json(maskedKeys);
  } catch (error) {
    // console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const apiKey = await generateApiKey(session.user.id, name);

    return NextResponse.json(apiKey);
  } catch (error) {
    // console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
