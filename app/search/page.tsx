import { supabase } from '../../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
import MainSearchBox from '../components/MainSearchBox' // 🌟 Search box import kiya

// 🌟 FIX 1: Removed runtime='edge' completely to prevent Cloudflare crashes

export const metadata: Metadata = {
  title: 'Search Results | India Tour Operators',
  description: 'Find the best tours, cabs, and hotels.',
}

// Helper function to remove HTML tags and special entities
const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace non-breaking spaces
    .replace(/&amp;/g, '&');   // Replace ampersands
}

// 🌟 SMART CITY EXTRACTOR
const extractCityName = (locStr: string = '') => {
  if (!locStr || locStr === 'Not specified') return '';
  let cleanStr = locStr.split(/➔|->/)[0].trim();
  const parts = cleanStr.split(/,| > /).map(s => s.trim());
  if (parts.length >= 4) return parts[parts.length - 3];
  if (parts.length >= 3) return parts[parts.length - 3];
  if (parts.length === 2) return parts[0];
  return parts[0];
}

// Listing URL Helper
const getListingUrl = (listing: any) => {
  const slug = listing.slug || listing.id
  if (listing.category === 'tour') return `/tour/${slug}`
  if (listing.category === 'hotel') return `/hotel/${slug}`
  if (listing.category === 'cab') return `/cabs/${slug}`
  return `/listing/${slug}`
}

// 🌟 FIX 2: THUMBNAIL HELPER UPDATED (With Safe JSON Parse)
const getThumbnail = (listing: any) => {
  let meta: any = {};
  try {
    meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
  } catch (e) {
    // Agar JSON toota hua ho, toh crash na ho
    meta = {};
  }
  
  const mainImage = listing.image || meta.thumbnail || meta.image;
  if (mainImage && mainImage.trim() !== '') {
    return mainImage;
  }
  
  if (Array.isArray(meta.gallery) && meta.gallery.length > 0 && meta.gallery[0].trim() !== '') {
    return meta.gallery[0]
  }
  
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=600'
}

