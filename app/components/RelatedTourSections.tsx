"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' 
import Link from 'next/link'

const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

// 🌟 SMART CITY EXTRACTOR: Area ko ignore karke sirf City nikalega
const extractCityName = (locStr?: string) => {
  if (!locStr || locStr === 'Not specified') return '';
  const parts = locStr.split(',').map(s => s.trim());
  
  // Agar "Area, City, State" format hai, toh 2nd item (City) lega
  if (parts.length >= 3) {
    return parts[parts.length - 2]; // hamesha state ke pehle wala city hota hai
  } 
  // Agar "City, State" ya sirf "City" hai, toh 1st item lega
  return parts[0];
}

export default function RelatedTourSections({ 
  tourId, 
  vendorId, 
  location, 
  targetCity,
  originCity 
}: { 
  tourId: string, 
  vendorId: string, 
  location: string, 
  targetCity: string,
  originCity?: string 
}) {
  const [data, setData] = useState<any>({
    sameVendorTours: [],
    sameRouteTours: [],
    toursFromOrigin: [], 
    toursToDestination: [], 
    destinationPlaces: [],
    topTours: [],
    topCabs: [],
    topPlaces: []
  });
  
  const [placesHeading, setPlacesHeading] = useState(`📍 Places in ${extractCityName(targetCity) || 'India'}`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedData() {
      try {
        // 🌟 NAYA FIX: Sirf City fetch karega, Area nahi
        const shortOrigin = extractCityName(originCity);
        const shortTarget = extractCityName(targetCity);

        const [
          { data: sameVendorTours },
          { data: sameRouteTours },
          { data: topTours },
          { data: topCabs },
          { data: cityPlaces }, 
          { data: toursFromOrigin }, 
          { data: toursToDestination },
          { data: fallbackPlaces } 
        ] = await Promise.all([
          supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').eq('vendor_id', vendorId).neq('id', tourId).limit(8),
          supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').eq('location', location).neq('vendor_id', vendorId).limit(8),
          supabase.from('listings').select('title, slug').eq('category', 'tour').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'cab').limit(10),
          
          // 🌟 Places strictly using shortTarget (Exact City)
          shortTarget ? supabase.from('listings').select('id, title, slug, location, image, metadata').eq('category', 'destination').ilike('location', `%${shortTarget}%`).limit(8) : Promise.resolve({ data: [] }),
          
          shortOrigin ? supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').ilike('location', `%${shortOrigin}%`).limit(8) : Promise.resolve({ data: [] }),
          
          shortTarget ? supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').ilike('location', `%${shortTarget}%`).limit(8) : Promise.resolve({ data: [] }),

          supabase.from('listings').select('title, slug').eq('category', 'destination').limit(10)
        ]);

        let finalPlaces = cityPlaces || [];
        let heading = shortTarget ? `📍 Places in ${shortTarget}` : '📍 Top Tourist Places';

        if (finalPlaces.length === 0) {
          finalPlaces = fallbackPlaces || [];
          heading = '📍 Top Tourist Places';
        }

        setData({
          sameVendorTours: sameVendorTours || [],
          sameRouteTours: sameRouteTours || [],
          toursFromOrigin: toursFromOrigin || [], 
          toursToDestination: toursToDestination || [], 
          destinationPlaces: cityPlaces || [],
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
  }, [tourId, vendorId, location, targetCity, originCity]);

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

  const renderTourCard = (item: any) => {
    const img = item.metadata?.thumbnail || item.metadata?.gallery?.[0] || 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?w=600&q=80';
    return (
      <Link key={item.id} href={`/tour/${item.slug}`} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-start hover:shadow-md transition-all group flex flex-col">
        <div className="h-48 overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 truncate mb-1">{item.title}</h3>
          <p className="text-xs text-gray-500 truncate mb-3">📍 {formatLocation(item.location)}</p>
          <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">⏱️ {item.metadata?.duration || 'Custom'}</span>
            <span className="font-black text-gray-900">₹{item.price}</span>
          </div>
        </div>
      </Link>
    )
  }

  const renderPlaceCard = (item: any) => {
    const meta = typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {};
    let extractedImg = item.image || meta.thumbnail || meta.image;
    if (!extractedImg && Array.isArray(meta.gallery) && meta.gallery.length > 0) {
      extractedImg = meta.gallery[0];
    }
    const img = extractedImg || 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?w=600&q=80';

    return (
      <Link key={item.id} href={`/places/${item.slug || item.id}`} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden snap-start hover:shadow-xl transition-all duration-300 group flex flex-col">
        <div className="h-48 overflow-hidden bg-emerald-50 relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors line-clamp-1">{item.title}</h3>
            <p className="text-xs text-slate-500 truncate mt-1">📍 {formatLocation(item.location)}</p>
          </div>
          <div className="mt-4 border-t border-slate-50 pt-4 text-right">
            <span className="text-xs font-bold text-emerald-700 inline-block bg-emerald-50 px-4 py-2 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              Explore Place →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Final exact city names for headings
  const finalOrigin = extractCityName(originCity);
  const finalTarget = extractCityName(targetCity);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16 space-y-12">
        
      {/* Section 1: Other Tours by Same Vendor */}
      {data.sameVendorTours.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">More Tours by this Agency</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide items-stretch">
            {data.sameVendorTours.map(renderTourCard)}
          </div>
        </section>
      )}

      {/* SECTION: Tours From Origin */}
      {data.toursFromOrigin.length > 0 && finalOrigin && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Tour Packages From {finalOrigin}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide items-stretch">
            {data.toursFromOrigin.map(renderTourCard)}
          </div>
        </section>
      )}

      {/* SECTION: Trip To Destination */}
      {data.toursToDestination.length > 0 && finalTarget && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Trip To {finalTarget}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide items-stretch">
            {data.toursToDestination.map(renderTourCard)}
          </div>
        </section>
      )}

      {/* 🌟 SECTION: Places To Visit in Destination */}
      {data.destinationPlaces.length > 0 && finalTarget && (
        <section className="bg-emerald-50/50 p-6 md:p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
          <h2 className="text-2xl font-black text-emerald-950 mb-6 flex items-center gap-2">
            <span>📍</span> Places to visit in {finalTarget}
          </h2>
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide items-stretch">
            {data.destinationPlaces.map(renderPlaceCard)}
          </div>
        </section>
      )}

      {/* Section: Similar Tours on Same Route */}
      {data.sameRouteTours.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Similar Tours on this Route</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide items-stretch">
            {data.sameRouteTours.map(renderTourCard)}
          </div>
        </section>
      )}

      {/* Section 3: Top 10 Lists (Footer Grid) */}
      <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm mt-8">
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