import { supabase } from '../../../utils/supabase'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TourBookingSidebar from '../../components/TourBookingSidebar'
import AIAutoRoutePlanner from '../../components/AIAutoRoutePlanner'
import VendorInfoCard from '../../components/VendorInfoCard'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: tour } = await supabase.from('listings').select('*').eq('slug', slug).single()
  
  if (!tour) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUUID) {
      const { data: tourById } = await supabase.from('listings').select('*').eq('id', slug).single()
      tour = tourById
    }
  }

  if (!tour) return { title: 'Tour Not Found' }

  const seo = tour.metadata?.seo || {}
  
  return {
    title: seo.metaTitle || `${tour.title} | India Tour Operators`,
    description: seo.metaDescription || `Book ${tour.title} at best prices. Explore itinerary and inclusions.`,
    keywords: seo.metaKeywords || `${tour.title}, tour package, book cab, hotel`,
    openGraph: {
      images: [tour.metadata?.thumbnail || tour.metadata?.gallery?.[0] || ''],
    }
  }
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: tour } = await supabase.from('listings').select('*').eq('slug', slug).single()

  if (!tour) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUUID) {
      const { data: tourById } = await supabase.from('listings').select('*').eq('id', slug).single()
      tour = tourById
    }
  }

  if (!tour) return notFound() 

  const meta = tour.metadata || {}
  const thumbnail = meta.thumbnail || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1200')
  const gallery = meta.gallery || []
  
  // Logic for Origin, Destinations & Places to Visit
  const locationParts = tour.location ? tour.location.split('➔').map((s: string) => s.trim()) : []
  const origin = locationParts.length > 0 ? locationParts[0] : 'Not specified'
  const destinationsCovered = locationParts.length > 1 ? locationParts[1] : tour.location

  const placesToVisitStr = meta.placesToVisit && meta.placesToVisit.length > 0 
    ? meta.placesToVisit.join(', ') 
    : destinationsCovered
    
  // Local vs Outstation Check logic
  const isLocalTour = origin.toLowerCase() === destinationsCovered.toLowerCase()

  // Logic for Pickup Times 12-hour format
  const formatTime12hr = (time24: string) => {
    if (!time24) return ''
    const [h, m] = time24.split(':')
    const hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${m} ${ampm}`
  }
  const pickupTimesStr = meta.pickupTimes && meta.pickupTimes.length > 0
    ? meta.pickupTimes.map(formatTime12hr).join(', ')
    : 'Flexible / Not fixed'

  // Extract Best Time to Visit Data
  const bestTimeToVisitText = meta.bestTimeToVisit || ''
  const bestMonths = meta.bestMonths || []

  const itineraryDays = meta.itineraryDays || []

  // Helper to format Inclusions & Exclusions with Emoji prefix per line
  const formatListWithEmoji = (text: string, emoji: string) => {
    if (!text) return null
    return text.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
      <div key={idx} className="flex items-start gap-2 mt-1">
        <span>{emoji}</span>
        <span className="flex-1">{line.replace(/^[✅❌\-\*]\s*/, '')}</span>
      </div>
    ))
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px] w-full bg-gray-900">
        <img src={thumbnail} alt={tour.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-6xl mx-auto">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
            Tour Package
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 leading-tight">{tour.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-200 font-medium">
            <span className="flex items-center gap-1">📍 {tour.location}</span>
            <span className="flex items-center gap-1">⏱️ {meta.duration || 'Custom Duration'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. TOUR INFORMATION BOX */}
          <section className="bg-white p-0 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-extrabold text-white">📋 Tour Information</h2>
              <p className="text-blue-100 text-sm mt-1">Key details about your journey</p>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 text-xl">🛫</div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start From (Origin)</span>
                  <span className="font-bold text-gray-900 text-lg">{origin}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-3 rounded-full text-green-600 text-xl">🎯</div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Destinations Covered</span>
                  <span className="font-bold text-gray-900 text-lg">{destinationsCovered}</span>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-4 pt-4 border-t border-gray-100">
                <div className="bg-purple-50 p-3 rounded-full text-purple-600 text-xl">📸</div>
                <div className="w-full">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Places to Visit</span>
                  <div className="flex flex-wrap gap-2">
                    {placesToVisitStr.split(',').map((place: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm font-medium border border-gray-200">
                        {place.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-4 pt-4 border-t border-gray-100">
                <div className="bg-orange-50 p-3 rounded-full text-orange-600 text-xl">⏰</div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fixed Pickup Times</span>
                  <span className="font-bold text-gray-900">{pickupTimesStr}</span>
                </div>
              </div>

              {/* Best Time to Visit Block */}
              {(bestTimeToVisitText || bestMonths.length > 0) && (
                <div className="md:col-span-2 bg-yellow-50 rounded-xl p-5 border border-yellow-100 mt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🌤️</span>
                    <h3 className="text-lg font-bold text-yellow-900">Best Time to Visit</h3>
                  </div>
                  
                  {bestTimeToVisitText && (
                    <p className="text-yellow-800 text-sm font-medium mb-3 leading-relaxed">
                      {bestTimeToVisitText}
                    </p>
                  )}

                  {bestMonths.length > 0 && (
                    <div>
                      <span className="block text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">Recommended Months:</span>
                      <div className="flex flex-wrap gap-2">
                        {bestMonths.map((month: string, idx: number) => (
                          <span key={idx} className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                            {month}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </section>

          {/* 2. GALLERY */}
          {gallery.length > 0 && (
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">Tour Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-32 md:h-40 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={imgUrl} alt={`Gallery Image ${idx+1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. OVERVIEW */}
          {meta.overview && (
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">Overview of {tour.title}</h2>
              <div 
                className="prose max-w-none text-gray-600 leading-relaxed break-words overflow-x-auto" 
                dangerouslySetInnerHTML={{ __html: meta.overview }} 
              />
            </section>
          )}

          {/* 4. DAY-WISE ITINERARY */}
          {(itineraryDays.length > 0 || meta.itinerary) && (
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b pb-2">Day-wise Itinerary</h2>
              {itineraryDays.length > 0 ? (
                <div className="space-y-6">
                  {itineraryDays.map((day: any, idx: number) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-blue-200">
                      <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1 ring-4 ring-blue-50"></div>
                      <h3 className="text-lg font-extrabold text-gray-900">Day {day.day}: {day.title}</h3>
                      <p className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-wrap">{day.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{meta.itinerary}</div>
              )}
            </section>
          )}

          {/* 5. INCLUSIONS & EXCLUSIONS */}
          {(meta.inclusions || meta.exclusions) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meta.inclusions && (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">✅ Price Includes</h3>
                  <div className="text-green-800 text-sm space-y-1">
                    {formatListWithEmoji(meta.inclusions, '✅')}
                  </div>
                </div>
              )}
              {meta.exclusions && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">❌ Not Included</h3>
                  <div className="text-red-800 text-sm space-y-1">
                    {formatListWithEmoji(meta.exclusions, '❌')}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 6. HOW TO REACH & ROUTE MAP */}
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b pb-2">
              {isLocalTour ? "Local Sightseeing Map" : "How to Reach & Route Map"}
            </h2>
            
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                {isLocalTour ? (
                  <>
                    <p className="text-sm text-gray-600 font-medium mb-4">
                      Explore the best local attractions in <strong className="text-gray-900">{destinationsCovered}</strong>:
                    </p>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
                      <span className="text-2xl">🚖</span>
                      <div>
                        <h4 className="font-bold text-blue-900">Local Cab Booking</h4>
                        <p className="text-xs text-blue-800 mt-1">Book our comfortable local cabs directly from the sidebar. We provide convenient pickup and drop for all sightseeing points.</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex gap-4 items-start">
                      <span className="text-2xl">📸</span>
                      <div>
                        <h4 className="font-bold text-purple-900">Key Attractions</h4>
                        <p className="text-xs text-purple-800 mt-1">This package covers major attractions. You can customize your local itinerary and spend as much time as you need at each spot.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <AIAutoRoutePlanner 
                    origin={origin} 
                    destination={destinationsCovered} 
                  />
                )}
              </div>
            </div>
          </section>

          {/* 7. FAQS */}
          {meta.faqs && meta.faqs.length > 0 && (
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {meta.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <h4 className="font-bold text-gray-800 flex gap-2"><span>❓</span> {faq.question}</h4>
                    <p className="text-gray-600 text-sm mt-2 flex gap-2"><span>👉</span> {faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tour?.vendor_id && <VendorInfoCard vendorId={tour.vendor_id} />}

        </div>

        {/* Right Sidebar Booking Widget Component */}
        <div className="lg:col-span-1">
          <TourBookingSidebar tour={tour} meta={meta} destinations={destinationsCovered} />
        </div>

      </div>
    </main>
  )
}