import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const fluxSchema = z.object({
  flux: z.number().min(1).max(10),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromCookies();

    if (!user) {
      return NextResponse.json(
        { error: 'Anmeldung erforderlich' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = fluxSchema.parse(body);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Artikel nicht gefunden' },
        { status: 404 }
      );
    }

    // Upsert user's flux rating for this post
    const flux = await prisma.flux.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId: id,
        },
      },
      update: {
        count: validatedData.flux,
      },
      create: {
        userId: user.id,
        postId: id,
        count: validatedData.flux,
      },
    });

    // Calculate total flux for this post
    const aggregateFlux = await prisma.flux.aggregate({
      where: {
        postId: id,
      },
      _sum: {
        count: true,
      },
      _count: {
        _all: true,
      },
    });

    const totalFlux = aggregateFlux._sum.count || 0;
    const ratingCount = aggregateFlux._count._all || 0;

    // Update post's denormalized flux count
    await prisma.post.update({
      where: { id },
      data: { fluxCount: totalFlux },
    });

    return NextResponse.json({
      success: true,
      userFlux: validatedData.flux,
      totalFlux: totalFlux,
      ratingCount: ratingCount,
      averageFlux: ratingCount > 0 ? totalFlux / ratingCount : 0,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Bewertung', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting flux rating:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Bewertung' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromCookies();

    // Get aggregate flux data for this post
    const aggregateFlux = await prisma.flux.aggregate({
      where: {
        postId: id,
      },
      _sum: {
        count: true,
      },
      _count: {
        _all: true,
      },
    });

    const totalFlux = aggregateFlux._sum.count || 0;
    const ratingCount = aggregateFlux._count._all || 0;

    let userFlux = 0;
    if (user) {
      const userRating = await prisma.flux.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: id,
          },
        },
      });
      userFlux = userRating?.count || 0;
    }

    return NextResponse.json({
      totalFlux: totalFlux,
      ratingCount: ratingCount,
      averageFlux: ratingCount > 0 ? totalFlux / ratingCount : 0,
      userFlux: userFlux,
    });

  } catch (error) {
    console.error('Error fetching flux rating:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bewertung' },
      { status: 500 }
    );
  }
}