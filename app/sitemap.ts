export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Safe Environment Variable Initialization
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://emumbaitourism.com';

  // 2. Static Pages Setup
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/places`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tours`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blogs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Agar variables miss ho jayein toh direct crash hone ke bajaye static pages return karein
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Sitemap Error: Supabase URL ya Anon Key missing hai.");
    return staticPages;
  }

  try {
    // 3. Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 4. Fetch ONLY "approved" listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('slug, category, created_at')
      .eq('status', 'approved');

    if (error) {
      console.error("Sitemap Supabase Error:", error.message);
      return staticPages;
    }

    if (!listings || listings.length === 0) {
      return staticPages;
    }

    // 5. Map dynamic routes
    const dynamicPages: MetadataRoute.Sitemap = listings
      .filter((item) => item.slug) // Sirf valid slugs allow karein
      .map((item) => {
        let path = `/listing/${item.slug}`;
        const cat = (item.category || '').toLowerCase();

        if (['tour', 'tours'].includes(cat)) {
          path = `/tour/${item.slug}`;
        } else if (['hotel', 'hotels'].includes(cat)) {
          path = `/hotel/${item.slug}`;
        } else if (['cab', 'cabs'].includes(cat)) {
          path = `/cabs/${item.slug}`;
        } else if (['destination', 'place', 'places'].includes(cat)) {
          path = `/places/${item.slug}`;
        } else if (['blog', 'blogs'].includes(cat)) {
          path = `/${item.slug}`;
        }

        return {
          url: `${baseUrl}${path}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        };
      });

    return [...staticPages, ...dynamicPages];

  } catch (err) {
    console.error("Sitemap Exception:", err);
    return staticPages;
  }
}