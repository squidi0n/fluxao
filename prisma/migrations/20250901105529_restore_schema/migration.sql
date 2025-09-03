-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "image" TEXT,
    "location" TEXT,
    "website" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerified" DATETIME,
    "emailVerifiedLegacy" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "trialStartedAt" DATETIME,
    "trialEndsAt" DATETIME,
    "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "newsletterSubscription" BOOLEAN NOT NULL DEFAULT true,
    "commentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "mentionNotifications" BOOLEAN NOT NULL DEFAULT true,
    "securityNotifications" BOOLEAN NOT NULL DEFAULT true,
    "profileVisible" BOOLEAN NOT NULL DEFAULT true,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "allowDirectMessages" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'de',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "contentLanguages" JSONB,
    "interestedTopics" JSONB,
    "hideAds" BOOLEAN NOT NULL DEFAULT false,
    "editorBio" TEXT,
    "editorSpecialties" JSONB,
    "authorPageVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "editor_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "canCreatePosts" BOOLEAN NOT NULL DEFAULT true,
    "canEditPosts" BOOLEAN NOT NULL DEFAULT true,
    "canDeletePosts" BOOLEAN NOT NULL DEFAULT false,
    "canPublishPosts" BOOLEAN NOT NULL DEFAULT false,
    "canManageComments" BOOLEAN NOT NULL DEFAULT false,
    "canUploadMedia" BOOLEAN NOT NULL DEFAULT true,
    "maxPostsPerMonth" INTEGER,
    "maxImagesPerPost" INTEGER NOT NULL DEFAULT 10,
    "maxVideoLength" INTEGER NOT NULL DEFAULT 300,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "grantedBy" TEXT NOT NULL,
    CONSTRAINT "editor_permissions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "editor_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teaser" TEXT,
    "content" TEXT NOT NULL,
    "body" TEXT,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "summary" TEXT,
    "keywords" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isFeaturedInCategory" BOOLEAN NOT NULL DEFAULT false,
    "subcategory" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'TUTORIAL',
    "difficultyLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "estimatedReadTime" INTEGER,
    "authorId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "fluxCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "post_tags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("postId", "tagId"),
    CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "post_categories" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("postId", "categoryId"),
    CONSTRAINT "post_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_categories_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" DATETIME,
    "doubleOptIn" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "preferences" JSONB,
    "tags" JSONB,
    "firstName" TEXT,
    "lastName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'de',
    "unsubscribedAt" DATETIME,
    "unsubscribeToken" TEXT,
    "unsubscribeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "newsletter_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft'
);

