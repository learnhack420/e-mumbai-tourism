export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Initialize Supabase INSIDE the sitemap function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
  );

  // 🌟 UPDATED: Aapka naya domain yahan set kar diya gaya hai
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://emumbaitourism.com'

  // 2. Static Pages
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
    // 3. Fetch ONLY "approved" listings with created_at for accurate SEO dates
    const { data: listings, error } = await supabase
      .from('listings')
      .select('slug, category, created_at')
      .eq('status', 'approved') // 🌟 FIX: Google ko sirf Live/Approved listings bhejein

    if (error) {
      console.error("Sitemap Supabase Error:", error.message)
      return staticPages
    }

    if (!listings || listings.length === 0) {
      return staticPages
    }

    // 4. Map listings to exactly match website routes
    const dynamicPages = listings
      .filter((item) => item.slug) // Jiska slug ho sirf wahi lein
      .map((item) => {
        let path = `/listing/${item.slug}` // Default fallback

        const cat = (item.category || '').toLowerCase()

        // 🌟 FIX: Matching EXACT routes used in your Admin Dashboard / Frontend
        if (cat === 'tour' || cat === 'tours') {
          path = `/tour/${item.slug}`
        } else if (cat === 'hotel' || cat === 'hotels') {
          path = `/hotel/${item.slug}`
        } else if (cat === 'cab' || cat === 'cabs') {
          path = `/cabs/${item.slug}`
        } else if (cat === 'destination' || cat === 'place' || cat === 'places') {
          path = `/places/${item.slug}`
        } else if (cat === 'blog' || cat === 'blogs') {
          path = `/${item.slug}` // Blogs are directly on the root url
        }

        return {
          url: `${baseUrl}${path}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(), // SEO optimized date
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