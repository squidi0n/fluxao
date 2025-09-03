import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// 1x1 transparent pixel as base64
const TRACKING_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get('s');
    const campaignId = searchParams.get('c');

    // Log open if subscriber ID provided
    if (subscriberId) {
      try {
        // Check if this open was already tracked recently (avoid double-tracking)
        const recentOpen = await prisma.newsletterInteraction.findFirst({
          where: {
            subscriberId,
            campaignId,
            interactionType: 'OPENED',
            timestamp: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            },
          },
        });

        if (!recentOpen) {
          const clientIp = request.ip || 
            request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 
            'unknown';
          
          const crypto = require('crypto');
          const hashedIp = crypto.createHash('sha256').update(clientIp).digest('hex');

          await prisma.newsletterInteraction.create({
            data: {
              subscriberId,
              campaignId,
              interactionType: 'OPENED',
              ipAddress: hashedIp,
              userAgent: request.headers.get('user-agent'),
              metadata: {
                referer: request.headers.get('referer'),
                timestamp: new Date().toISOString(),
                clientHints: {
                  mobile: request.headers.get('sec-ch-ua-mobile'),
                  platform: request.headers.get('sec-ch-ua-platform'),
                },
              },
            },
          });

          logger.info(
            {
              subscriberId,
              campaignId,
            },
            'Newsletter open tracked'
          );
        }
      } catch (error) {
        // Log error but don't fail the pixel response
        logger.error({ error, subscriberId }, 'Failed to track newsletter open');
      }
    }

    // Return the tracking pixel
    const pixelBuffer = Buffer.from(TRACKING_PIXEL, 'base64');
    
    return new NextResponse(pixelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixelBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Newsletter open tracking error');
    
    // Return empty pixel even on error
    const pixelBuffer = Buffer.from(TRACKING_PIXEL, 'base64');
    return new NextResponse(pixelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  }
}