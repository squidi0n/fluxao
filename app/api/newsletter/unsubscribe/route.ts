import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// Validation schemas
const unsubscribeQuerySchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

const unsubscribePostSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  token: z.string().min(1, 'Token ist erforderlich').optional(),
  reason: z.string().optional(),
  feedback: z.string().optional(),
  listId: z.string().optional(), // For specific list unsubscribe
}).refine(data => data.email || data.token, {
  message: 'Entweder E-Mail oder Token ist erforderlich',
});

// GET endpoint for one-click unsubscribe (RFC 8058 compliance)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const reason = searchParams.get('reason');
    const feedback = searchParams.get('feedback');

    if (!token) {
      return createErrorResponse('Ungültiger Abmelde-Link', 400);
    }

    const { token: validatedToken } = unsubscribeQuerySchema.parse({ 
      token, 
      reason: reason || undefined,
      feedback: feedback || undefined 
    });

    // Find subscriber by unsubscribe token
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { 
        OR: [
          { unsubscribeToken: validatedToken },
          { token: validatedToken } // Fallback to verification token
        ]
      },
    });

    if (!subscriber) {
      return createErrorResponse('Ungültiger oder abgelaufener Abmelde-Link', 404);
    }

    if (subscriber.status === 'unsubscribed') {
      return createSuccessResponse(
        'Bereits abgemeldet',
        'Diese E-Mail-Adresse wurde bereits vom Newsletter abgemeldet.',
        subscriber.email,
        false
      );
    }

    // Process unsubscribe
    const unsubscribeData = {
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
      unsubscribeReason: reason || 'one_click_unsubscribe',
    };

    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: unsubscribeData,
    });

    // Log consent withdrawal for GDPR compliance
    await prisma.newsletterConsent.create({
      data: {
        subscriberId: subscriber.id,
        consentType: 'SIGNUP',
        consentGiven: false,
        consentMethod: 'one_click_unsubscribe',
        withdrawnAt: new Date(),
        withdrawReason: reason || 'user_request',
        ipAddress: getHashedIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        legalBasis: 'user_request',
      },
    });

    // Log interaction for analytics
    await prisma.newsletterInteraction.create({
      data: {
        subscriberId: subscriber.id,
        interactionType: 'UNSUBSCRIBED',
        ipAddress: getHashedIp(request),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: reason || 'one_click_unsubscribe',
          feedback: feedback || null,
        },
      },
    });

    logger.info(
      {
        email: updatedSubscriber.email,
        id: updatedSubscriber.id,
        reason,
      },
      'Newsletter unsubscribe completed',
    );

    return createSuccessResponse(
      'Newsletter abgemeldet',
      'Sie wurden erfolgreich vom Newsletter abgemeldet. Sie erhalten keine weiteren E-Mails von uns.',
      updatedSubscriber.email,
      true
    );
  } catch (error) {
    logger.error({ error }, 'Newsletter unsubscribe error');

    if (error instanceof z.ZodError) {
      return createErrorResponse('Ungültige Anfrage', 400);
    }

    return createErrorResponse('Ein unerwarteter Fehler ist aufgetreten', 500);
  }
}

// POST endpoint for List-Unsubscribe-Post header (RFC 8058)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, reason, feedback, listId } = unsubscribePostSchema.parse(body);

    let subscriber;

    if (token) {
      subscriber = await prisma.newsletterSubscriber.findFirst({
        where: {
          OR: [
            { unsubscribeToken: token },
            { token: token }
          ]
        },
      });
    } else if (email) {
      subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email },
      });
    }

    if (!subscriber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Abonnent nicht gefunden',
          code: 'SUBSCRIBER_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json({
        success: true,
        message: 'Bereits vom Newsletter abgemeldet',
        email: subscriber.email,
        unsubscribedAt: subscriber.unsubscribedAt,
      });
    }

    // Process unsubscribe
    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
        unsubscribeReason: reason || 'list_unsubscribe_post',
      },
    });

    // Log consent withdrawal
    await prisma.newsletterConsent.create({
      data: {
        subscriberId: subscriber.id,
        consentType: 'SIGNUP',
        consentGiven: false,
        consentMethod: 'list_unsubscribe_post',
        withdrawnAt: new Date(),
        withdrawReason: reason || 'user_request',
        ipAddress: getHashedIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        legalBasis: 'user_request',
      },
    });

    // Log interaction
    await prisma.newsletterInteraction.create({
      data: {
        subscriberId: subscriber.id,
        interactionType: 'UNSUBSCRIBED',
        ipAddress: getHashedIp(request),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: reason || 'list_unsubscribe_post',
          feedback: feedback || null,
          listId: listId || null,
        },
      },
    });

    logger.info(
      {
        email: updatedSubscriber.email,
        id: updatedSubscriber.id,
        reason,
      },
      'Newsletter unsubscribe via POST completed',
    );

    return NextResponse.json({
      success: true,
      message: 'Erfolgreich vom Newsletter abgemeldet',
      email: updatedSubscriber.email,
      unsubscribedAt: updatedSubscriber.unsubscribedAt,
    });
  } catch (error) {
    logger.error({ error }, 'Newsletter unsubscribe POST error');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Daten',
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten',
      },
      { status: 500 },
    );
  }
}

