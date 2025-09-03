import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, role: true }
    });

    if (!user?.isAdmin && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      templateType = 'weekly',
      customTitle,
      customIntro,
      additionalContent 
    } = body;

    // Validate template type
    const validTypes = ['weekly', 'welcome', 'announcement', 'promotional'];
    if (!validTypes.includes(templateType)) {
      return NextResponse.json(
        { error: `Invalid template type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate autofilled newsletter (placeholder until module is created)
    const result = {
      html: `<h1>Newsletter Template: ${templateType}</h1><p>Content will be auto-generated here.</p>`,
      data: { templateType, customTitle, customIntro },
      metadata: { 
        postCount: 5, 
        subject: customTitle || `FluxAO Newsletter - ${templateType}`,
        preheader: customIntro || 'Your weekly tech insights' 
      }
    };

    return NextResponse.json({
      success: true,
      html: result.html,
      data: result.data,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error('Newsletter autofill error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate newsletter autofill',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, role: true }
    });

    if (!user?.isAdmin && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type') || 'weekly';

    // Get preview of autofill data without generating full HTML
    // Generate preview data without full autofill
    const preview = {
      metadata: {
        postCount: 5,
        subject: `FluxAO Newsletter - ${templateType}`,
        preheader: 'Your weekly tech insights',
        estimatedReadTime: '3-5 minutes'
      }
    };

    return NextResponse.json({
      success: true,
      preview: {
        postCount: preview.metadata.postCount,
        subject: preview.metadata.subject,
        preheader: preview.metadata.preheader,
        estimatedReadTime: preview.metadata.estimatedReadTime,
      }
    });

  } catch (error) {
    console.error('Newsletter autofill preview error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get newsletter autofill preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}