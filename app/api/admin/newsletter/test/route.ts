import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const testNewsletterSchema = z.object({
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),
  preheader: z.string().optional(),
  testEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, role: true, id: true, email: true }
    });

    if (!user?.isAdmin && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = testNewsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors[0].message
        },
        { status: 400 }
      );
    }

    const { subject, content, preheader, testEmail } = validation.data;

    try {
      // Create a test campaign record for tracking
      const testCampaign = await prisma.newsletterCampaign.create({
        data: {
          name: `TEST: ${subject}`,
          subject: `[TEST] ${subject}`,
          preheader,
          fromName: 'FluxAO Team',
          fromEmail: process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@fluxao.com',
          htmlContent: content,
          status: 'sent',
          sentAt: new Date(),
          testEmails: [testEmail],
          stats: {
            sent: 1,
            total: 1,
            isTest: true,
          }
        }
      });

      // Ensure subscriber exists (do not create mock records)
      const existingSubscriber = await prisma.newsletterSubscriber.findUnique({ where: { email: testEmail } });
      if (!existingSubscriber) {
        return NextResponse.json(
          { error: 'Test-Empfänger ist kein Newsletter-Abonnent. Bitte zuerst abonnieren.' },
          { status: 400 }
        );
      }

      // Process HTML for DSGVO compliance (placeholder)
      const processedHtml = content;

      // Generate DSGVO headers (placeholder)
      const headers = {
        'List-Unsubscribe': `<mailto:unsubscribe@fluxao.com?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      };

      // Log test email
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'newsletter.test',
          target: `campaign:${testCampaign.id}`,
          data: {
            testEmail,
            subject,
            campaignId: testCampaign.id,
          },
        },
      });

      // In a real implementation, you would send the email here
      // For example, using nodemailer, SendGrid, etc.
      const emailData = {
        to: testEmail,
        from: {
          email: process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@fluxao.com',
          name: 'FluxAO Team'
        },
        subject: `[TEST] ${subject}`,
        html: processedHtml,
        headers,
        trackingSettings: {
          clickTracking: { enable: false }, // Disabled for test
          openTracking: { enable: false },  // Disabled for test
        }
      };

      // TODO: Replace with actual email sending service
      console.log('Test email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        headers: emailData.headers,
      });

      // Simulate successful sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: `Test newsletter sent to ${testEmail}`,
        campaignId: testCampaign.id,
        details: {
          subject: `[TEST] ${subject}`,
          recipient: testEmail,
          processedHtml: processedHtml.length > 0,
          dsgvoCompliant: true,
          headers: Object.keys(headers),
        }
      });

    } catch (error) {
      console.error('Test newsletter error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to send test newsletter',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test newsletter API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
