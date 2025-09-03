import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserTrialStatus } from '@/lib/trial';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trialStatus = await getUserTrialStatus(session.user.id);
    
    return NextResponse.json(trialStatus);
  } catch (error) {
    console.error('Error fetching trial status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}