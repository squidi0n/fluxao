import { formatNewsletterHtml, formatNewsletterText } from '@/lib/ai/newsletter';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface EmailProvider {
  name: string;
  sendNewsletter: (params: SendNewsletterParams) => Promise<SendResult>;
}

export interface SendNewsletterParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  unsubscribeUrl: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Mock email provider for development
class MockEmailProvider implements EmailProvider {
  name = 'mock';

  async sendNewsletter(params: SendNewsletterParams): Promise<SendResult> {
    logger.info(
      {
        provider: this.name,
        to: params.to,
        subject: params.subject,
      },
      'Mock email sent',
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// Resend email provider
class ResendProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendNewsletter(params: SendNewsletterParams): Promise<SendResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@example.com',
          to: [params.to],
          subject: params.subject,
          html: params.htmlContent,
          text: params.textContent,
          headers: {
            'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      logger.error({ error, provider: this.name }, 'Failed to send newsletter');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Mailchimp provider (simplified)
class MailchimpProvider implements EmailProvider {
  name = 'mailchimp';
  private apiKey: string;
  private listId: string;

  constructor(apiKey: string, listId: string) {
    this.apiKey = apiKey;
    this.listId = listId;
  }

  async sendNewsletter(params: SendNewsletterParams): Promise<SendResult> {
    try {
      const server = this.apiKey.split('-')[1];
      const baseUrl = `https://${server}.api.mailchimp.com/3.0`;

      // Create campaign
      const campaignResponse = await fetch(`${baseUrl}/campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'regular',
          recipients: {
            list_id: this.listId,
          },
          settings: {
            subject_line: params.subject,
            from_name: process.env.NEWSLETTER_FROM_NAME || 'FluxAO',
            reply_to: process.env.NEWSLETTER_REPLY_TO || 'newsletter@example.com',
          },
        }),
      });

      if (!campaignResponse.ok) {
        const error = await campaignResponse.json();
        throw new Error(error.detail || 'Failed to create campaign');
      }

      const campaign = await campaignResponse.json();

      // Set campaign content
      await fetch(`${baseUrl}/campaigns/${campaign.id}/content`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: params.htmlContent,
          plain_text: params.textContent,
        }),
      });

      // Send campaign
      const sendResponse = await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!sendResponse.ok) {
        const error = await sendResponse.json();
        throw new Error(error.detail || 'Failed to send campaign');
      }

      return {
        success: true,
        messageId: campaign.id,
      };
    } catch (error) {
      logger.error({ error, provider: this.name }, 'Failed to send newsletter');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Provider factory
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'mock';

  switch (provider) {
    case 'resend':
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        throw new Error('RESEND_API_KEY environment variable is required');
      }
      return new ResendProvider(resendKey);

    case 'mailchimp':
      const mailchimpKey = process.env.MAILCHIMP_API_KEY;
      const listId = process.env.MAILCHIMP_LIST_ID;
      if (!mailchimpKey || !listId) {
        throw new Error(
          'MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID environment variables are required',
        );
      }
      return new MailchimpProvider(mailchimpKey, listId);

    case 'mock':
    default:
      return new MockEmailProvider();
  }
}

// Export draft to newsletter issue
export async function exportDraftToIssue(draftId: string): Promise<string> {
  const draft = await prisma.newsletterDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  // Parse topics from JSON
  const topics = Array.isArray(draft.topics) ? draft.topics : [];

  const draftContent = {
    subject: draft.subject,
    intro: draft.intro,
    topics,
    cta: draft.cta || undefined,
  };

  // Format content
  const htmlContent = formatNewsletterHtml(draftContent);
  const textContent = formatNewsletterText(draftContent);

  // Create newsletter issue
  const issue = await prisma.newsletterIssue.create({
    data: {
      subject: draft.subject,
      body: htmlContent,
      status: 'draft',
    },
  });

  // Update draft
  await prisma.newsletterDraft.update({
    where: { id: draftId },
    data: {
      status: 'published',
      publishedIssueId: issue.id,
    },
  });

  return issue.id;
}

// Send newsletter job
export async function sendNewsletterJob(jobId: string): Promise<boolean> {
  const job = await prisma.newsletterJob.findUnique({
    where: { id: jobId },
    include: {
      issue: true,
      subscriber: true,
    },
  });

  if (!job || !job.issue || !job.subscriber) {
    logger.error({ jobId }, 'Newsletter job not found or missing relations');
    return false;
  }

  const provider = getEmailProvider();

  try {
    // Generate unsubscribe URL
    const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/newsletter/unsubscribe?token=${job.subscriber.token}`;

    const result = await provider.sendNewsletter({
      to: job.subscriber.email,
      subject: job.issue.subject,
      htmlContent: job.issue.body,
      textContent: job.issue.body, // Simplified - should parse HTML to text
      unsubscribeUrl,
    });

    // Update job status
    await prisma.newsletterJob.update({
      where: { id: jobId },
      data: {
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        processedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    if (result.success) {
      logger.info(
        {
          jobId,
          subscriberEmail: job.subscriber.email,
          messageId: result.messageId,
        },
        'Newsletter sent successfully',
      );
    }

    return result.success;
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to send newsletter');

    await prisma.newsletterJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    return false;
  }
}

// Batch send newsletters
export async function processPendingNewsletterJobs(batchSize = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const jobs = await prisma.newsletterJob.findMany({
    where: {
      status: 'pending',
      attempts: { lt: 3 }, // Max 3 attempts
    },
    take: batchSize,
    orderBy: { createdAt: 'asc' },
  });

  let successful = 0;
  let failed = 0;

  for (const job of jobs) {
    const success = await sendNewsletterJob(job.id);
    if (success) {
      successful++;
    } else {
      failed++;
    }
  }

  logger.info(
    {
      processed: jobs.length,
      successful,
      failed,
    },
    'Processed newsletter jobs',
  );

  return {
    processed: jobs.length,
    successful,
    failed,
  };
}
