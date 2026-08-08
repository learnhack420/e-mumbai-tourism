import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tourist Attractions & Places | E-Mumbai Tourism',
  description: 'Explore the best tourist places, attractions, and destinations in and around Mumbai, Maharashtra. Filter by categories like Pilgrimage, Nature, Historical, and more.',
}

// Helper function to remove HTML tags
const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');   
}

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  // 🌟 Next.js 15+ ke liye searchParams ko await karna padta hai
  const resolvedParams = await searchParams;
  const categoryFilter = resolvedParams?.category;

  // 🌟 Supabase se sirf 'destination' (places) fetch karein
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .eq('category', 'destination')
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching places:', error)

  let places = listings || []

  // 🌟 Step 1: Saari unique categories extract karein taaki Filter Bar ban sake
  const allCategories = new Set<string>();
  places.forEach((place) => {
    const meta = typeof place.metadata === 'string' ? JSON.parse(place.metadata) : (place.metadata || {})
    const placeCats: string[] = Array.isArray(meta.placeCategories) ? meta.placeCategories : [];
    placeCats.forEach(cat => allCategories.add(cat));
  });
  const uniqueCategories = Array.from(allCategories).sort();

  // 🌟 Step 2: Agar URL me category hai, toh unhe filter karein
  if (categoryFilter) {
    places = places.filter((place) => {
      const meta = typeof place.metadata === 'string' ? JSON.parse(place.metadata) : (place.metadata || {})
      const categories = meta.placeCategories || []
      return categories.includes(categoryFilter)
    })
  }

  // 🌟 THUMBNAIL EXTRACTOR
  const getThumbnail = (listing: any) => {
    const meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
    const exactImage = listing.image || listing.thumbnail || meta.thumbnail || meta.image;
    if (exactImage && typeof exactImage === 'string' && exactImage.trim() !== '') return exactImage.trim();
    if (meta.gallery && Array.isArray(meta.gallery) && meta.gallery.length > 0) {
      const firstValidImg = meta.gallery.find((img: string) => img && typeof img === 'string' && img.trim() !== '')
      if (firstValidImg) return firstValidImg.trim()
    }
    return '/ITO LOGO.png'
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans py-12 px-4 md:px-8 selection:bg-blue-200 selection:text-blue-900">
      <div className="max-w-6xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-10 text-center md:text-left">
          <Link href="/" className="text-blue-600 font-bold hover:underline mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 mt-2">
            {categoryFilter ? (
              <>Explore <span className="text-amber-600">{categoryFilter}</span> Places</>
            ) : (
              "All Tourist Attractions"
            )}
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            {categoryFilter 
              ? `Showing all amazing destinations categorized under ${categoryFilter}.` 
              : "Discover the best destinations, historical sites, and nature spots."}
          </p>
        </div>

        {/* --- CATEGORY FILTER BAR --- */}
        <div className="mb-10 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-3">
            <Link 
              href="/places"
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                !categoryFilter 
                  ? 'bg-slate-900 text-white border border-slate-900' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
              }`}
            >
              All Places
            </Link>
            {uniqueCategories.map((cat, idx) => (
              <Link 
                key={idx}
                href={`/places?category=${encodeURIComponent(cat)}`}
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                  categoryFilter === cat 
                    ? 'bg-amber-500 text-slate-900 border border-amber-600' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400 hover:text-amber-700'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* --- RESULTS GRID --- */}
        {places.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border border-slate-200 shadow-sm mt-10">
            <span className="text-5xl mb-4 block">🏜️</span>
            <h2 className="text-2xl font-black text-slate-800 mb-2">No places found</h2>
            <p className="text-slate-500 font-medium">
              We couldn't find any places for the category "{categoryFilter}". 
            </p>
            <Link href="/places" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md">
              View All Places
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {places.map((listing) => {
              const detailUrl = `/places/${listing.slug || listing.id}`
              const imageUrl = getThumbnail(listing)
              const excerpt = listing.metadata?.shortDescription || stripHtml(listing.description);
              
              const meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {});
              const placeCats: string[] = Array.isArray(meta.placeCategories) ? meta.placeCategories : [];

              return (
                <div key={listing.id} className="relative bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:border-blue-100 transition-all duration-300 flex flex-col group">
                  
                  {/* Invisible Overlay Link for the whole card */}
                  <Link href={detailUrl} className="absolute inset-0 z-10">
                    <span className="sr-only">View {listing.title}</span>
                  </Link>

                  <div className="relative h-60 w-full bg-slate-200 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imageUrl} 
                      alt={listing.title} 
                      className={`w-full h-full ${imageUrl === '/ITO LOGO.png' ? 'object-contain p-4' : 'object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out'}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight mb-3">
                        {listing.title}
                      </h3>
                      
                      {/* 🌟 CLICKABLE CATEGORY TAGS */}
                      {placeCats.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 relative z-20">
                          {placeCats.map((cat, i) => (
                            <Link 
                              key={i} 
                              href={`/places?category=${encodeURIComponent(cat)}`} 
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors border ${
                                categoryFilter === cat 
                                  ? 'bg-amber-600 text-white border-amber-700' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-900'
                              }`}
                            >
                              {cat}
                            </Link>
                          ))}
                        </div>
                      )}

                      <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">
                        {excerpt}
                      </p>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-end border-t border-slate-100 pt-5 relative z-20 pointer-events-none">
                      <span className="text-slate-500 text-sm font-bold flex items-center truncate max-w-[55%]">
                        📍 {listing.location ? listing.location.split(',')[0] : 'Maharashtra'}
                      </span>
                      <div className="text-right">
                        <span className="block text-sm font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          Explore →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}