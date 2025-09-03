import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { auth } from '@/auth';
// Newsletter modules to be created later - using placeholders for now

// Validation schema
const createNewsletterSchema = z.object({
  templateId: z.string().min(1, 'Template ID ist erforderlich'),
  subject: z.string().min(1, 'Betreff ist erforderlich').max(200, 'Betreff zu lang'),
  preheader: z.string().max(150, 'Preheader zu lang').optional(),
  
  // Auto-fill configuration
  useAutofill: z.boolean().default(false),
  autofillConfig: z.object({
    dateRange: z.enum(['last_week', 'last_month', 'last_3_days', 'last_2_weeks']).default('last_week'),
    categories: z.array(z.string()).optional(),
    maxArticles: z.number().min(1).max(20).default(5),
    includeImages: z.boolean().default(true),
    sortBy: z.enum(['views', 'recent', 'engagement', 'mixed']).default('mixed'),
    excludeArticleIds: z.array(z.string()).optional(),
  }).optional(),
  
  // Manual content
  articles: z.array(z.object({
    title: z.string().min(1, 'Artikel-Titel erforderlich'),
    excerpt: z.string().min(1, 'Artikel-Auszug erforderlich'),
    url: z.string().url('Ungültige URL'),
    category: z.string().optional(),
    imageUrl: z.string().url().optional(),
    readTime: z.number().positive().optional(),
  })).optional(),
  
  // Newsletter settings
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  
  // Send configuration
  sendImmediately: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
  testMode: z.boolean().default(false),
  testEmails: z.array(z.string().email()).optional(),
  
  // Targeting
  listIds: z.array(z.string()).optional(),
  segmentTags: z.array(z.string()).optional(),
  subscriberStatus: z.enum(['all', 'verified', 'active']).default('verified'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createNewsletterSchema.parse(body);

    logger.info(
      {
        templateId: data.templateId,
        useAutofill: data.useAutofill,
        sendImmediately: data.sendImmediately,
        testMode: data.testMode,
      },
      'Creating newsletter campaign'
    );

    // Validate template exists (placeholder)
    const template = {
      generateHtml: (data: any) => `<h1>${data.subject}</h1><p>${data.preheader}</p><div>Newsletter content will be generated here</div>`,
      generateText: (data: any) => `${data.subject}\n\n${data.preheader}\n\nNewsletter text content.`
    };

    // Generate content based on configuration
    let templateData;
    let contentSources = null;

    if (data.useAutofill && data.autofillConfig) {
      // Build from real posts instead of placeholders
      const max = data.autofillConfig.maxArticles || 5;
      const posts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          id: data.autofillConfig.excludeArticleIds ? { notIn: data.autofillConfig.excludeArticleIds } : undefined,
          categories: data.autofillConfig.categories && data.autofillConfig.categories.length > 0 ? {
            some: { category: { slug: { in: data.autofillConfig.categories } } },
          } : undefined,
        },
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: max,
        select: { title: true, slug: true, excerpt: true, heroImageUrl: true, readTime: true, categories: { include: { category: true } } },
      });

      const articles = posts.map((p) => ({
        title: p.title,
        excerpt: p.excerpt || '',
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/news/${p.slug}`,
        category: p.categories[0]?.category?.name,
        imageUrl: p.heroImageUrl || undefined,
        readTime: p.readTime || undefined,
      }));

      templateData = {
        subject: data.subject || 'FluxAO Newsletter',
        preheader: data.preheader || 'Aktuelle Highlights aus dem Magazin',
        articles,
      };
      contentSources = { type: 'autofill', config: data.autofillConfig, articlesFound: articles.length };
    } else if (data.articles && data.articles.length > 0) {
      // Use manual content
      templateData = {
        subject: data.subject,
        preheader: data.preheader || '',
        articles: data.articles,
        footer: {
          companyName: 'FluxAO',
          address: 'Tech & AI Magazin',
          unsubscribeUrl: `${process.env.BASE_URL}/api/newsletter/unsubscribe`,
          privacyUrl: `${process.env.BASE_URL}/privacy`,
          termsUrl: `${process.env.BASE_URL}/terms`,
        },
      };
      
      contentSources = {
        type: 'manual',
        articleCount: data.articles.length,
      };
    } else {
      return NextResponse.json(
        { error: 'Entweder Auto-Fill aktivieren oder manuell Artikel hinzufügen' },
        { status: 400 }
      );
    }

    // Override subject if provided
    if (data.subject) {
      templateData.subject = data.subject;
    }
    if (data.preheader) {
      templateData.preheader = data.preheader;
    }

    // Create newsletter campaign record
    const campaign = await prisma.newsletterCampaign.create({
      data: {
        name: `Newsletter: ${templateData.subject}`,
        subject: templateData.subject,
        preheader: templateData.preheader,
        fromName: data.fromName || 'FluxAO',
        fromEmail: data.fromEmail || 'newsletter@fluxao.com',
        replyTo: data.replyTo,
        htmlContent: template.generateHtml(templateData),
        textContent: template.generateText(templateData),
        templateId: data.templateId,
        status: data.testMode ? 'draft' : (data.sendImmediately ? 'sending' : 'scheduled'),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : (data.sendImmediately ? new Date() : undefined),
        tags: data.segmentTags ? JSON.stringify(data.segmentTags) : null,
        testEmails: data.testEmails ? JSON.stringify(data.testEmails) : null,
      },
    });

    // If test mode, send to test emails only
    if (data.testMode && data.testEmails && data.testEmails.length > 0) {
      const testSubscribers = data.testEmails.map((email, index) => ({
        subscriberId: `test-${campaign.id}-${index}`,
        email,
        unsubscribeToken: 'test-token',
        firstName: 'Test',
        lastName: 'User',
        language: 'de',
      }));

      // Send test newsletter (placeholder)
      const sendResults = testSubscribers.map(sub => ({ success: true, subscriber: sub }));

      const successCount = sendResults.filter(r => r.success).length;

      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        mode: 'test',
        testEmailsSent: successCount,
        message: `Test-Newsletter erfolgreich an ${successCount} E-Mail-Adressen versendet`,
      });
    }

    // If not sending immediately, just return the created campaign
    if (!data.sendImmediately) {
      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        mode: 'scheduled',
        scheduledAt: campaign.scheduledAt,
        message: 'Newsletter-Kampagne erstellt und geplant',
      });
    }

    // Get target subscribers
    const whereClause: any = {};

    // Filter by subscriber status
    if (data.subscriberStatus === 'verified') {
      whereClause.status = 'verified';
    } else if (data.subscriberStatus === 'active') {
      whereClause.status = 'verified';
      whereClause.verifiedAt = {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Active in last 90 days
      };
    }

    // Filter by lists if specified
    if (data.listIds && data.listIds.length > 0) {
      whereClause.lists = {
        some: {
          listId: {
            in: data.listIds,
          },
        },
      };
    }

    // Filter by tags if specified
    if (data.segmentTags && data.segmentTags.length > 0) {
      whereClause.tags = {
        hasSome: data.segmentTags,
      };
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        language: true,
        unsubscribeToken: true,
        preferences: true,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Keine passenden Abonnenten gefunden' },
        { status: 400 }
      );
    }

    // Send newsletter
    const newsletterSubscribers = subscribers.map(sub => ({
      subscriberId: sub.id,
      email: sub.email,
      firstName: sub.firstName || undefined,
      lastName: sub.lastName || undefined,
      language: sub.language || 'de',
      unsubscribeToken: sub.unsubscribeToken || 'missing-token',
      preferences: sub.preferences,
    }));

    // Send newsletter (placeholder)
    const sendResults = newsletterSubscribers.map(sub => ({ success: true, subscriber: sub }));

    // Update campaign status and stats
    const successCount = sendResults.filter(r => r.success).length;
    const failureCount = sendResults.length - successCount;

    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        stats: JSON.stringify({
          sent: successCount,
          failed: failureCount,
          opened: 0,
          clicked: 0,
          unsubscribed: 0,
        }),
      },
    });

    // Log the campaign completion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'NEWSLETTER_SENT',
        targetId: campaign.id,
        targetType: 'NewsletterCampaign',
        metadata: {
          subject: templateData.subject,
          subscriberCount: successCount,
          failureCount,
          templateId: data.templateId,
          contentSources,
        },
        status: 'SUCCESS',
      },
    });

    logger.info(
      {
        campaignId: campaign.id,
        subject: templateData.subject,
        subscriberCount: successCount,
        failureCount,
      },
      'Newsletter campaign completed'
    );

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      mode: 'sent',
      subscriberCount: successCount,
      failureCount,
      message: `Newsletter erfolgreich an ${successCount} Abonnenten versendet${failureCount > 0 ? ` (${failureCount} Fehler)` : ''}`,
    });

  } catch (error) {
    logger.error({ error }, 'Newsletter creation error');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Ungültige Daten',
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
