"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export default function HotelsListingPage() {
  const [hotels, setHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHotels()
  }, [])

  async function fetchHotels() {
    setLoading(true)
    // Supabase se hotels fetch kar rahe hain (category 'hotel' ya similar filter ke mutabiq)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('category', 'hotel')

    if (!error && data) {
      setHotels(data)
    } else {
      // Fallback agar category mismatch ho ya data na ho
      const { data: allData } = await supabase
        .from('listings')
        .select('*')
      if (allData) {
        setHotels(allData.filter(item => item.category?.toLowerCase().includes('hotel')))
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-6 text-center shadow-md">
        <h1 className="text-3xl md:text-4xl font-black mb-2">Explore Best Hotels & Resorts</h1>
        <p className="text-blue-100 text-sm md:text-base max-w-xl mx-auto">
          Find comfortable stays, luxury rooms, and verified homestays for your journey.
        </p>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <p className="text-gray-500 font-bold text-lg">No hotels found at the moment.</p>
            <Link href="/" className="inline-block mt-4 bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-all">
              &larr; Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => {
              const meta = hotel.metadata || {}
              return (
                <div key={hotel.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                  <div className="relative h-52 bg-gray-200">
                    {hotel.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hotel.image} alt={hotel.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
                    )}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-800 text-xs font-black px-3 py-1 rounded-full shadow-sm">
                      🏨 Hotel
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <span className="text-xs font-bold text-gray-400 mb-1">📍 {hotel.location || 'Maharashtra'}</span>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{hotel.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                      {meta.shortDescription || hotel.description?.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' || 'Experience top-class hospitality and comfort.'}
                    </p>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-blue-600">
                        {meta.price ? `₹${meta.price} / night` : 'Verified Stay'}
                      </span>
                      <Link 
                        href={`/hotel/${hotel.slug || hotel.id}`} 
                        className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        View Room &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}