import type { MetadataRoute } from 'next'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businesses } from '@/lib/db/schema'
import { getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    const activeBusinesses = await db
      .select({ slug: businesses.slug, updatedAt: businesses.updatedAt })
      .from(businesses)
      .where(and(eq(businesses.isDisabled, false), eq(businesses.membershipPaid, true)))

    const businessRoutes: MetadataRoute.Sitemap = activeBusinesses.flatMap((business) => [
      {
        url: `${baseUrl}/${business.slug}/sign-in`,
        lastModified: business.updatedAt ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/${business.slug}/sign-up`,
        lastModified: business.updatedAt ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    ])

    return [...staticRoutes, ...businessRoutes]
  } catch {
    return staticRoutes
  }
}
