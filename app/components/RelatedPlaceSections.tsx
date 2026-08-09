"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' 
import Link from 'next/link'

const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

// 🌟 SMART CITY EXTRACTOR
const extractCityName = (locStr?: string) => {
  if (!locStr || locStr === 'Not specified') return '';
  const parts = locStr.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    return parts[parts.length - 3];
  }
  return parts[0];
}

// 🌟 SMART EMOJI MAPPER FOR CATEGORIES
const getCategoryEmoji = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('historical') || cat.includes('history') || cat.includes('fort') || cat.includes('heritage')) return '🏛️';
  if (cat.includes('nature') || cat.includes('hill') || cat.includes('mountain') || cat.includes('waterfall')) return '⛰️';
  if (cat.includes('beach') || cat.includes('water') || cat.includes('lake') || cat.includes('island')) return '🏖️';
  if (cat.includes('temple') || cat.includes('religious') || cat.includes('pilgrimage') || cat.includes('spiritual')) return '🛕';
  if (cat.includes('wildlife') || cat.includes('zoo') || cat.includes('park') || cat.includes('animal')) return '🐅';
  if (cat.includes('adventure') || cat.includes('trekking') || cat.includes('camping')) return '⛺';
  return '🌟'; 
}

export default function RelatedPlaceSections({ 
  placeId, 
  targetCity 
}: { 
  placeId: string, 
  targetCity: string 
}) {
  const [data, setData] = useState<any>({
    destinationTours: [],
    cityPlaces: [],
    cityVendors: [],
    categoryPlaces: {}, 
    topTours: [],
    topCabs: [],
    topPlaces: []
  });
  const [loading, setLoading] = useState(true);

  const finalTarget = extractCityName(targetCity);

  useEffect(() => {
    async function fetchRelatedData() {
      try {
        const finalTargetCity = extractCityName(targetCity);

        // 🌟 Safe Queries targeting exact existing columns to avoid 400 errors
        const [
          { data: rawTours },
          { data: rawCityPlaces },
          { data: rawCityVendors },
          { data: topTours },
          { data: topCabs },
          { data: topPlaces },
          { data: currentPlace },   
          { data: allDestinations } 
        ] = await Promise.all([
          supabase.from('listings').select('id, title, slug, location, price, metadata').eq('category', 'tour').limit(50),
          supabase.from('listings').select('id, title, slug, location, metadata').eq('category', 'destination').neq('id', placeId).limit(50),
          supabase.from('profiles').select('id, full_name, company_name').eq('role', 'vendor').eq('approval_status', 'approved').limit(20),
          supabase.from('listings').select('title, slug').eq('category', 'tour').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'cab').limit(10),
          supabase.from('listings').select('title, slug').eq('category', 'destination').limit(10),
          supabase.from('listings').select('metadata').eq('id', placeId).single(),
          supabase.from('listings').select('id, title, slug, location, metadata').eq('category', 'destination').neq('id', placeId).limit(200)
        ]);

        // 🌟 Filter Tours strictly by Destination matching the target city
        const destinationTours = (rawTours || []).filter((tour: any) => {
          if (!finalTargetCity) return true;
          const meta = typeof tour.metadata === 'string' ? JSON.parse(tour.metadata) : (tour.metadata || {});
          const tourDest = (meta.destination || '').toLowerCase();
          return tourDest.includes(finalTargetCity.toLowerCase());
        }).slice(0, 9);

        // 🌟 Safe City Filtering via JavaScript for Places
        const cityFilteredPlaces = (rawCityPlaces || []).filter((item: any) => {
          if (!finalTargetCity) return true;
          const loc = (item.location || '').toLowerCase();
          return loc.includes(finalTargetCity.toLowerCase());
        }).slice(0, 8);

        const cityFilteredVendors = (rawCityVendors || []).filter((vendor: any) => {
          if (!finalTargetCity) return true;
          const loc = (vendor.location || '').toLowerCase();
          return loc.includes(finalTargetCity.toLowerCase());
        }).slice(0, 8);

        // 🌟 Current place ki categories fetch karna (Robust Parsing)
        let currentCategories: string[] = [];
        if (currentPlace) {
          const meta = typeof currentPlace.metadata === 'string' ? JSON.parse(currentPlace.metadata) : (currentPlace.metadata || {});
          
          if (Array.isArray(meta.placeCategories) && meta.placeCategories.length > 0) {
            currentCategories = meta.placeCategories;
          } else if (typeof meta.placeCategories === 'string' && meta.placeCategories) {
            currentCategories = meta.placeCategories.split(',').map((s: string) => s.trim());
          } else if (Array.isArray(meta.categories) && meta.categories.length > 0) {
            currentCategories = meta.categories;
          } else if (typeof meta.categories === 'string' && meta.categories) {
            currentCategories = meta.categories.split(',').map((s: string) => s.trim());
          } else if (Array.isArray(meta.category) && meta.category.length > 0) {
            currentCategories = meta.category;
          } else if (typeof meta.category === 'string' && meta.category) {
            currentCategories = meta.category.split(',').map((s: string) => s.trim());
          }
        }

        // 🌟 Categories ke aadhar par places filter karna
        const catPlacesResult: Record<string, any[]> = {};
        const safeDests = allDestinations || [];

        currentCategories.filter(Boolean).forEach(cat => {
          const matchedPlaces = safeDests.filter(d => {
            const m = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : (d.metadata || {});
            
            let pCats: string[] = [];
            if (Array.isArray(m.placeCategories)) pCats = m.placeCategories;
            else if (typeof m.placeCategories === 'string') pCats = m.placeCategories.split(',').map((s: string) => s.trim());
            else if (Array.isArray(m.categories)) pCats = m.categories;
            else if (typeof m.categories === 'string') pCats = m.categories.split(',').map((s: string) => s.trim());
            else if (Array.isArray(m.category)) pCats = m.category;
            else if (typeof m.category === 'string') pCats = m.category.split(',').map((s: string) => s.trim());
            
            return pCats.some(c => c.trim().toLowerCase() === cat.trim().toLowerCase());
          });

          if (matchedPlaces.length > 0) {
            catPlacesResult[cat] = matchedPlaces.slice(0, 8);
          }
        });

        setData({
          destinationTours: destinationTours,
          cityPlaces: cityFilteredPlaces,
          cityVendors: cityFilteredVendors,
          categoryPlaces: catPlacesResult, 
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

  const renderTourCard = (item: any) => {
    const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {});
    const img = item.image || meta?.thumbnail || meta?.image || meta?.gallery?.[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80';
    const tourDestination = meta?.destination || finalTarget || 'Explore Destination';

    return (
      <Link key={item.id} href={`/tour/${item.slug}`} className="w-[320px] md:w-[350px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0 hover:shadow-md transition-all group flex flex-col self-stretch h-auto">
        <div className="h-48 overflow-hidden shrink-0 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
          <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            Tour Package
          </div>
          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[10px] font-black px-2 py-1.5 rounded-md shadow-sm">
            🚩 To: {tourDestination}
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-900 truncate mb-1">{item.title}</h3>
          <p className="text-xs text-slate-500 truncate mb-3">📍 Starts from: {formatLocation(item.location)}</p>
          <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">⏱️ {meta?.duration || 'Custom'}</span>
            <span className="font-black text-slate-900">₹{item.price}</span>
          </div>
        </div>
      </Link>
    )
  }

  const renderPlaceCard = (item: any) => {
    const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {});
    const img = item.image || meta?.thumbnail || meta?.image || meta?.gallery?.[0] || 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?w=600&q=80';
    
    return (
      <Link key={item.id} href={`/places/${item.slug || item.id}`} className="min-w-[280px] sm:min-w-[320px] bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden snap-start hover:shadow-xl transition-all duration-300 group flex flex-col h-full self-stretch shrink-0">
        <div className="h-44 w-full overflow-hidden bg-emerald-100 relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors line-clamp-2 h-[3.5rem] mb-2 leading-tight">{item.title}</h3>
          <p className="text-xs text-slate-500 truncate mb-3 font-medium">📍 {formatLocation(item.location)}</p>
          <div className="mt-auto pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-emerald-700 inline-block bg-emerald-100 w-max px-4 py-2 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              Explore Place →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 mt-6 space-y-12">
      
      {/* CSS for Auto Smooth Horizontal Scrolling */}
      <style jsx global>{`
        @keyframes autoScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-auto-scroll {
          display: flex;
          width: max-content;
          animation: autoScroll 35s linear infinite;
        }
        .animate-auto-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 🌟 1. DYNAMIC MULTI-CATEGORY SLIDERS */}
      {Object.entries(data.categoryPlaces).map(([category, places]: [string, any]) => {
        if (!places || places.length === 0) return null;
        const emoji = getCategoryEmoji(category); 
        const duplicatedPlaces = [...places, ...places]; 
        
        return (
          <section key={category} className="bg-emerald-50/50 p-6 md:p-8 rounded-[2rem] border border-emerald-100 shadow-sm overflow-hidden">
            <h2 className="text-2xl font-black text-emerald-950 mb-6 flex items-center gap-2 capitalize">
              <span>{emoji}</span> Explore More {category} Places
            </h2>
            <div className="flex overflow-hidden pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="animate-auto-scroll flex gap-6 items-stretch">
                {duplicatedPlaces.map((place, idx) => renderPlaceCard({ ...place, id: `${place.id}-${idx}` }))}
              </div>
            </div>
          </section>
        );
      })}

      {/* 🌟 2. MORE TOURIST PLACES IN THIS CITY */}
      {data.cityPlaces.length > 0 && (() => {
        const duplicatedCityPlaces = [...data.cityPlaces, ...data.cityPlaces];
        return (
          <section className="overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">
              More Places to Visit in {finalTarget || 'This Area'}
            </h2>
            <div className="flex overflow-hidden pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="animate-auto-scroll flex gap-6 items-stretch">
                {duplicatedCityPlaces.map((place, idx) => renderPlaceCard({ ...place, id: `${place.id}-${idx}` }))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 🌟 3. TOUR PACKAGES (Sliding Animation) */}
      {data.destinationTours.length > 0 && (() => {
        const duplicatedTours = [...data.destinationTours, ...data.destinationTours];
        return (
          <section className="overflow-hidden bg-slate-50/80 p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-3">
              <h2 className="text-2xl font-black text-slate-900">
                Top Tour Packages from {finalTarget || 'This Area'}
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                ✨ Auto Sliding
              </span>
            </div>
            
            {/* Continuous smooth sliding animation for tour packages */}
            <div className="flex overflow-hidden pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="animate-auto-scroll flex gap-6 items-stretch">
                {duplicatedTours.map((tour, idx) => renderTourCard({ ...tour, id: `${tour.id}-${idx}` }))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 4. Verified Vendors/Travel Agents in This City */}
      {data.cityVendors.length > 0 && (() => {
        const duplicatedVendors = [...data.cityVendors, ...data.cityVendors];
        return (
          <section className="overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">Travel Agents & Providers in {finalTarget || 'This Area'}</h2>
            <div className="flex overflow-hidden pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="animate-auto-scroll flex gap-6 items-stretch">
                {duplicatedVendors.map((vendor, idx) => (
                  <div key={`${vendor.id}-${idx}`} className="min-w-[260px] bg-white p-6 rounded-3xl border border-slate-200 shadow-sm snap-start flex flex-col items-center text-center self-stretch h-auto shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mb-4 border-2 border-white shadow-sm shrink-0">
                      {vendor.company_name ? vendor.company_name.charAt(0).toUpperCase() : '🏢'}
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mb-1 truncate w-full">{vendor.company_name || vendor.full_name}</h3>
                    <p className="text-xs text-slate-500 mb-4 font-medium">📍 {formatLocation(vendor.location)}</p>
                    <div className="mt-auto pt-4 w-full">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg w-full block">
                        ✅ Verified Partner
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 5. Top 10 Lists */}
      <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
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