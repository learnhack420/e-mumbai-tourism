import { MetadataRoute } from 'next'
import { supabase } from '@/utils/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.emumbaitourism.com'

  // 1. Static Pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/places`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tours`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  try {
    // 2. Fetch all dynamic listings from Supabase
    // Hum sirf slug aur category nikal rahe hain taaki koi column missing hone ka error na aaye
    const { data: listings, error } = await supabase
      .from('listings')
      .select('slug, category')

    if (error) {
      console.error("Sitemap Supabase Error:", error.message)
      return staticPages
    }

    if (!listings || listings.length === 0) {
      return staticPages
    }

    // 3. Map listings to sitemap entries
    const dynamicPages = listings
      .filter((item) => item.slug) // Jiska slug ho sirf wahi lein
      .map((item) => {
        let routePrefix = 'places' // default

        const cat = (item.category || '').toLowerCase()

        if (cat === 'tour' || cat === 'tours') {
          routePrefix = 'tours'
        } else if (cat === 'blog' || cat === 'blogs') {
          routePrefix = 'blog' // ya 'blogs' jo bhi aapka route ho
        } else if (cat === 'cab' || cat === 'cabs') {
          routePrefix = 'cabs'
        } else if (cat === 'destination' || cat === 'place' || cat === 'places') {
          routePrefix = 'places'
        }

        return {
          url: `${baseUrl}/${routePrefix}/${item.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }
      })

    return [...staticPages, ...dynamicPages]

  } catch (err) {
    console.error("Sitemap Exception:", err)
    return staticPages
  }
}
