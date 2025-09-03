import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check if subscriber exists
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json({ error: 'Abonnent nicht gefunden' }, { status: 404 });
    }

    // Delete the subscriber
    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Abonnent erfolgreich gelöscht',
    });
  } catch (error) {
    // console.error('Error deleting newsletter subscriber:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Abonnenten' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json({ error: 'Abonnent nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(subscriber);
  } catch (error) {
    // console.error('Error fetching newsletter subscriber:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen des Abonnenten' }, { status: 500 });
  }
}
