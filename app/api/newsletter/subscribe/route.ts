import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

import { trackNewsletterEvent } from '@/lib/abtest';
import { getSessionId } from '@/lib/analytics';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// Initialize Resend (optional for development)
const resendApiKey = config.get('RESEND_API_KEY');
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  source: z.string().optional(), // A/B test source
  variant: z.string().optional(), // A/B test variant
  language: z.string().default('de'),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'Zustimmung zur Datenverarbeitung ist erforderlich',
  }),
  marketingConsent: z.boolean().default(false),
  consentText: z.string().optional(), // The consent text shown to user
  consentVersion: z.string().optional(), // Privacy policy version
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      source, 
      variant, 
      language,
      consentGiven,
      marketingConsent,
      consentText,
      consentVersion
    } = subscribeSchema.parse(body);
    const sessionId = getSessionId(request);
    
    // Get IP address and User Agent for GDPR compliance
    const clientIp = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Hash IP for privacy
    const crypto = require('crypto');
    const hashedIp = crypto.createHash('sha256').update(clientIp).digest('hex');

    // Check if email already exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      if (existingSubscriber.status === 'verified') {
        return NextResponse.json(
          {
            error: 'Diese E-Mail-Adresse ist bereits für den Newsletter angemeldet.',
            code: 'ALREADY_SUBSCRIBED',
          },
          { status: 409 },
        );
      }

      if (existingSubscriber.status === 'pending') {
        // Resend verification email
        await sendVerificationEmail(
          existingSubscriber.email, 
          existingSubscriber.token, 
          firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : undefined
        );
        return NextResponse.json({
          message: 'Bestätigungs-E-Mail wurde erneut gesendet.',
          email: existingSubscriber.email,
        });
      }
    }

    // Create new subscriber with GDPR compliance
    const token = nanoid(32);
    const unsubscribeToken = nanoid(32);
    
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {
        token,
        status: 'pending',
        firstName,
        lastName,
        language,
        ipAddress: hashedIp,
        userAgent,
        consentGiven,
        consentDate: new Date(),
        source: source || 'website',
        unsubscribeToken,
        createdAt: new Date(),
        verifiedAt: null,
      },
      create: {
        email,
        token,
        unsubscribeToken,
        status: 'pending',
        firstName,
        lastName,
        language,
        ipAddress: hashedIp,
        userAgent,
        consentGiven,
        consentDate: new Date(),
        source: source || 'website',
      },
    });

    // Log consent for GDPR compliance
    await prisma.newsletterConsent.create({
      data: {
        subscriberId: subscriber.id,
        consentType: 'SIGNUP',
        consentGiven: true,
        consentMethod: 'web_form',
        ipAddress: hashedIp,
        userAgent,
        legalBasis: 'consent',
        consentText,
        consentVersion,
      },
    });

    // Log marketing consent if given
    if (marketingConsent) {
      await prisma.newsletterConsent.create({
        data: {
          subscriberId: subscriber.id,
          consentType: 'MARKETING',
          consentGiven: true,
          consentMethod: 'web_form',
          ipAddress: hashedIp,
          userAgent,
          legalBasis: 'consent',
          consentText,
          consentVersion,
        },
      });
    }

    // Send verification email
    const displayName = firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : undefined;
    await sendVerificationEmail(email, token, displayName);

    // Track newsletter signup for A/B testing
    if (source && variant) {
      await trackNewsletterEvent('signup', sessionId, variant, {
        source,
        email: email.substring(0, 3) + '***', // Anonymized for privacy
      });
    }

    logger.info(
      {
        email: subscriber.email,
        id: subscriber.id,
        source,
        variant,
      },
      'Newsletter subscription created',
    );

    return NextResponse.json({
      message: 'Bestätigungs-E-Mail wurde gesendet. Bitte überprüfen Sie Ihr Postfach.',
      email: subscriber.email,
    });
  } catch (error) {
    logger.error({ error }, 'Newsletter subscription error');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
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
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 },
    );
  }
}

async function sendVerificationEmail(email: string, token: string, name?: string) {
  const baseUrl = config.get('BASE_URL');
  const verificationUrl = `${baseUrl}/api/newsletter/verify?token=${token}`;

  if (config.isDevelopment()) {
    // Mock email sending in development
    logger.info(
      {
        to: email,
        subject: 'FluxAO Newsletter - E-Mail bestätigen',
        verificationUrl,
      },
      'Mock email sent',
    );
    return;
  }

  try {
    await resend.emails.send({
      from: 'FluxAO <newsletter@fluxao.com>',
      to: [email],
      subject: 'FluxAO Newsletter - E-Mail bestätigen',
      html: getVerificationEmailTemplate(verificationUrl, name || 'Newsletter-Abonnent'),
    });

    logger.info({ email }, 'Verification email sent');
  } catch (error) {
    logger.error({ email, error }, 'Failed to send verification email');
    throw new Error('Fehler beim Senden der Bestätigungs-E-Mail');
  }
}

function getVerificationEmailTemplate(verificationUrl: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>E-Mail bestätigen - FluxAO Newsletter</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
        .link {
          word-break: break-all;
          color: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FluxAO</div>
          <h1>E-Mail-Adresse bestätigen</h1>
        </div>
        
        <p>Hallo ${name},</p>
        
        <p>vielen Dank für Ihr Interesse an unserem Newsletter! Um Ihre Anmeldung abzuschließen, bestätigen Sie bitte Ihre E-Mail-Adresse.</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">E-Mail bestätigen</a>
        </div>
        
        <p>Falls der Button nicht funktioniert, können Sie auch diesen Link in Ihren Browser kopieren:</p>
        <p class="link">${verificationUrl}</p>
        
        <p>Nach der Bestätigung erhalten Sie regelmäßig unsere neuesten Artikel zu KI, Technologie und Innovation.</p>
        
        <div class="footer">
          <p>Falls Sie sich nicht für unseren Newsletter angemeldet haben, können Sie diese E-Mail ignorieren.</p>
          <p><strong>FluxAO</strong> - Tech & AI Magazin</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// GET endpoint to check subscription status (optional)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'E-Mail-Parameter erforderlich' }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: {
        status: true,
        createdAt: true,
        verifiedAt: true,
      },
    });

    if (!subscriber) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
      status: subscriber.status,
      subscribedAt: subscriber.createdAt,
      verifiedAt: subscriber.verifiedAt,
    });
  } catch (error) {
    logger.error({ error }, 'Error checking subscription status');
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Abonnement-Status' },
      { status: 500 },
    );
  }
}
