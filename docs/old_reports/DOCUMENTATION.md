# FluxAO Documentation

## Overview

FluxAO is a modern, production-ready tech and AI magazine platform built with Next.js 14, TypeScript, Prisma, and Tailwind CSS. The platform features a comprehensive content management system, advanced filtering capabilities, privacy-first analytics, and a professional newsletter system.

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git

### Development Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.sample .env
   ```
   Edit `.env` with your configuration (DATABASE_URL, BASE_URL, RESEND_API_KEY)

3. **Initialize database:**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Core Features

### Content Management
- **Blog System:** Full-featured blog with categories, tags, and advanced search
- **Multi-dimensional Filtering:** Content types, difficulty levels, reading time, date ranges
- **Rich Editor:** TipTap editor with AI-powered features
- **SEO Optimization:** Automated meta tags, sitemaps, and structured data

### Analytics & Tracking
- **Privacy-First Analytics:** GDPR-compliant tracking with IP hashing
- **Real-time Metrics:** Live visitor tracking, engagement analytics, reading progress
- **Admin Dashboard:** Comprehensive analytics with charts and performance insights
- **Predictive Analytics:** AI-powered trending detection and content recommendations

### Newsletter System
- **Double Opt-in:** Email verification with automated workflows
- **Template System:** Customizable newsletter templates
- **Queue Management:** Background job processing for email campaigns
- **Subscriber Management:** Import/export, segmentation, and analytics

### User Management
- **Authentication:** Secure login with role-based access control (RBAC)
- **Admin Panel:** Full-featured admin interface with user management
- **Profile System:** User profiles with subscription management

## Project Structure

```
/app                    # Next.js App Router
├── admin/             # Admin dashboard (analytics, posts, users)
├── api/               # API endpoints (posts, analytics, newsletter)
├── blog/              # Enhanced blog with filtering
└── [slug]/            # Dynamic article pages

/components             # React components
├── admin/             # Admin-specific components
├── analytics/         # Analytics and tracking components
├── filters/           # Advanced filter system
├── ui/                # Reusable UI components
└── newsletter/        # Newsletter components

/lib                   # Utility functions
├── analytics/         # Tracking and analytics utilities
├── auth/              # Authentication and security
├── ai/                # AI integration (moderation, content generation)
└── security/          # Security utilities (CSRF, rate limiting)

/prisma                # Database
├── schema.prisma      # Database schema with analytics models
└── seed.ts            # Mock data generation
```

## Database Schema

### Core Models
- **Post:** Articles with categories, tags, analytics tracking
- **User:** Admin and subscriber accounts with RBAC
- **Category:** Hierarchical content organization
- **Tag:** Flexible tagging system

### Analytics Models
- **PostAnalytics:** Article performance metrics
- **UserActivity:** Privacy-first user interaction tracking
- **SessionAnalytics:** Session-based analytics
- **SavedFilter:** User-defined filter combinations

### Newsletter Models
- **NewsletterSubscriber:** Subscriber management with verification
- **NewsletterQueue:** Email campaign queue system

## API Endpoints

### Content
- `GET /api/posts` - List articles with filtering
- `GET /api/posts/[slug]` - Individual article
- `POST /api/posts` - Create article (admin)

### Analytics
- `POST /api/analytics/track` - Track user interactions
- `GET /api/analytics/stats` - Retrieve analytics data

### Newsletter
- `POST /api/newsletter/subscribe` - Newsletter subscription
- `GET /api/newsletter/verify` - Email verification

### Utility
- `GET /api/health` - Health check endpoint
- `GET /rss.xml` - RSS feed
- `GET /feed.json` - JSON feed

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
pnpm db:migrate   # Database migrations
pnpm db:seed      # Load mock data
pnpm db:studio    # Open Prisma Studio
```

## Security Features

- **Input Validation:** Zod schema validation on all endpoints
- **SQL Injection Protection:** Prisma ORM with prepared statements
- **XSS Protection:** React's built-in escaping + DOMPurify for rich content
- **CSRF Protection:** Token-based protection for state changes
- **Rate Limiting:** API endpoint protection
- **Security Headers:** CSP, HSTS, and other security headers
- **Privacy Compliance:** GDPR-compliant analytics with consent management

## Performance Optimizations

- **Database Indexing:** Optimized queries for filtering and search
- **Lazy Loading:** Component-based code splitting
- **Caching:** Redis integration for frequently accessed data
- **Image Optimization:** Next.js built-in image optimization
- **Bundle Analysis:** Webpack bundle analyzer integration

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Docker
```bash
docker build -t fluxao .
docker run -p 3000:3000 --env-file .env fluxao
```

### Manual
```bash
pnpm build
pnpm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `BASE_URL` | Application base URL | Yes |
| `RESEND_API_KEY` | Email service API key | Yes |
| `NEXTAUTH_SECRET` | Authentication secret | Yes |
| `OPENAI_API_KEY` | AI features (optional) | No |

## Architecture Decisions

### Frontend
- **Next.js 14:** App Router for modern React development
- **TypeScript:** Full type safety across the application
- **Tailwind CSS:** Utility-first CSS framework
- **Framer Motion:** Smooth animations and transitions

### Backend
- **Prisma ORM:** Type-safe database queries
- **Zod:** Runtime schema validation
- **NextAuth.js:** Authentication and authorization
- **Resend:** Transactional email service

### Database
- **SQLite:** Development database
- **PostgreSQL:** Production database
- **Redis:** Session storage and caching (optional)

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## Support

- **Issues:** GitHub Issues for bug reports and feature requests
- **Documentation:** This file and inline code comments
- **Claude AI Integration:** AI-powered development assistance via CLAUDE.md

## License

MIT License - see LICENSE file for details

---

**Last Updated:** August 28, 2024  
**Version:** 2.0.0-beta  
**Status:** Production Ready