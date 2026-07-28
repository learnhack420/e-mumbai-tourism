"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

// TypeScript definition updated to match AddCabListing form fields exactly
interface Cab {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  image?: string;
  thumbnail?: string;
  location?: string;
  description?: string;
  price?: number; // Form saves lowest price here
  metadata?: {
    shortDescription?: string;
    price?: number | string;
    seats?: string | number;
    mainType?: string;    // From form (e.g. Local | Outstation)
    subType?: string;     // From form (e.g. Point to Point | One Way)
    gallery?: string[];   // From form (Array of image URLs)
  };
}

export default function CabsListingPage() {
  const [cabs, setCabs] = useState<Cab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCabs()
  }, [])

  async function fetchCabs() {
    setLoading(true)
    setError(null)
    
    try {
      // Primary search for exact category
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('category', 'cab')

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setCabs(data)
      } else {
        // Fallback filter if exact category match fails
        const { data: allData, error: allDataError } = await supabase
          .from('listings')
          .select('*')
        
        if (allDataError) throw allDataError

        if (allData) {
          const filtered = allData.filter(item => {
            const cat = item.category?.toLowerCase() || ''
            return cat.includes('cab') || cat.includes('taxi')
          })
          setCabs(filtered)
        }
      }
    } catch (err: any) {
      console.error("Error fetching cabs:", err)
      setError("We couldn't load the cabs right now. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* --- PRO HERO SECTION --- */}
      <section className="relative bg-slate-900 text-white py-20 px-6 text-center overflow-hidden">
        {/* Subtle background gradient overlay for Cabs (Emerald/Teal Theme) */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/90 to-slate-900/90 z-0"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase mb-4 block">
            Premium Transport
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight drop-shadow-md">
            Book Reliable Cabs & Taxis
          </h1>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed drop-shadow">
            Comfortable outstation cabs, local sightseeing rides, and verified local drivers for a safe journey.
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
              onClick={fetchCabs}
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
        ) : cabs.length === 0 && !error ? (
          
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 px-8 max-w-2xl mx-auto">
            {/* Empty State */}
            <div className="text-6xl mb-6">🚖</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Cabs Found</h3>
            <p className="text-slate-500 mb-8 text-lg">We couldn&apos;t find any cab services at the moment. Please check back later.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95">
              &larr; Return to Home
            </Link>
          </div>
          
        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Data Grid */}
            {cabs.map((cab) => {
              const meta = cab.metadata || {}
              
              // IMAGE FIX: Check 'meta.gallery' first, fallback to image/thumbnail
              const imageUrl = cab.image || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : null) || cab.thumbnail || null;

              // TEXT FIX: Clean up the formatted description generated by the form
              let cleanDescription = 'Safe and comfortable taxi service for your journey.';
              if (meta.shortDescription) {
                cleanDescription = meta.shortDescription;
              } else if (cab.description) {
                cleanDescription = cab.description
                  .replace(/<[^>]*>?/gm, '') 
                  .replace(/&nbsp;/g, ' ')   
                  .replace(/&amp;/g, '&')    
                  .replace(/&quot;/g, '"')   
                  .substring(0, 130) + '...';
              }

              // SMART BADGE LOGIC
              const mainType = meta.mainType; 
              const subType = meta.subType;
              const seats = meta.seats;

              let badgeText = '🚖 Cab Service';
              if (mainType) {
                const isOutstation = mainType.toLowerCase().includes('outstation');
                const icon = isOutstation ? '🛣️' : '🏙️'; 
                badgeText = `${icon} ${mainType}${subType ? ` - ${subType}` : ''}`;
              } else if (seats) {
                badgeText = `🚗 ${seats} Seater`;
              }

              // PRICE FIX: Pick up the lowest price calculated by the form
              const displayPrice = cab.price || meta.price;

              return (
                // Clickable Card Wrapper
                <Link 
                  href={`/cabs/${cab.slug || cab.id}`} 
                  key={cab.id} 
                  className="group bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  
                  {/* Image Container */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={imageUrl} 
                        alt={cab.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      // 🔥 DYNAMIC TEXT THUMBNAIL (Agar image upload nahi hui hai)
                      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 text-center transition-transform duration-700 group-hover:scale-105">
                        <span className="text-4xl mb-3 drop-shadow-lg">🚖</span>
                        <h4 className="font-black text-xl leading-tight line-clamp-2 drop-shadow-md">
                          {cab.title || cab.location || "Premium Cab Service"}
                        </h4>
                        <div className="w-12 h-1 bg-emerald-400 mt-3 rounded-full opacity-70"></div>
                      </div>
                    )}
                    
                    {/* Floating Badge (Trip Type & SubType) */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <span className="bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                        {badgeText}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-emerald-500 text-sm">📍</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest line-clamp-1">
                        {cab.location || 'India'}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {cab.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow whitespace-pre-line">
                      {cleanDescription}
                    </p>

                    {/* Footer Section */}
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          {subType === 'Round Trip' ? 'Starting Rate' : 'Starting from'}
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          {displayPrice ? `₹${displayPrice}${subType === 'Round Trip' ? '/km' : ''}` : 'On Request'}
                        </span>
                      </div>
                      
                      {/* Button inside link span */}
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-5 py-2.5 rounded-xl text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm whitespace-nowrap ml-2">
                        Book Ride &rarr;
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