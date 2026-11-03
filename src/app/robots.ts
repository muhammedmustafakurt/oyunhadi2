import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Panel, API ve mekân masaları arama motorlarına kapalı.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/panel', '/api', '/oyna', '/admin', '/api/admin'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
