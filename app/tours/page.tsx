"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

// Proper TypeScript definition for better code quality
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
  };
}

export default function ToursListingPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* --- PRO HERO SECTION --- */}
      <section className="relative bg-slate-900 text-white py-20 px-6 text-center overflow-hidden">
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

      {/* --- CONTENT SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 px-8 max-w-2xl mx-auto">
            {/* Empty State */}
            <div className="text-6xl mb-6">🧳</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Packages Found</h3>
            <p className="text-slate-500 mb-8 text-lg">We couldn&apos;t find any tour packages at the moment. Please check back later.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95">
              &larr; Return to Home
            </Link>
          </div>
          
        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Data Grid */}
            {tours.map((tour) => {
              const meta = tour.metadata || {}
              
              // IMAGE FIX: Har possible column name check karega
              const imageUrl = tour.image || tour.thumbnail || meta.thumbnail || meta.image || null;

              // TEXT FIX: HTML tags aur &nbsp; dono ko clean karega
              let cleanDescription = 'Experience an unforgettable journey with our curated travel itinerary.';
              if (meta.shortDescription) {
                cleanDescription = meta.shortDescription;
              } else if (tour.description) {
                cleanDescription = tour.description
                  .replace(/<[^>]*>?/gm, '') // HTML tags hatayega
                  .replace(/&nbsp;/g, ' ')   // &nbsp; ko normal space banayega
                  .replace(/&amp;/g, '&')    // &amp; ko & banayega
                  .replace(/&quot;/g, '"')   // quotes theek karega
                  .substring(0, 120) + '...';
              }

              return (
                // Pura card ab ek <Link> tag ban gaya hai
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
                    
                    {/* Floating Badges - YAHAN PAR DURATION ADD KIYA GAYA HAI */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <span className="bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                        {meta.duration ? `⏳ ${meta.duration}` : (tour.category || 'Package')}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-500 text-sm">📍</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {tour.location || 'India'}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-amber-600 transition-colors">
                      {tour.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                      {cleanDescription}
                    </p>

                    {/* Footer Section */}
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Starting from</span>
                        <span className="text-lg font-black text-slate-900">
                          {meta.price ? `₹${meta.price}` : 'On Request'}
                        </span>
                      </div>
                      
                      {/* Inner button link ko span mein convert kiya taaki error na aaye */}
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