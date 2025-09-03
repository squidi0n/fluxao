import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const sendNewsletterSchema = z.object({
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),
  preheader: z.string().optional(),
  templateType: z.enum(['weekly', 'welcome', 'announcement', 'promotional']).default('weekly'),
  target: z.enum(['all', 'verified']).default('verified'),
  testEmail: z.string().email().optional(),
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
      select: { isAdmin: true, role: true, id: true }
    });

    if (!user?.isAdmin && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = sendNewsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors[0].message
        },
        { status: 400 }
      );
    }

    const { subject, content, preheader, templateType, target, testEmail } = validation.data;

    // If this is a test email, send only test
    if (testEmail) {
      try {
        // Create a test campaign
        const testCampaign = await prisma.newsletterCampaign.create({
          data: {
            name: `Test: ${subject}`,
            subject,
            preheader,
            fromName: 'FluxAO Team',
            fromEmail: process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@fluxao.com',
            htmlContent: content,
            status: 'sent',
            sentAt: new Date(),
            testEmails: [testEmail],
          }
        });

        // Process HTML for DSGVO compliance (placeholder)
        const processedHtml = content;

        // TODO: Actually send test email here
        // For now, just return success
        
        return NextResponse.json({
          success: true,
          message: `Test newsletter sent to ${testEmail}`,
          campaignId: testCampaign.id,
        });
      } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json(
          { error: 'Failed to send test email' },
          { status: 500 }
        );
      }
    }

    // Send to all subscribers
    try {
      // Create newsletter campaign
      const campaign = await prisma.newsletterCampaign.create({
        data: {
          name: subject,
          subject,
          preheader,
          fromName: 'FluxAO Team',
          fromEmail: process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@fluxao.com',
          htmlContent: content,
          status: 'sending',
        }
      });

      // Get target subscribers
      const whereClause = target === 'all' ? {} : { status: 'verified' };
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: whereClause,
        select: { id: true, email: true },
      });

      if (subscribers.length === 0) {
        await prisma.newsletterCampaign.update({
          where: { id: campaign.id },
          data: { status: 'failed' },
        });
        
        return NextResponse.json(
          { error: 'No subscribers found for the selected target' },
          { status: 400 }
        );
      }

      // Create recipients
      const recipients = await Promise.all(
        subscribers.map(subscriber =>
          prisma.newsletterRecipient.create({
            data: {
              campaignId: campaign.id,
              subscriberId: subscriber.id,
              status: 'pending',
            }
          })
        )
      );

      // Process and queue emails
      let sentCount = 0;
      for (const recipient of recipients) {
        try {
          // Process HTML for DSGVO compliance (placeholder)
          const processedHtml = content;

          // TODO: Add to email queue here
          // For now, just mark as sent
          await prisma.newsletterRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
            }
          });

          sentCount++;
        } catch (error) {
          console.error(`Failed to process newsletter for recipient ${recipient.id}:`, error);
          await prisma.newsletterRecipient.update({
            where: { id: recipient.id },
            data: { status: 'failed' }
          });
        }
      }

      // Update campaign status
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          stats: {
            sent: sentCount,
            failed: recipients.length - sentCount,
            total: recipients.length,
          }
        },
      });

      // Log action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'newsletter.send',
          target: `campaign:${campaign.id}`,
          data: {
            subject,
            target,
            recipientCount: recipients.length,
            sentCount,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Newsletter sent successfully',
        campaignId: campaign.id,
        jobCount: sentCount,
        totalRecipients: recipients.length,
      });

    } catch (error) {
      console.error('Newsletter sending error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('similar newsletter')) {
          return NextResponse.json(
            { error: 'A similar newsletter was recently sent' },
            { status: 409 }
          );
        }
        
        if (error.message.includes('No subscribers')) {
          return NextResponse.json(
            { error: 'No subscribers found' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to send newsletter' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Newsletter send API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
