import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/software/admin', '/api/', '/checkout/', '/cart/'],
    },
    sitemap: 'https://smartline.com/sitemap.xml',
  };
}
