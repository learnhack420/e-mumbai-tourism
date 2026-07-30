"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' // Path check kar lijiyega, ya '../utils/supabase' use karein
import Link from 'next/link'

const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

export default function RelatedTourSections({ 
  tourId, 
  vendorId, 
  location, 
  targetCity 
}: { 
  tourId: string, 
  vendorId: string, 
  location: string, 
  targetCity: string 
}) {
  const [data, setData] = useState<any>({
    sameVendorTours: [],
    sameRouteTours: [],
    topTours: [],
    topCabs: [],
    topPlaces: []
  });
  const [placesHeading, setPlacesHeading] = useState(`📍 Places in ${targetCity || 'India'}`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedData() {
      try {
        const [
          { data: sameVendorTours },
          { data: sameRouteTours },
          { data: topTours },
          { data: topCabs },
          { data: cityPlaces }
        ] = await Promise.all([
          supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').eq('vendor_id', vendorId).neq('id', tourId).limit(8),
          supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').eq('location', location).neq('vendor_id', vendorId).limit(8),
          supabase.from('listings').select('title, slug').eq('category', 'tour').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'cab').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'destination').ilike('location', `%${targetCity}%`).limit(10)
        ]);

        let finalPlaces = cityPlaces || [];
        let heading = targetCity ? `📍 Places in ${targetCity}` : '📍 Top Tourist Places';

        if (finalPlaces.length === 0) {
          const { data: fallbackPlaces } = await supabase.from('listings').select('title, slug').eq('category', 'destination').limit(10);
          finalPlaces = fallbackPlaces || [];
          heading = '📍 Top Tourist Places';
        }

        setData({
          sameVendorTours: sameVendorTours || [],
          sameRouteTours: sameRouteTours || [],
          topTours: topTours || [],
          topCabs: topCabs || [],
          topPlaces: finalPlaces
        });
        setPlacesHeading(heading);
      } catch (error) {
        console.error("Error fetching related sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedData();
  }, [tourId, vendorId, location, targetCity]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16 py-10 flex justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-64 bg-gray-200 rounded-full"></div>
          <div className="h-48 w-full bg-gray-100 rounded-2xl mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16 space-y-12">
        
      {/* Section 1: Other Tours by Same Vendor */}
      {data.sameVendorTours.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">More Tours by this Agency</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
            {data.sameVendorTours.map((item: any) => {
              const img = item.metadata?.thumbnail || item.metadata?.gallery?.[0] || 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?w=600&q=80';
              return (
                <Link key={item.id} href={`/tour/${item.slug}`} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-start hover:shadow-md transition-all group">
                  <div className="h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 truncate mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 truncate mb-3">📍 {formatLocation(item.location)}</p>
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">⏱️ {item.metadata?.duration || 'Custom'}</span>
                      <span className="font-black text-gray-900">₹{item.price}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 2: Similar Tours on Same Route */}
      {data.sameRouteTours.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Similar Tours on this Route</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
            {data.sameRouteTours.map((item: any) => {
              const img = item.metadata?.thumbnail || item.metadata?.gallery?.[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80';
              return (
                <Link key={item.id} href={`/tour/${item.slug}`} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-start hover:shadow-md transition-all group">
                  <div className="h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 truncate mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 truncate mb-3">📍 {formatLocation(item.location)}</p>
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">⏱️ {item.metadata?.duration || 'Custom'}</span>
                      <span className="font-black text-gray-900">₹{item.price}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 3: Top 10 Lists */}
      <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-black text-gray-900 border-b-2 border-blue-500 pb-3 mb-4 inline-block">🏆 Top Tour Packages</h3>
            <ul className="space-y-3">
              {data.topTours.map((t: any, i: number) => (
                <li key={i}>
                  <Link href={`/tour/${t.slug}`} className="text-sm font-medium text-gray-600 hover:text-blue-600 hover:pl-2 transition-all flex gap-2">
                    <span className="text-blue-400">➤</span> <span className="truncate">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 border-b-2 border-emerald-500 pb-3 mb-4 inline-block">🚖 Top Cab Services</h3>
            <ul className="space-y-3">
              {data.topCabs.map((c: any, i: number) => (
                <li key={i}>
                  <Link href={`/cabs/${c.slug}`} className="text-sm font-medium text-gray-600 hover:text-emerald-600 hover:pl-2 transition-all flex gap-2">
                    <span className="text-emerald-400">➤</span> <span className="truncate">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 border-b-2 border-amber-500 pb-3 mb-4 inline-block">{placesHeading}</h3>
            <ul className="space-y-3">
              {data.topPlaces.map((p: any, i: number) => (
                <li key={i}>
                  <Link href={`/places/${p.slug}`} className="text-sm font-medium text-gray-600 hover:text-amber-600 hover:pl-2 transition-all flex gap-2">
                    <span className="text-amber-400">➤</span> <span className="truncate">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}