export default async function SearchResultsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  try {
    // 🌟 FIX 3: Wrapped Entire Logic in Try-Catch
    const resolvedParams = await searchParams
    
    const service = resolvedParams.service // cab, tour, hotel
    const destination = resolvedParams.destination
    const city = resolvedParams.city
    const pickup = resolvedParams.pickup
    const drop = resolvedParams.drop
    
    // Supabase Base Query
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')

    // 1. Filter by Service Category
    if (service) {
      query = query.eq('category', service)
    }

    // 2. Filter by Location/Keyword using .ilike() for partial matching
    if (service === 'tour' && destination) {
      query = query.ilike('location', `%${destination}%`)
    } else if (service === 'hotel' && city) {
      query = query.ilike('location', `%${city}%`)
    } else if (service === 'cab') {
      // Cab ke case mein city ya pickup me se jo bhi field URL me ho
      const searchLocation = city || pickup
      if (searchLocation) {
        query = query.ilike('location', `%${searchLocation}%`)
      }
    }

    // Finalize query order
    const { data: results, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database Error: ${error.message}`) // Force catch block execution
    }

    // Dynamic heading generator
    let searchHeading = "Search Results"
    if (service === 'tour') searchHeading = `Tour Packages for ${destination || 'Anywhere'}`
    else if (service === 'hotel') searchHeading = `Hotels in ${city || 'Anywhere'}`
    else if (service === 'cab') {
      if (resolvedParams.type === 'local') searchHeading = `Local Cabs in ${city || 'City'}`
      else if (resolvedParams.type === 'outstation') searchHeading = `Outstation Cabs from ${pickup || 'City'}`
      else searchHeading = "Cab Services"
    }

    return (
      <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-blue-600 selection:text-white">
        
        {/* 🌟 Search Header (Slightly enhanced gradient) */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white pt-14 pb-28 px-4 md:px-8 shadow-inner">
          <div className="max-w-6xl mx-auto">
            <Link href="/" className="text-blue-300 hover:text-white text-sm font-bold mb-4 inline-block transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-3xl md:text-5xl font-black mt-2 tracking-tight">{searchHeading}</h1>
            <p className="text-blue-200 mt-3 text-lg font-medium opacity-90">
              Found {results ? results.length : 0} verified options matching your search.
            </p>
          </div>
        </div>

        {/* 🌟 MAIN SEARCH BOX ADDED HERE (Floating over the blue header) */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-20 relative z-10 mb-14">
          <MainSearchBox />
        </div>

        {/* Results Grid */}
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results && results.length > 0 ? (
              results.map((listing) => {
                const detailUrl = getListingUrl(listing)
                const imageUrl = getThumbnail(listing)
                const cleanDescription = stripHtml(listing.description)
                
                // 🌟 FIX 4: SAFE JSON PARSE INSIDE MAP LOOP
                let meta: any = {};
                try {
                  meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
                } catch (e) {
                  meta = {}; // Fallback empty object if parsing fails
                }
                const placesToVisit = meta.topAttractions || meta.placesToVisit;

                return (
                  <Link 
                    href={detailUrl} 
                    key={listing.id} 
                    // 🌟 Premium Card Hover Effect
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={listing.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      {/* 🌟 DURATION BADGE (Glassmorphism Design) */}
                      <span className="absolute top-4 left-4 text-[10px] font-black text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm border border-white/10">
                        {listing.category === 'tour' ? (meta.duration || 'TOUR') : listing.category}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* 🌟 Tighter tracking for Title */}
                        <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors tracking-tight">
                          {listing.title}
                        </h3>
                        {/* 🌟 Softer text color for Overview */}
                        <p className="text-slate-500 mt-2 text-sm line-clamp-2 leading-relaxed font-medium">
                          {cleanDescription}
                        </p>
                        
                        {/* 🌟 PLACES TO VISIT BLOCK (Softer background, rounded corners) */}
                        {listing.category === 'tour' && placesToVisit && (
                          <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                            <p className="line-clamp-2 leading-relaxed">
                              <span className="font-black text-slate-800">📌 Places: </span> 
                              {Array.isArray(placesToVisit) ? placesToVisit.join(', ') : placesToVisit}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        {/* 🌟 Footer section with better alignments */}
                        <div className="mt-5 flex justify-between items-end border-t border-slate-100 pt-5">
                          <span className="text-slate-500 text-sm font-bold flex items-center gap-1.5 truncate max-w-[50%]">
                            {/* 🌟 SHORT CITY NAME */}
                            <span className="text-lg">📍</span> {extractCityName(listing.location)}
                          </span>
                          <div className="text-right">
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Starting from</span>
                            {/* 🌟 Price popping out more */}
                            <span className="text-2xl font-black text-emerald-600 tracking-tight">
                              ₹{listing.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-full text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
                <span className="text-6xl block mb-6 drop-shadow-sm">🔍</span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">No results found</h2>
                <p className="text-slate-500 mt-3 max-w-md mx-auto text-lg font-medium leading-relaxed">
                  We couldn't find any {service} services matching your search criteria right now. Try searching for a different city or category.
                </p>
                <Link href="/" className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg shadow-md uppercase tracking-wider text-sm">
                  Go Back Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    )

  } catch (err: any) {
    // 🔴 SMART DEBUG: CATCH SERVER ERRORS 🔴
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl w-full border-2 border-red-200">
          <h1 className="text-2xl font-black text-red-600 mb-4">⚠️ Search Page Crash Report</h1>
          <p className="text-gray-700 mb-2">Aapka code is wajah se fail ho raha hai:</p>
          <div className="bg-red-100 text-red-900 p-4 rounded-lg font-mono text-sm overflow-auto mb-4">
            <strong>Error Message:</strong> {err.message}
          </div>
          <div className="bg-gray-100 text-gray-800 p-4 rounded-lg font-mono text-xs overflow-auto">
            <strong>Stack Trace:</strong> <br/>
            {err.stack}
          </div>
        </div>
      </div>
    )
  }
}