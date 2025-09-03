import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { startTrial, canStartTrial } from '@/lib/trial';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check if user can start trial
    const canStart = await canStartTrial(userId);
    
    if (!canStart) {
      return NextResponse.json(
        { error: 'Trial not available or already used' },
        { status: 400 }
      );
    }

    // Start the trial
    await startTrial(userId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Trial started successfully' 
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}