import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Personal, passcode-protected or utility screens are not for search engines.
      disallow: ['/unlock', '/setup-passcode', '/profile', '/settings', '/offline', '/dashboard', '/analytics', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
