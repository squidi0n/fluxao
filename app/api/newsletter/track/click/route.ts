import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const subscriberId = searchParams.get('s');
    const campaignId = searchParams.get('c');

    if (!url) {
      return NextResponse.redirect('https://fluxao.com');
    }

    // Log click if subscriber ID provided
    if (subscriberId) {
      try {
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
            interactionType: 'CLICKED',
            ipAddress: hashedIp,
            userAgent: request.headers.get('user-agent'),
            linkUrl: url,
            metadata: {
              referer: request.headers.get('referer'),
              timestamp: new Date().toISOString(),
            },
          },
        });

        logger.info(
          {
            subscriberId,
            campaignId,
            url,
          },
          'Newsletter click tracked'
        );
      } catch (error) {
        // Log error but don't fail the redirect
        logger.error({ error, subscriberId, url }, 'Failed to track newsletter click');
      }
    }

    // Redirect to the original URL
    return NextResponse.redirect(url);
  } catch (error) {
    logger.error({ error }, 'Newsletter click tracking error');
    
    // Fallback redirect
    return NextResponse.redirect('https://fluxao.com');
  }
}