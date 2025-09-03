import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/quotes
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

// POST /api/admin/quotes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const quote = await prisma.quote.create({
      data: {
        text: data.text,
        author: data.author,
        profession: data.profession || null,
        year: data.year || null,
        source: data.source || null,
        category: data.category,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}