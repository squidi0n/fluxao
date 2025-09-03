import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!can(session.user, 'read:self', 'settings', session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Return default settings if none exist
    if (!settings) {
      const defaultSettings = {
        emailNotifications: true,
        newsletterSubscription: true,
        commentNotifications: true,
        mentionNotifications: true,
        securityNotifications: true,
        profileVisible: true,
        showEmail: false,
        showLocation: true,
        allowDirectMessages: true,
        language: 'de',
        timezone: 'Europe/Berlin',
        dateFormat: 'DD/MM/YYYY',
        theme: 'system',
        hideAds: false,
        authorPageVisible: true,
      };
      
      return NextResponse.json(defaultSettings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!can(session.user, 'update:self', 'settings', session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate and sanitize input
    const allowedFields = [
      'emailNotifications',
      'newsletterSubscription', 
      'commentNotifications',
      'mentionNotifications',
      'securityNotifications',
      'profileVisible',
      'showEmail',
      'showLocation', 
      'allowDirectMessages',
      'language',
      'timezone',
      'dateFormat',
      'theme',
      'contentLanguages',
      'interestedTopics',
      'hideAds',
      'editorBio',
      'editorSpecialties',
      'authorPageVisible'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}