-- CreateTable
CREATE TABLE "newsletter_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "newsletter_jobs_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "newsletter_jobs_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "newsletter_issues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_verify_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verify_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "spamScore" REAL,
    "moderatedBy" TEXT,
    "moderatedAt" DATETIME,
    "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
    "moderationReason" TEXT,
    "moderationScore" REAL,
    "aiReviewed" BOOLEAN NOT NULL DEFAULT false,
    "aiReviewedAt" DATETIME,
    "humanFeedback" TEXT,
    "feedbackBy" TEXT,
    "feedbackAt" DATETIME,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "isLike" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletter_drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "subject" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "topics" JSONB NOT NULL,
    "cta" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedIssueId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletter_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "newsletter_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "htmlContent" TEXT NOT NULL,
    "jsonContent" JSONB,
    "category" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletter_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "replyTo" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "templateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "stats" JSONB,
    "tags" JSONB,
    "testEmails" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "newsletter_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "newsletter_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_recipients_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "newsletter_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "newsletter_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletter_list_subscribers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_list_subscribers_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "newsletter_list_subscribers_listId_fkey" FOREIGN KEY ("listId") REFERENCES "newsletter_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_consents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentMethod" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "legalBasis" TEXT,
    "consentText" TEXT,
    "consentVersion" TEXT,
    "withdrawnAt" DATETIME,
    "withdrawReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "newsletter_consents_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT,
    "campaignId" TEXT,
    "interactionType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "linkUrl" TEXT,
    "metadata" JSONB,
    CONSTRAINT "newsletter_interactions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "newsletter_campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "newsletter_interactions_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "newsletter_issues_enhanced" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "templateId" TEXT,
    "autoFilled" BOOLEAN NOT NULL DEFAULT false,
    "contentSources" JSONB,
    "utmSource" TEXT,
    "utmMedium" TEXT NOT NULL DEFAULT 'email',
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "fromName" TEXT NOT NULL DEFAULT 'FluxAO',
    "fromEmail" TEXT NOT NULL DEFAULT 'newsletter@fluxao.com',
    "replyTo" TEXT,
    "listUnsubscribe" TEXT,
    "listUnsubscribePost" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "newsletter_issues_enhanced_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "newsletter_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "properties" JSONB,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentGivenAt" DATETIME NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetMetric" TEXT NOT NULL,
    "trafficAllocation" INTEGER NOT NULL DEFAULT 100,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ab_test_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "config" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ab_test_variants_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ab_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ab_test_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ab_test_assignments_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ab_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ab_test_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ab_test_events_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ab_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversion_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "variant" TEXT,
    "stage" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "userIds" JSONB,
    "conditions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "trialStart" DATETIME,
    "trialEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "hostedInvoiceUrl" TEXT,
    "invoicePdf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_clicks_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "affiliate_links" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ad_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "adCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ad_impressions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_impressions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ad_slots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "premium_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredPlan" TEXT NOT NULL,
    "previewLength" INTEGER NOT NULL DEFAULT 300,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "subscribers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "premium_content_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revenue_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "metadata" JSONB,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "attachments" JSONB,
    "metadata" JSONB,
    "lastResponseAt" DATETIME,
    "resolvedAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "support_ticket_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_ticket_responses_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "flux" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "postId"),
    CONSTRAINT "flux_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flux_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "article_votes" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "postId"),
    CONSTRAINT "article_votes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "article_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "lastDepth" INTEGER NOT NULL DEFAULT 0,
    "lastAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reading_history_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "post_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "fluxTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_scores_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUsed" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "thumbnailUrl" TEXT,
    "metadata" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "media_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "saved_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "post_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgReadTime" REAL NOT NULL DEFAULT 0,
    "bounceRate" REAL NOT NULL DEFAULT 0,
    "scrollDepth" REAL NOT NULL DEFAULT 0,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "post_analytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT,
    "postAnalyticsId" TEXT,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "activityType" TEXT NOT NULL,
    "timeOnPage" INTEGER,
    "scrollPercentage" INTEGER,
    "clickData" JSONB,
    "exitPage" BOOLEAN NOT NULL DEFAULT false,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "country" TEXT,
    "deviceType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "browserName" TEXT,
    "osName" TEXT,
    "screenResolution" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_activities_postAnalyticsId_fkey" FOREIGN KEY ("postAnalyticsId") REFERENCES "post_analytics" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_activities_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "firstPage" TEXT,
    "lastPage" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "deviceType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "browserName" TEXT,
    "osName" TEXT,
    "country" TEXT,
    "ipHash" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "session_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trending_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "trendingScore" REAL NOT NULL DEFAULT 0,
    "timeframe" TEXT NOT NULL,
    "views24h" INTEGER NOT NULL DEFAULT 0,
    "views7d" INTEGER NOT NULL DEFAULT 0,
    "views30d" INTEGER NOT NULL DEFAULT 0,
    "engagements24h" INTEGER NOT NULL DEFAULT 0,
    "engagements7d" INTEGER NOT NULL DEFAULT 0,
    "engagements30d" INTEGER NOT NULL DEFAULT 0,
    "peakHour" INTEGER,
    "isCurrentlyTrending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "trending_articles_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "profession" TEXT,
    "year" INTEGER,
    "source" TEXT,
    "category" TEXT NOT NULL DEFAULT 'TECHNOLOGY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "quotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_task_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "task" TEXT NOT NULL,
    "prompt" TEXT,
    "response" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_task_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "severity" INTEGER NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "apiKey" TEXT,
    "endpoint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxTokens" INTEGER NOT NULL DEFAULT 4000,
    "costPerToken" REAL,
    "rateLimit" INTEGER NOT NULL DEFAULT 60,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "capabilities" JSONB,
    "config" JSONB,
    "lastCheck" DATETIME,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_automation_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "provider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "tokens" INTEGER,
    "cost" REAL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ai_chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_usage_quotas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 2000,
    "tokenLimit" INTEGER NOT NULL DEFAULT 50000,
    "dailyUsed" INTEGER NOT NULL DEFAULT 0,
    "monthlyUsed" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetDaily" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastResetMonthly" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_usage_quotas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "canUseAI" BOOLEAN NOT NULL DEFAULT false,
    "canUseWriter" BOOLEAN NOT NULL DEFAULT false,
    "canUseMultiProvider" BOOLEAN NOT NULL DEFAULT false,
    "canViewMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "canManageRules" BOOLEAN NOT NULL DEFAULT false,
    "allowedProviders" JSONB,
    "maxDailyRequests" INTEGER NOT NULL DEFAULT 50,
    "maxTokensPerDay" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "description" TEXT,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "userId" TEXT,
    "role" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "sourceId" TEXT,
    "sourceType" TEXT,
    "data" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generatedBy" TEXT,
    "scheduledFor" DATETIME,
    "expiresAt" DATETIME,
    "clickedAt" DATETIME,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailAITasks" BOOLEAN NOT NULL DEFAULT true,
    "emailSystemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailContentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailPerformanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "showAITasks" BOOLEAN NOT NULL DEFAULT true,
    "showSystemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "showContentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "showPerformanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "showSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trend_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "teaser" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "uniqueHash" TEXT NOT NULL,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_followersCount_idx" ON "users"("followersCount");

