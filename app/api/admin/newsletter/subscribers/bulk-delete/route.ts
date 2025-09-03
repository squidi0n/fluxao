import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Keine IDs angegeben' }, { status: 400 });
    }

    // Delete multiple subscribers
    const deleteResult = await prisma.newsletterSubscriber.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} Abonnenten erfolgreich gelöscht`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    // console.error('Error bulk deleting newsletter subscribers:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Abonnenten' }, { status: 500 });
  }
}
