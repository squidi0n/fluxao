import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      users: userCount,
      posts: postCount,
      env: {
        database: process.env.DATABASE_URL ? 'set' : 'missing',
        nextauth: process.env.NEXTAUTH_URL ? 'set' : 'missing',
      }
    });
  } catch (error: any) {
    // console.error('Test API Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}