// Helper function to get hashed IP
function getHashedIp(request: NextRequest): string {
  const clientIp = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(clientIp).digest('hex');
}

// Success response with improved UX
function createSuccessResponse(title: string, message: string, email: string, showFeedbackForm: boolean = false) {
  const baseUrl = config.get('BASE_URL');
  
  const feedbackForm = showFeedbackForm ? `
    <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <h3 style="color: #374151; margin-bottom: 15px;">Warum haben Sie sich abgemeldet? (Optional)</h3>
      <form action="${baseUrl}/api/newsletter/feedback" method="POST">
        <input type="hidden" name="email" value="${email}">
        <div style="margin-bottom: 10px;">
          <label><input type="radio" name="reason" value="too_frequent"> Zu häufig</label><br>
          <label><input type="radio" name="reason" value="not_relevant"> Nicht relevant</label><br>
          <label><input type="radio" name="reason" value="other"> Andere Gründe</label>
        </div>
        <textarea name="feedback" placeholder="Weitere Kommentare..." style="width: 100%; height: 60px; margin: 10px 0; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
        <button type="submit" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px;">Feedback senden</button>
      </form>
    </div>
  ` : '';

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
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 600px;
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: center;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: #f59e0b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
        }
        h1 {
          color: #d97706;
          margin-bottom: 20px;
          font-size: 28px;
        }
        p {
          margin-bottom: 30px;
          font-size: 16px;
          color: #6b7280;
        }
        .email {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 6px;
          font-family: monospace;
          margin: 20px 0;
          word-break: break-all;
        }
        .buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 30px;
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
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: left;
        }
        .footer h4 {
          color: #374151;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📧</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="email">${email}</div>
        
        ${feedbackForm}
        
        <div class="buttons">
          <a href="${baseUrl}" class="button">Zur Startseite</a>
          <a href="${baseUrl}/newsletter/subscribe" class="button secondary">Erneut anmelden</a>
        </div>
        
        <div class="footer">
          <h4>Ihre Datenschutzrechte</h4>
          <p>Ihre Abmeldung wurde sofort verarbeitet. Gemäß DSGVO haben Sie folgende Rechte:</p>
          <ul style="text-align: left;">
            <li><strong>Recht auf Löschung:</strong> Sie können die vollständige Löschung Ihrer Daten beantragen</li>
            <li><strong>Recht auf Auskunft:</strong> Sie können eine Kopie Ihrer gespeicherten Daten anfordern</li>
            <li><strong>Recht auf Berichtigung:</strong> Sie können die Korrektur falscher Daten verlangen</li>
          </ul>
          <p>Kontaktieren Sie uns unter <a href="mailto:privacy@fluxao.com">privacy@fluxao.com</a> für Datenschutzanfragen.</p>
          
          <p style="margin-top: 20px;">
            <strong>FluxAO</strong><br>
            Tech & AI Magazin<br>
            <a href="${baseUrl}/privacy">Datenschutzerklärung</a> | 
            <a href="${baseUrl}/terms">AGB</a> | 
            <a href="${baseUrl}/impressum">Impressum</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  );
}

function createErrorResponse(message: string, status: number) {
  const baseUrl = config.get('BASE_URL');

  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Fehler - FluxAO Newsletter</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
        }
        h1 {
          color: #ef4444;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Fehler</h1>
        <p>${message}</p>
        <div class="buttons">
          <a href="${baseUrl}" class="button">Zur Startseite</a>
          <a href="${baseUrl}/contact" class="button secondary">Kontakt</a>
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