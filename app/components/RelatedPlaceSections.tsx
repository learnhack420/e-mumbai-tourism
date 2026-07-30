"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' // Path adjust kar lena agar zarurat ho
import Link from 'next/link'

const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

export default function RelatedPlaceSections({ 
  placeId, 
  targetCity 
}: { 
  placeId: string, 
  targetCity: string 
}) {
  const [data, setData] = useState<any>({
    cityTours: [],
    cityPlaces: [],
    cityVendors: [],
    topTours: [],
    topCabs: [],
    topPlaces: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedData() {
      try {
        const [
          { data: cityTours },
          { data: cityPlaces },
          { data: cityVendors },
          { data: topTours },
          { data: topCabs },
          { data: topPlaces }
        ] = await Promise.all([
          // Tours in this city
          supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').ilike('location', `%${targetCity}%`).limit(8),
          // Other places in this city (excluding the current one)
          supabase.from('listings').select('id, title, slug, location, image, metadata').eq('category', 'destination').ilike('location', `%${targetCity}%`).neq('id', placeId).limit(8),
          // Vendors operating in this city
          supabase.from('profiles').select('id, full_name, company_name, location').eq('role', 'vendor').eq('approval_status', 'approved').ilike('location', `%${targetCity}%`).limit(8),
          // Top 10 Lists
          supabase.from('listings').select('title, slug').eq('category', 'tour').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'cab').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'destination').limit(10)
        ]);

        setData({
          cityTours: cityTours || [],
          cityPlaces: cityPlaces || [],
          cityVendors: cityVendors || [],
          topTours: topTours || [],
          topCabs: topCabs || [],
          topPlaces: topPlaces || []
        });
      } catch (error) {
        console.error("Error fetching related place sections:", error);
      } finally {
        setLoading(false);
      }
    }

    if (placeId) {
      fetchRelatedData();
    }
  }, [placeId, targetCity]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-6 py-10 flex justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4 w-full">
          <div className="h-8 w-64 bg-slate-200 rounded-full"></div>
          <div className="h-48 w-full bg-slate-100 rounded-2xl mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 mt-6 space-y-12">
      
      {/* Section 1: Tour Packages in This City */}
      {data.cityTours.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">Top Tour Packages in {targetCity || 'This Area'}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
            {data.cityTours.map((item: any) => {
              const img = item.metadata?.thumbnail || item.metadata?.gallery?.[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80';
              return (
                <Link key={item.id} href={`/tour/${item.slug}`} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden snap-start hover:shadow-md transition-all group">
                  <div className="h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 truncate mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 truncate mb-3">📍 {formatLocation(item.location)}</p>
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">⏱️ {item.metadata?.duration || 'Custom'}</span>
                      <span className="font-black text-slate-900">₹{item.price}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 2: More Tourist Places in This City */}
      {data.cityPlaces.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">More Places to Visit in {targetCity || 'This Area'}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
            {data.cityPlaces.map((item: any) => {
              const img = item.image || item.metadata?.gallery?.[0] || 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?w=600&q=80';
              return (
                <Link key={item.id} href={`/places/${item.slug}`} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden snap-start hover:shadow-md transition-all group">
                  <div className="h-48 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-900 text-xs font-bold px-2 py-1 rounded-md">
                      Explore
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 truncate mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 truncate">📍 {formatLocation(item.location)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 3: Verified Vendors/Travel Agents in This City */}
      {data.cityVendors.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">Travel Agents & Providers in {targetCity || 'This Area'}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
            {data.cityVendors.map((vendor: any) => (
              <div key={vendor.id} className="min-w-[260px] bg-white p-6 rounded-3xl border border-slate-200 shadow-sm snap-start flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mb-4 border-2 border-white shadow-sm">
                  {vendor.company_name ? vendor.company_name.charAt(0).toUpperCase() : '🏢'}
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-1 truncate w-full">{vendor.company_name || vendor.full_name}</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">📍 {formatLocation(vendor.location)}</p>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg w-full">
                  ✅ Verified Partner
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Top 10 Lists (3 Columns) */}
      <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Column 1: Top Tours */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b-2 border-blue-500 pb-3 mb-5 inline-block">🏆 Top Tour Packages</h3>
            <ul className="space-y-3">
              {data.topTours.map((t: any, i: number) => (
                <li key={i}>
                  <Link href={`/tour/${t.slug}`} className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:pl-2 transition-all flex gap-2">
                    <span className="text-blue-400 font-bold">➤</span> <span className="truncate">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Top Cabs */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b-2 border-emerald-500 pb-3 mb-5 inline-block">🚖 Top Cab Services</h3>
            <ul className="space-y-3">
              {data.topCabs.map((c: any, i: number) => (
                <li key={i}>
                  <Link href={`/cabs/${c.slug}`} className="text-sm font-medium text-slate-600 hover:text-emerald-600 hover:pl-2 transition-all flex gap-2">
                    <span className="text-emerald-400 font-bold">➤</span> <span className="truncate">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Top Places */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b-2 border-amber-500 pb-3 mb-5 inline-block">📍 Top Tourist Places</h3>
            <ul className="space-y-3">
              {data.topPlaces.map((p: any, i: number) => (
                <li key={i}>
                  <Link href={`/places/${p.slug}`} className="text-sm font-medium text-slate-600 hover:text-amber-600 hover:pl-2 transition-all flex gap-2">
                    <span className="text-amber-400 font-bold">➤</span> <span className="truncate">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

    </div>
  )
}