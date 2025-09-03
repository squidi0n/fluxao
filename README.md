# FluxAO - Tech & AI Magazin

A modern, production-ready blog and newsletter platform focused on AI and technology content. Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## Features

### Core Functionality

- 📝 **Blog System** - Full-featured blog with categories, tags, and search
- 📧 **Newsletter** - Double opt-in subscription system with email verification
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🌙 **Dark Mode** - Automatic dark mode support
- 🔍 **SEO Optimized** - Sitemap, robots.txt, Open Graph tags
- 📊 **RSS & JSON Feeds** - Content syndication support
- 🔒 **Security** - CSP headers, input validation, secure defaults
- 📈 **Health Monitoring** - Built-in health check endpoint
- 📚 **API Documentation** - OpenAPI 3.0 specification

### Technical Features

- **Type Safety** - Full TypeScript coverage
- **Database** - Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Logging** - Structured logging with Pino
- **CI/CD** - GitHub Actions workflow
- **Code Quality** - ESLint, Prettier, Husky pre-commit hooks
- **Performance** - Optimized builds, lazy loading, caching

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/fluxao.git
cd fluxao
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.sample .env
```

Edit `.env` and add your configuration:

- `DATABASE_URL` - Database connection string
- `BASE_URL` - Your application URL
- `RESEND_API_KEY` - Resend API key for emails

### 4. Set up the database

```bash
# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed database with sample data
pnpm db:studio    # Open Prisma Studio
```

## Project Structure

```
fluxao/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── health/        # Health check endpoint
│   │   └── newsletter/    # Newsletter subscription endpoints
│   ├── blog/              # Blog pages
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── newsletter/       # Newsletter-specific components
├── lib/                   # Utility functions and configurations
│   ├── config.ts         # Environment configuration
│   ├── db.ts            # Database client
│   └── logger.ts        # Logging setup
├── prisma/               # Database schema and migrations
│   ├── schema.prisma    # Prisma schema
│   └── seed.ts          # Database seeding script
├── public/               # Static assets
├── openapi/              # OpenAPI specification
└── .github/              # GitHub Actions workflows
```

## API Documentation

The API is documented using OpenAPI 3.0. View the specification at `/openapi/schema.yaml`.

### Key Endpoints

- `GET /api/health` - Health check
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `GET /api/newsletter/verify?token=xxx` - Verify email
- `GET /rss.xml` - RSS feed
- `GET /feed.json` - JSON feed

## Database Schema

The application uses the following main entities:

- **User** - Admin and editor accounts
- **Post** - Blog posts with status management
- **Category** - Post categories
- **Tag** - Post tags
- **NewsletterSubscriber** - Email subscribers
- **Media** - Media assets
- **Setting** - Application settings

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables:
   - `DATABASE_URL` (use Neon PostgreSQL)
   - `BASE_URL`
   - `RESEND_API_KEY`
4. Deploy

### Docker

```bash
# Build the image
docker build -t fluxao .

# Run the container
docker run -p 3000:3000 --env-file .env fluxao
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

## Environment Variables

| Variable         | Description                                  | Required | Default               |
| ---------------- | -------------------------------------------- | -------- | --------------------- |
| `DATABASE_URL`   | Database connection string                   | Yes      | -                     |
| `BASE_URL`       | Application base URL                         | Yes      | http://localhost:3000 |
| `RESEND_API_KEY` | Resend API key for emails                    | Yes      | -                     |
| `NODE_ENV`       | Environment (development/staging/production) | No       | development           |

## Testing

```bash
# Run tests (if configured)
pnpm test

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All inputs are validated using Zod
- SQL injection protection via Prisma ORM
- XSS protection through React's default escaping
- CSRF protection for state-changing operations
- Security headers configured via middleware
- No sensitive data in logs

## Performance

- Lighthouse Score: 95+ (Performance)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle size: < 1.5MB initial

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- GitHub Issues: [Create an issue](https://github.com/yourusername/fluxao/issues)
- Email: support@fluxao.com

## Roadmap

- [ ] User authentication system
- [ ] Comment system
- [ ] Advanced search
- [ ] Multi-language support
- [ ] Email automation
- [ ] Analytics dashboard
- [ ] Shop integration (Stripe)
- [ ] Mobile app

## Acknowledgments

Built with:

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Resend](https://resend.com/)

---

Made with ❤️ by the FluxAO Team