-- CreateIndex
CREATE INDEX "users_trialEndsAt_idx" ON "users"("trialEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "user_settings_userId_idx" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "editor_permissions_userId_idx" ON "editor_permissions"("userId");

-- CreateIndex
CREATE INDEX "editor_permissions_categoryId_idx" ON "editor_permissions"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "editor_permissions_userId_categoryId_key" ON "editor_permissions"("userId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_slug_idx" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_status_publishedAt_idx" ON "posts"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "posts_title_idx" ON "posts"("title");

-- CreateIndex
CREATE INDEX "posts_contentType_idx" ON "posts"("contentType");

-- CreateIndex
CREATE INDEX "posts_difficultyLevel_idx" ON "posts"("difficultyLevel");

-- CreateIndex
CREATE INDEX "posts_subcategory_idx" ON "posts"("subcategory");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_token_key" ON "newsletter_subscribers"("token");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "newsletter_subscribers"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_token_idx" ON "newsletter_subscribers"("token");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers"("status");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_unsubscribeToken_idx" ON "newsletter_subscribers"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_verifiedAt_idx" ON "newsletter_subscribers"("verifiedAt");

-- CreateIndex
CREATE INDEX "newsletter_issues_status_idx" ON "newsletter_issues"("status");

-- CreateIndex
CREATE INDEX "newsletter_issues_createdAt_idx" ON "newsletter_issues"("createdAt");

-- CreateIndex
CREATE INDEX "newsletter_jobs_status_idx" ON "newsletter_jobs"("status");

-- CreateIndex
CREATE INDEX "newsletter_jobs_issueId_idx" ON "newsletter_jobs"("issueId");

-- CreateIndex
CREATE INDEX "newsletter_jobs_subscriberId_idx" ON "newsletter_jobs"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_jobs_issueId_subscriberId_key" ON "newsletter_jobs"("issueId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verify_tokens_token_key" ON "email_verify_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verify_tokens_token_idx" ON "email_verify_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verify_tokens_userId_idx" ON "email_verify_tokens"("userId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "comments_status_idx" ON "comments"("status");

-- CreateIndex
CREATE INDEX "comments_moderationStatus_idx" ON "comments"("moderationStatus");

-- CreateIndex
CREATE INDEX "comments_aiReviewed_idx" ON "comments"("aiReviewed");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE INDEX "comment_likes_userId_idx" ON "comment_likes"("userId");

-- CreateIndex
CREATE INDEX "comment_likes_sessionId_idx" ON "comment_likes"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "comment_likes"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_sessionId_key" ON "comment_likes"("commentId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_month_key" ON "ai_usage"("month");

-- CreateIndex
CREATE INDEX "ai_usage_month_idx" ON "ai_usage"("month");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_drafts_publishedIssueId_key" ON "newsletter_drafts"("publishedIssueId");

-- CreateIndex
CREATE INDEX "newsletter_drafts_status_date_idx" ON "newsletter_drafts"("status", "date");

-- CreateIndex
CREATE INDEX "newsletter_sources_type_used_idx" ON "newsletter_sources"("type", "used");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_templates_slug_key" ON "newsletter_templates"("slug");

-- CreateIndex
CREATE INDEX "newsletter_templates_category_idx" ON "newsletter_templates"("category");

-- CreateIndex
CREATE INDEX "newsletter_campaigns_status_scheduledAt_idx" ON "newsletter_campaigns"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "newsletter_recipients_status_idx" ON "newsletter_recipients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_recipients_campaignId_subscriberId_key" ON "newsletter_recipients"("campaignId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_list_subscribers_listId_subscriberId_key" ON "newsletter_list_subscribers"("listId", "subscriberId");

-- CreateIndex
CREATE INDEX "newsletter_consents_subscriberId_idx" ON "newsletter_consents"("subscriberId");

-- CreateIndex
CREATE INDEX "newsletter_consents_consentType_idx" ON "newsletter_consents"("consentType");

-- CreateIndex
CREATE INDEX "newsletter_consents_consentGiven_idx" ON "newsletter_consents"("consentGiven");

-- CreateIndex
CREATE INDEX "newsletter_consents_createdAt_idx" ON "newsletter_consents"("createdAt");

-- CreateIndex
CREATE INDEX "newsletter_interactions_subscriberId_idx" ON "newsletter_interactions"("subscriberId");

-- CreateIndex
CREATE INDEX "newsletter_interactions_campaignId_idx" ON "newsletter_interactions"("campaignId");

-- CreateIndex
CREATE INDEX "newsletter_interactions_interactionType_idx" ON "newsletter_interactions"("interactionType");

-- CreateIndex
CREATE INDEX "newsletter_interactions_timestamp_idx" ON "newsletter_interactions"("timestamp");

-- CreateIndex
CREATE INDEX "newsletter_issues_enhanced_status_idx" ON "newsletter_issues_enhanced"("status");

-- CreateIndex
CREATE INDEX "newsletter_issues_enhanced_scheduledAt_idx" ON "newsletter_issues_enhanced"("scheduledAt");

-- CreateIndex
CREATE INDEX "newsletter_issues_enhanced_sentAt_idx" ON "newsletter_issues_enhanced"("sentAt");

-- CreateIndex
CREATE INDEX "analytics_events_type_createdAt_idx" ON "analytics_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_events_path_idx" ON "analytics_events"("path");

-- CreateIndex
CREATE UNIQUE INDEX "consent_records_sessionId_key" ON "consent_records"("sessionId");

-- CreateIndex
CREATE INDEX "consent_records_sessionId_idx" ON "consent_records"("sessionId");

-- CreateIndex
CREATE INDEX "consent_records_expiresAt_idx" ON "consent_records"("expiresAt");

-- CreateIndex
CREATE INDEX "ab_tests_status_idx" ON "ab_tests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ab_test_variants_testId_id_key" ON "ab_test_variants"("testId", "id");

-- CreateIndex
CREATE INDEX "ab_test_assignments_testId_variantId_idx" ON "ab_test_assignments"("testId", "variantId");

-- CreateIndex
CREATE INDEX "ab_test_assignments_sessionId_idx" ON "ab_test_assignments"("sessionId");

-- CreateIndex
CREATE INDEX "ab_test_assignments_userId_idx" ON "ab_test_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ab_test_assignments_testId_sessionId_key" ON "ab_test_assignments"("testId", "sessionId");

-- CreateIndex
CREATE INDEX "ab_test_events_testId_variantId_eventType_idx" ON "ab_test_events"("testId", "variantId", "eventType");

-- CreateIndex
CREATE INDEX "ab_test_events_sessionId_idx" ON "ab_test_events"("sessionId");

-- CreateIndex
CREATE INDEX "ab_test_events_eventType_createdAt_idx" ON "ab_test_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "conversion_events_source_stage_createdAt_idx" ON "conversion_events"("source", "stage", "createdAt");

-- CreateIndex
CREATE INDEX "conversion_events_variant_stage_createdAt_idx" ON "conversion_events"("variant", "stage", "createdAt");

-- CreateIndex
CREATE INDEX "conversion_events_sessionId_idx" ON "conversion_events"("sessionId");

-- CreateIndex
CREATE INDEX "conversion_events_stage_createdAt_idx" ON "conversion_events"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripeInvoiceId_key" ON "invoices"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_stripeInvoiceId_idx" ON "invoices"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "affiliate_links_program_isActive_idx" ON "affiliate_links"("program", "isActive");

-- CreateIndex
CREATE INDEX "affiliate_links_createdBy_idx" ON "affiliate_links"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_links_url_program_affiliateId_key" ON "affiliate_links"("url", "program", "affiliateId");

-- CreateIndex
CREATE INDEX "affiliate_clicks_linkId_clickedAt_idx" ON "affiliate_clicks"("linkId", "clickedAt");

-- CreateIndex
CREATE INDEX "affiliate_clicks_sessionId_idx" ON "affiliate_clicks"("sessionId");

-- CreateIndex
CREATE INDEX "ad_slots_position_isActive_idx" ON "ad_slots"("position", "isActive");

-- CreateIndex
CREATE INDEX "ad_slots_priority_idx" ON "ad_slots"("priority");

-- CreateIndex
CREATE INDEX "ad_impressions_slotId_viewedAt_idx" ON "ad_impressions"("slotId", "viewedAt");

-- CreateIndex
CREATE INDEX "ad_impressions_sessionId_idx" ON "ad_impressions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "premium_content_postId_key" ON "premium_content"("postId");

-- CreateIndex
CREATE INDEX "premium_content_requiredPlan_isActive_idx" ON "premium_content"("requiredPlan", "isActive");

-- CreateIndex
CREATE INDEX "revenue_records_type_recordedAt_idx" ON "revenue_records"("type", "recordedAt");

-- CreateIndex
CREATE INDEX "revenue_records_source_idx" ON "revenue_records"("source");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE INDEX "follows_createdAt_idx" ON "follows"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticketId_key" ON "support_tickets"("ticketId");

-- CreateIndex
CREATE INDEX "support_tickets_ticketId_idx" ON "support_tickets"("ticketId");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_tickets_createdAt_idx" ON "support_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "support_ticket_responses_ticketId_idx" ON "support_ticket_responses"("ticketId");

-- CreateIndex
CREATE INDEX "support_ticket_responses_createdAt_idx" ON "support_ticket_responses"("createdAt");

-- CreateIndex
CREATE INDEX "flux_postId_idx" ON "flux"("postId");

-- CreateIndex
CREATE INDEX "flux_userId_idx" ON "flux"("userId");

-- CreateIndex
CREATE INDEX "article_votes_postId_idx" ON "article_votes"("postId");

-- CreateIndex
CREATE INDEX "article_votes_userId_idx" ON "article_votes"("userId");

-- CreateIndex
CREATE INDEX "article_votes_postId_type_idx" ON "article_votes"("postId", "type");

-- CreateIndex
CREATE INDEX "reading_history_userId_idx" ON "reading_history"("userId");

-- CreateIndex
CREATE INDEX "reading_history_postId_idx" ON "reading_history"("postId");

-- CreateIndex
CREATE INDEX "reading_history_lastAt_idx" ON "reading_history"("lastAt");

-- CreateIndex
CREATE UNIQUE INDEX "reading_history_userId_postId_key" ON "reading_history"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "post_scores_postId_key" ON "post_scores"("postId");

-- CreateIndex
CREATE INDEX "post_scores_score_idx" ON "post_scores"("score");

-- CreateIndex
CREATE INDEX "post_scores_updatedAt_idx" ON "post_scores"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "security_events_type_idx" ON "security_events"("type");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "security_events_userId_idx" ON "security_events"("userId");

-- CreateIndex
CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- CreateIndex
CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "media_assets_userId_idx" ON "media_assets"("userId");

-- CreateIndex
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");

-- CreateIndex
CREATE INDEX "media_assets_isPublic_idx" ON "media_assets"("isPublic");

-- CreateIndex
CREATE INDEX "media_assets_createdAt_idx" ON "media_assets"("createdAt");

-- CreateIndex
CREATE INDEX "saved_filters_userId_idx" ON "saved_filters"("userId");

-- CreateIndex
CREATE INDEX "saved_filters_userId_isDefault_idx" ON "saved_filters"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "post_analytics_postId_key" ON "post_analytics"("postId");

-- CreateIndex
CREATE INDEX "post_analytics_postId_idx" ON "post_analytics"("postId");

-- CreateIndex
CREATE INDEX "post_analytics_views_idx" ON "post_analytics"("views");

-- CreateIndex
CREATE INDEX "post_analytics_engagementScore_idx" ON "post_analytics"("engagementScore");

-- CreateIndex
CREATE INDEX "post_analytics_updatedAt_idx" ON "post_analytics"("updatedAt");

-- CreateIndex
CREATE INDEX "user_activities_sessionId_idx" ON "user_activities"("sessionId");

-- CreateIndex
CREATE INDEX "user_activities_postId_idx" ON "user_activities"("postId");

-- CreateIndex
CREATE INDEX "user_activities_userId_idx" ON "user_activities"("userId");

-- CreateIndex
CREATE INDEX "user_activities_activityType_idx" ON "user_activities"("activityType");

-- CreateIndex
CREATE INDEX "user_activities_createdAt_idx" ON "user_activities"("createdAt");

-- CreateIndex
CREATE INDEX "user_activities_consentGiven_idx" ON "user_activities"("consentGiven");

-- CreateIndex
CREATE UNIQUE INDEX "session_analytics_sessionId_key" ON "session_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "session_analytics_sessionId_idx" ON "session_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "session_analytics_userId_idx" ON "session_analytics"("userId");

-- CreateIndex
CREATE INDEX "session_analytics_startedAt_idx" ON "session_analytics"("startedAt");

-- CreateIndex
CREATE INDEX "session_analytics_bounced_idx" ON "session_analytics"("bounced");

-- CreateIndex
CREATE INDEX "session_analytics_converted_idx" ON "session_analytics"("converted");

-- CreateIndex
CREATE INDEX "session_analytics_consentGiven_idx" ON "session_analytics"("consentGiven");

-- CreateIndex
CREATE UNIQUE INDEX "trending_articles_postId_key" ON "trending_articles"("postId");

-- CreateIndex
CREATE INDEX "trending_articles_trendingScore_idx" ON "trending_articles"("trendingScore");

-- CreateIndex
CREATE INDEX "trending_articles_timeframe_idx" ON "trending_articles"("timeframe");

-- CreateIndex
CREATE INDEX "trending_articles_isCurrentlyTrending_idx" ON "trending_articles"("isCurrentlyTrending");

-- CreateIndex
CREATE INDEX "trending_articles_peakHour_idx" ON "trending_articles"("peakHour");

-- CreateIndex
CREATE INDEX "quotes_isActive_idx" ON "quotes"("isActive");

-- CreateIndex
CREATE INDEX "quotes_category_idx" ON "quotes"("category");

-- CreateIndex
CREATE INDEX "quotes_createdAt_idx" ON "quotes"("createdAt");

-- CreateIndex
CREATE INDEX "ai_task_logs_userId_idx" ON "ai_task_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_task_logs_provider_idx" ON "ai_task_logs"("provider");

-- CreateIndex
CREATE INDEX "ai_task_logs_task_idx" ON "ai_task_logs"("task");

-- CreateIndex
CREATE INDEX "ai_task_logs_success_idx" ON "ai_task_logs"("success");

-- CreateIndex
CREATE INDEX "ai_task_logs_createdAt_idx" ON "ai_task_logs"("createdAt");

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "system_alerts_alertId_key" ON "system_alerts"("alertId");

-- CreateIndex
CREATE INDEX "system_alerts_type_idx" ON "system_alerts"("type");

-- CreateIndex
CREATE INDEX "system_alerts_category_idx" ON "system_alerts"("category");

-- CreateIndex
CREATE INDEX "system_alerts_severity_idx" ON "system_alerts"("severity");

-- CreateIndex
CREATE INDEX "system_alerts_resolved_idx" ON "system_alerts"("resolved");

-- CreateIndex
CREATE INDEX "system_alerts_timestamp_idx" ON "system_alerts"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_name_key" ON "ai_providers"("name");

-- CreateIndex
CREATE INDEX "ai_providers_name_idx" ON "ai_providers"("name");

-- CreateIndex
CREATE INDEX "ai_providers_isActive_idx" ON "ai_providers"("isActive");

-- CreateIndex
CREATE INDEX "ai_providers_isAvailable_idx" ON "ai_providers"("isAvailable");

-- CreateIndex
CREATE INDEX "ai_providers_priority_idx" ON "ai_providers"("priority");

-- CreateIndex
CREATE INDEX "ai_automation_rules_trigger_idx" ON "ai_automation_rules"("trigger");

-- CreateIndex
CREATE INDEX "ai_automation_rules_isActive_idx" ON "ai_automation_rules"("isActive");

-- CreateIndex
CREATE INDEX "ai_automation_rules_nextRun_idx" ON "ai_automation_rules"("nextRun");

-- CreateIndex
CREATE INDEX "ai_automation_rules_createdBy_idx" ON "ai_automation_rules"("createdBy");

-- CreateIndex
CREATE INDEX "ai_chats_userId_idx" ON "ai_chats"("userId");

-- CreateIndex
CREATE INDEX "ai_chats_isActive_idx" ON "ai_chats"("isActive");

-- CreateIndex
CREATE INDEX "ai_chats_createdAt_idx" ON "ai_chats"("createdAt");

-- CreateIndex
CREATE INDEX "ai_messages_chatId_idx" ON "ai_messages"("chatId");

-- CreateIndex
CREATE INDEX "ai_messages_role_idx" ON "ai_messages"("role");

-- CreateIndex
CREATE INDEX "ai_messages_createdAt_idx" ON "ai_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_quotas_userId_key" ON "ai_usage_quotas"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_quotas_userId_idx" ON "ai_usage_quotas"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_quotas_isBlocked_idx" ON "ai_usage_quotas"("isBlocked");

-- CreateIndex
CREATE INDEX "ai_usage_quotas_lastActivity_idx" ON "ai_usage_quotas"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "ai_permissions_userId_key" ON "ai_permissions"("userId");

-- CreateIndex
CREATE INDEX "ai_permissions_userId_idx" ON "ai_permissions"("userId");

-- CreateIndex
CREATE INDEX "ai_permissions_canUseAI_idx" ON "ai_permissions"("canUseAI");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_type_category_idx" ON "notifications"("type", "category");

-- CreateIndex
CREATE INDEX "notifications_priority_isRead_idx" ON "notifications"("priority", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_scheduledFor_idx" ON "notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_isArchived_isDismissed_idx" ON "notifications"("isArchived", "isDismissed");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "trend_topics_uniqueHash_key" ON "trend_topics"("uniqueHash");

-- CreateIndex
CREATE INDEX "trend_topics_category_idx" ON "trend_topics"("category");

-- CreateIndex
CREATE INDEX "trend_topics_source_idx" ON "trend_topics"("source");

-- CreateIndex
CREATE INDEX "trend_topics_score_idx" ON "trend_topics"("score");

-- CreateIndex
CREATE INDEX "trend_topics_discoveredAt_idx" ON "trend_topics"("discoveredAt");

-- CreateIndex
CREATE INDEX "trend_topics_uniqueHash_idx" ON "trend_topics"("uniqueHash");
