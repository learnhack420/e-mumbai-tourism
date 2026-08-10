"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

interface Tour {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  image?: string;
  thumbnail?: string;
  location?: string;
  description?: string;
  metadata?: {
    shortDescription?: string;
    price?: number | string;
    duration?: string;
    thumbnail?: string;
    image?: string;
    topAttractions?: string | string[]; // 🌟 Added for places
    placesToVisit?: string | string[];  // 🌟 Added for places
  };
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

export default function ToursListingPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 🌟 NEW: Search query state
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTours()
  }, [])

  async function fetchTours() {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .or('category.eq.tour,category.eq.package,category.eq.tours')

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setTours(data)
      } else {
        // Fallback filter if exact category match fails
        const { data: allData, error: allDataError } = await supabase
          .from('listings')
          .select('*')
        
        if (allDataError) throw allDataError

        if (allData) {
          const filtered = allData.filter(item => {
            const cat = item.category?.toLowerCase() || ''
            return cat.includes('tour') || cat.includes('package') || cat.includes('holiday')
          })
          setTours(filtered)
        }
      }
    } catch (err: any) {
      console.error("Error fetching tours:", err)
      setError("We couldn't load the tour packages right now. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // 🌟 NEW: Real-time filtering logic
  const filteredTours = tours.filter(tour => {
    const query = searchQuery.toLowerCase()
    const titleMatch = (tour.title || '').toLowerCase().includes(query)
    const locationMatch = (tour.location || '').toLowerCase().includes(query)
    return titleMatch || locationMatch
  })

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* --- PRO HERO SECTION --- */}
      <section className="relative bg-slate-900 text-white pt-20 pb-28 px-6 text-center overflow-hidden">
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-slate-900/90 z-0"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <span className="text-amber-400 font-bold tracking-widest text-sm uppercase mb-4 block">
            Premium Itineraries
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight drop-shadow-md">
            Explore Popular Tour Packages
          </h1>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed drop-shadow">
            Discover the best sightseeing trips, exclusive holiday packages, and custom curated tours.
          </p>
        </div>
      </section>

      {/* 🌟 PREMIUM SEARCH BAR OVERLAPPING HERO SECTION (Untouched) */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 relative z-20 mb-8">
        <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2">
          <span className="pl-4 text-2xl text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search tours by name or location (e.g. Kerala, Manali)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-3 outline-none text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400 bg-transparent text-lg"
          />
          <button className="bg-slate-900 hover:bg-black text-amber-400 font-black px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 hidden md:block">
            Search
          </button>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl max-w-2xl mx-auto mt-8 shadow-sm">
            <h3 className="text-red-800 font-bold text-lg mb-2">Oops! Something went wrong</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchTours}
              className="mt-4 text-sm font-bold bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State (Skeleton Loaders) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 animate-pulse flex flex-col">
                <div className="h-56 bg-slate-200 rounded-2xl mb-4 w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6 mb-6"></div>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tours.length === 0 && !error ? (
          
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 px-8 max-w-2xl mx-auto mt-12">
            <div className="text-6xl mb-6">🧳</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Packages Found</h3>
            <p className="text-slate-500 mb-8 text-lg">We couldn&apos;t find any tour packages at the moment. Please check back later.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95">
              &larr; Return to Home
            </Link>
          </div>
          
        ) : filteredTours.length === 0 ? (
          
          /* No search results found state */
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 px-8 max-w-2xl mx-auto mt-12">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Match Found</h3>
            <p className="text-slate-500 mb-8 text-lg">We couldn&apos;t find any tours matching &quot;<span className="font-bold text-slate-700">{searchQuery}</span>&quot;.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-600 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Clear Search
            </button>
          </div>

        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {filteredTours.map((tour) => {
              const meta = tour.metadata || {}
              
              const imageUrl = tour.image || tour.thumbnail || meta.thumbnail || meta.image || null;

              // 🌟 Metadata extraction for Places To Visit
              const placesToVisit = meta.topAttractions || meta.placesToVisit;

              let cleanDescription = 'Experience an unforgettable journey with our curated travel itinerary.';
              if (meta.shortDescription) {
                cleanDescription = meta.shortDescription;
              } else if (tour.description) {
                cleanDescription = tour.description
                  .replace(/<[^>]*>?/gm, '') 
                  .replace(/&nbsp;/g, ' ')   
                  .replace(/&amp;/g, '&')    
                  .replace(/&quot;/g, '"')   
                  .substring(0, 120) + '...';
              }

              return (
                <Link 
                  href={`/tour/${tour.slug || tour.id}`} 
                  key={tour.id} 
                  className="group bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  {/* Image Container */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={imageUrl} 
                        alt={tour.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-100">
                        <span className="text-3xl mb-2 block text-center">🏞️</span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {/* 🌟 1. DURATION BADGE (Glassmorphism look applied) */}
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm border border-white/10">
                        {meta.duration || 'TOUR PACKAGE'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-500 text-sm">📍</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {/* 🌟 2. SMART CITY EXTRACTOR APPLIED */}
                        {extractCityName(tour.location) || 'India'}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-amber-600 transition-colors">
                      {tour.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 flex-grow">
                      {cleanDescription}
                    </p>

                    {/* 🌟 3. PLACES TO VISIT BLOCK */}
                    {placesToVisit && (
                      <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                        <p className="line-clamp-2 leading-relaxed">
                          <span className="font-black text-slate-800">📌 Places: </span> 
                          {Array.isArray(placesToVisit) ? placesToVisit.join(', ') : placesToVisit}
                        </p>
                      </div>
                    )}

                    {/* Footer Section */}
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-5">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Starting from</span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          {meta.price ? `₹${meta.price}` : 'On Request'}
                        </span>
                      </div>
                      
                      <span className="bg-amber-50 text-amber-700 font-bold px-5 py-2.5 rounded-xl text-sm group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                  
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}