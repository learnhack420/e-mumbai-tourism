"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export default function ToursListingPage() {
  const [tours, setTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTours()
  }, [])

  async function fetchTours() {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .or('category.eq.tour,category.eq.package,category.eq.tours')

    if (!error && data && data.length > 0) {
      setTours(data)
    } else {
      const { data: allData } = await supabase
        .from('listings')
        .select('*')
      
      if (allData) {
        const filtered = allData.filter(item => {
          const cat = item.category?.toLowerCase() || ''
          return cat.includes('tour') || cat.includes('package') || cat.includes('holiday')
        })
        setTours(filtered)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-12 px-6 text-center shadow-md">
        <h1 className="text-3xl md:text-4xl font-black mb-2">Explore Popular Tour Packages</h1>
        <p className="text-amber-100 text-sm md:text-base max-w-xl mx-auto">
          Discover the best sightseeing trips, holiday packages, and custom tours.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <p className="text-gray-500 font-bold text-lg">No tour packages found.</p>
            <Link href="/" className="inline-block mt-4 bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-amber-700 transition-all">
              &larr; Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => {
              const meta = tour.metadata || {}
              return (
                <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                  <div className="relative h-52 bg-gray-200">
                    {tour.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
                    )}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-amber-800 text-xs font-black px-3 py-1 rounded-full shadow-sm">
                      {tour.category || 'Tour'}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <span className="text-xs font-bold text-gray-400 mb-1">📍 {tour.location || 'Maharashtra'}</span>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{tour.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                      {meta.shortDescription || tour.description?.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' || 'Explore this amazing tour package.'}
                    </p>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-emerald-600">
                        {meta.price ? `₹${meta.price}` : 'Verified Package'}
                      </span>
                      <Link 
                        href={`/tour/${tour.slug || tour.id}`} 
                        className="bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-amber-700 transition-colors shadow-sm"
                      >
                        View Package &rarr;
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