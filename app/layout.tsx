import { Inter, Orbitron, Space_Grotesk, Audiowide, Exo_2 } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
// import { FeedbackWidget } from '@/components/feedback-widget'
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['300', '400', '500', '600', '700'],
});

const audiowide = Audiowide({
  subsets: ['latin'],
  variable: '--font-audiowide',
  weight: ['400'],
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: 'FluxAO – Deutschlands führendes KI & Tech Magazin',
    template: '%s | FluxAO',
  },
  description: 'Entdecke die Zukunft: KI, Technologie und gesellschaftlicher Wandel. Deutschlands innovativstes Magazin für Künstliche Intelligenz, Tech-Trends und digitale Transformation.',
  keywords: [
    'KI Deutschland', 'Künstliche Intelligenz', 'AI Technology', 'ChatGPT deutsch', 
    'Machine Learning', 'Tech News Deutschland', 'Innovation Magazin', 'AI Tools 2025',
    'Robotik News', 'Quantum Computing', 'VR AR Technologie', 'Tech Trends 2025',
    'AI Ethik', 'Digitalisierung Deutschland', 'Zukunft der Arbeit', 'IoT Deutschland'
  ],
  authors: [{ name: 'FluxAO Redaktion', url: 'https://fluxao.de/team' }],
  creator: 'FluxAO',
  publisher: 'FluxAO Media GmbH',
  category: 'Technology',
  classification: 'Technology Magazine',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: process.env.NODE_ENV === 'production' ? 'https://fluxao.de' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    languages: {
      'de-DE': process.env.NODE_ENV === 'production' ? 'https://fluxao.de' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    },
  },
  openGraph: {
    title: 'FluxAO – Deutschlands führendes KI & Tech Magazin',
    description: 'Entdecke die Zukunft: KI, Technologie und gesellschaftlicher Wandel. Deutschlands innovativstes Magazin für Künstliche Intelligenz und Tech-Trends.',
    url: process.env.NODE_ENV === 'production' ? 'https://fluxao.de' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    siteName: 'FluxAO',
    locale: 'de_DE',
    type: 'website',
    images: [{
      url: ((process.env.NODE_ENV === 'production' ? 'https://fluxao.de' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))) + '/og-home.png',
      width: 1200,
      height: 630,
      alt: 'FluxAO - Deutschlands KI & Tech Magazin',
      type: 'image/png',
    }],
    countryName: 'Germany',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fluxao_de',
    creator: '@fluxao_de',
    title: 'FluxAO – Deutschlands führendes KI & Tech Magazin',
    description: 'Entdecke die Zukunft: KI, Technologie und gesellschaftlicher Wandel. Tech-News, AI-Tools und Innovation.',
    images: [((process.env.NODE_ENV === 'production' ? 'https://fluxao.de' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))) + '/og-home.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      'msvalidate.01': process.env.BING_SITE_VERIFICATION || '',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable} ${audiowide.variable} ${exo2.variable} font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
