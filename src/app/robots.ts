import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/send', '/contacts', '/templates', '/sent', '/settings'],
    },
    sitemap: 'https://smtpanel.vercel.app/sitemap.xml',
  }
}