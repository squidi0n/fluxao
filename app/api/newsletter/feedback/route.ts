import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const feedbackSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  reason: z.enum(['too_frequent', 'not_relevant', 'content_quality', 'other']),
  feedback: z.string().max(1000, 'Feedback zu lang').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() || '';
    const reason = formData.get('reason')?.toString() || '';
    const feedback = formData.get('feedback')?.toString() || '';

    const { email: validEmail, reason: validReason, feedback: validFeedback } = feedbackSchema.parse({
      email,
      reason,
      feedback: feedback || undefined,
    });

    // Find the subscriber
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: validEmail },
    });

    if (!subscriber) {
      return createResponse('Vielen Dank für Ihr Feedback!', 
        'Ihr Feedback wurde erfolgreich übermittelt.', false);
    }

    // Get hashed IP
    const clientIp = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown';
    const crypto = require('crypto');
    const hashedIp = crypto.createHash('sha256').update(clientIp).digest('hex');

    // Log the feedback as an interaction
    await prisma.newsletterInteraction.create({
      data: {
        subscriberId: subscriber.id,
        interactionType: 'UNSUBSCRIBED', // Use this as feedback is related to unsubscribe
        ipAddress: hashedIp,
        userAgent: request.headers.get('user-agent'),
        metadata: {
          feedbackReason: validReason,
          feedbackText: validFeedback,
          source: 'unsubscribe_feedback',
        },
      },
    });

    // Update unsubscribe reason if not already set
    if (!subscriber.unsubscribeReason || subscriber.unsubscribeReason === 'one_click_unsubscribe') {
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          unsubscribeReason: validReason,
        },
      });
    }

    logger.info(
      {
        email: subscriber.email,
        reason: validReason,
        hasFeedback: !!validFeedback,
      },
      'Newsletter unsubscribe feedback received',
    );

    return createResponse('Feedback erhalten!', 
      'Vielen Dank für Ihr wertvolles Feedback. Es hilft uns, unseren Newsletter zu verbessern.', true);

  } catch (error) {
    logger.error({ error }, 'Newsletter feedback error');

    if (error instanceof z.ZodError) {
      return createResponse('Ungültige Eingabe', 
        'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.', false, 400);
    }

    return createResponse('Fehler', 
      'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', false, 500);
  }
}

function createResponse(title: string, message: string, isSuccess: boolean, status: number = 200) {
  const baseUrl = config.get('BASE_URL');
  const bgColor = isSuccess ? '#10b981' : '#f59e0b';
  const iconBg = isSuccess ? '#10b981' : (status >= 400 ? '#ef4444' : '#f59e0b');
  const icon = isSuccess ? '✅' : (status >= 400 ? '❌' : 'ℹ️');

  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title} - FluxAO Newsletter</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 500px;
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: center;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: ${iconBg};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
        }
        h1 {
          color: ${iconBg};
          margin-bottom: 20px;
          font-size: 28px;
        }
        p {
          margin-bottom: 30px;
          font-size: 16px;
          color: #6b7280;
        }
        .buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .button.secondary {
          background-color: #6b7280;
        }
        .button.secondary:hover {
          background-color: #4b5563;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        
        <div class="buttons">
          <a href="${baseUrl}" class="button">Zur Startseite</a>
          <a href="${baseUrl}/blog" class="button secondary">Blog besuchen</a>
        </div>
        
        <div class="footer">
          <p><strong>FluxAO</strong> - Tech & AI Magazin</p>
        </div>
      </div>
    </body>
    </html>
    `,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  );
}