import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const verifySchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return createErrorResponse('Token nicht gefunden', 400);
    }

    const { token: validatedToken } = verifySchema.parse({ token });

    // Find subscriber by token
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { token: validatedToken },
    });

    if (!subscriber) {
      return createErrorResponse('Ungültiger oder abgelaufener Token', 404);
    }

    if (subscriber.status === 'verified') {
      // Already verified, redirect to success page
      return createSuccessResponse(
        'E-Mail-Adresse bereits bestätigt',
        'Diese E-Mail-Adresse wurde bereits erfolgreich bestätigt.',
        subscriber.email,
      );
    }

    // Update subscriber status
    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
      },
    });

    logger.info(
      {
        email: updatedSubscriber.email,
        id: updatedSubscriber.id,
      },
      'Newsletter subscription verified',
    );

    // Return success response
    return createSuccessResponse(
      'E-Mail bestätigt!',
      'Vielen Dank! Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie erhalten ab sofort unseren Newsletter.',
      updatedSubscriber.email,
    );
  } catch (error) {
    logger.error({ error }, 'Newsletter verification error');

    if (error instanceof z.ZodError) {
      return createErrorResponse('Ungültige Anfrage', 400);
    }

    return createErrorResponse('Ein unerwarteter Fehler ist aufgetreten', 500);
  }
}

// POST endpoint for programmatic verification (optional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verifySchema.parse(body);

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { token },
    });

    if (!subscriber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültiger oder abgelaufener Token',
          code: 'INVALID_TOKEN',
        },
        { status: 404 },
      );
    }

    if (subscriber.status === 'verified') {
      return NextResponse.json({
        success: true,
        message: 'E-Mail-Adresse bereits bestätigt',
        email: subscriber.email,
        verifiedAt: subscriber.verifiedAt,
      });
    }

    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
      },
    });

    logger.info(
      {
        email: updatedSubscriber.email,
        id: updatedSubscriber.id,
      },
      'Newsletter subscription verified via POST',
    );

    return NextResponse.json({
      success: true,
      message: 'E-Mail-Adresse erfolgreich bestätigt',
      email: updatedSubscriber.email,
      verifiedAt: updatedSubscriber.verifiedAt,
    });
  } catch (error) {
    logger.error({ error }, 'Newsletter verification POST error');

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

function createSuccessResponse(title: string, message: string, email: string) {
  const baseUrl = config.get('BASE_URL');

  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title} - FluxAO</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
        }
        h1 {
          color: #10b981;
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
        <div class="icon">✅</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="email">${email}</div>
        <div class="buttons">
          <a href="${baseUrl}" class="button">Zur Startseite</a>
          <a href="${baseUrl}/blog" class="button secondary">Blog besuchen</a>
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
      <title>Fehler - FluxAO</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
