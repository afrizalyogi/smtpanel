import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Update this to your production URL when deploying
  const baseUrl = 'https://smtpanel.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // The dashboard routes are client-only and protected, 
    // so they are intentionally excluded from the sitemap.
  ]
}