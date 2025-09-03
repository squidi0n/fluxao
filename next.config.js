/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force output to standalone to avoid SSG issues
  output: 'standalone',

  // Disable ESLint during build (we'll run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checks during build (we'll run them separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization configuration
  images: {
    domains: [
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'cloudinary.com',
      'res.cloudinary.com',
      'picsum.photos',
      'i.pravatar.cc',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression and performance
  compress: true,
  poweredByHeader: false,

  // Redirects for article URLs
  async rewrites() {
    return [
      {
        source: '/news/:slug',
        destination: '/:slug',
      },
    ];
  },

  // Static file caching
  async headers() {
    return [
      // Cache static assets for 1 year
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fix MIME types for CSS files
      {
        source: '/_next/static/css/(.*).css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/styles/(.*).css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // Cache images for 1 month
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // Cache API responses for 5 minutes by default
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      // Security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-badge',
      '@radix-ui/react-button',
      '@radix-ui/react-card',
      '@radix-ui/react-input',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-textarea',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      'date-fns',
      'recharts',
    ],
  },

  // Reduce build output for faster builds
  productionBrowserSourceMaps: false,

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Enable gzip compression for better performance
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
