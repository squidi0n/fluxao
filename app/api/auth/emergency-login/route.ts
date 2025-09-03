import { NextRequest, NextResponse } from 'next/server';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 🚨 ONLY WORKS IN DEVELOPMENT WITH EMERGENCY MODE
    const emergencyMode = process.env.EMERGENCY_ADMIN_MODE === 'true';
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!emergencyMode || !isDev) {
      return NextResponse.json({ error: 'Emergency login disabled' }, { status: 403 });
    }

    const body = await request.json();
    const { adminSecret } = body;

    // Simple admin secret check
    if (adminSecret !== 'EMERGENCY_ADMIN_123') {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 401 });
    }

    // Create emergency admin user payload
    const emergencyAdmin = {
      id: 'emergency-admin-id',
      email: 'adam.freundt@gmail.com',
      name: 'Emergency Admin',
      role: 'ADMIN',
      subscription: 'PREMIUM'
    };

    // Create token and set cookie
    const token = await createToken(emergencyAdmin);
    await setAuthCookie(token);

    console.log('🚨 EMERGENCY ADMIN LOGIN SUCCESSFUL');
    
    return NextResponse.json({ 
      success: true, 
      user: emergencyAdmin,
      message: 'Emergency admin login successful'
    });
  } catch (error) {
    console.error('Emergency login error:', error);
    return NextResponse.json(
      { error: 'Emergency login failed' },
      { status: 500 }
    );
  }
}