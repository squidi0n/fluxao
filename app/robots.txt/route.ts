import { generateRobotsTxt } from '@/lib/seo-utils';

export function GET() {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://fluxao.de' 
    : 'http://localhost:3001';
    
  const robotsTxt = generateRobotsTxt(baseUrl);

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}