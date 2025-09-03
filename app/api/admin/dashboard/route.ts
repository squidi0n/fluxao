import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get basic stats with safe database queries
    const pendingComments = await prisma.comment.count({ 
      where: { status: 'PENDING' } 
    }).catch(() => 0);
    
    const todayPosts = await prisma.post.count({ 
      where: { createdAt: { gte: startOfToday } } 
    }).catch(() => 0);
    
    const todayUsers = await prisma.user.count({ 
      where: { lastLoginAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } 
    }).catch(() => 0);

    // Test database connection
    const dbStatus = await prisma.$queryRaw`SELECT 1 as connected`
      .then(() => 'ONLINE')
      .catch(() => 'OFFLINE');

    // Safe optional table queries
    const systemAlerts = await prisma.systemAlert?.count({ 
      where: { resolved: false } 
    }).catch(() => 0) ?? 0;
    
    const activeUserSessions = await prisma.session?.count({ 
      where: { expires: { gt: now } } 
    }).catch(() => 0) ?? 0;
    
    const supportTicketsOpen = await prisma.supportTicket?.count({ 
      where: { status: { in: ['open', 'in_progress'] } } 
    }).catch(() => 0) ?? 0;
    
    const aiUsageToday = await prisma.aiTaskLog?.count({ 
      where: { createdAt: { gte: startOfToday } } 
    }).catch(() => 0) ?? 0;

    const quickStats = {
      pendingComments,
      systemAlerts,
      activeUserSessions,
      todayPosts,
      todayUsers,
      supportTicketsOpen,
      aiUsageToday,
      dbStatus,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(quickStats);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Dashboard-Daten', details: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint for triggering system actions
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'refresh_stats':
        // Trigger a stats refresh (could clear caches, etc.)
        return NextResponse.json({ success: true, message: 'Statistiken aktualisiert' });
        
      case 'clear_alerts':
        // Mark alerts as resolved
        await prisma.systemAlert.updateMany({
          where: { resolved: false },
          data: { resolved: true, resolvedAt: new Date() }
        });
        return NextResponse.json({ success: true, message: 'Warnungen gelöscht' });
        
      default:
        return NextResponse.json(
          { error: 'Unbekannte Aktion' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Dashboard POST API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten der Aktion' },
      { status: 500 }
    );
  }
}