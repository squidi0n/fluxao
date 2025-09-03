import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/quotes/random
export async function GET() {
  try {
    // Get a random quote that's active
    const quotesCount = await prisma.quote.count({
      where: { isActive: true }
    });

    if (quotesCount === 0) {
      return NextResponse.json({ 
        quote: {
          text: "Innovation distinguishes between a leader and a follower.",
          author: "Steve Jobs",
          profession: "Co-founder of Apple",
          category: "INNOVATION"
        }
      });
    }

    const skip = Math.floor(Math.random() * quotesCount);
    
    const quote = await prisma.quote.findFirst({
      where: { isActive: true },
      skip: skip,
      select: {
        text: true,
        author: true,
        profession: true,
        year: true,
        category: true
      }
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching random quote:', error);
    return NextResponse.json({ 
      quote: {
        text: "Technology is nothing. What's important is that you have a faith in people.",
        author: "Steve Jobs",
        profession: "Co-founder of Apple",
        category: "TECHNOLOGY"
      }
    });
  }
}