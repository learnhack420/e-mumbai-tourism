import { supabase } from '../../../utils/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import FloatingContact from '../../components/FloatingContact'

export const revalidate = 60 // Cache revalidation har 60 seconds me

// Helper function to thoroughly clean HTML tags and entities for SEO
const cleanText = (htmlString: string) => {
  if (!htmlString) return "";
  return htmlString
    .replace(/(<([^>]+)>)/gi, "") 
    .replace(/&nbsp;/gi, " ")     
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
};

// 🌟 Helper function to clean the new location format (Replaces ' > ' with ', ')
const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

// Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { data: place } = await supabase
    .from('listings')
    .select('title, metadata, location')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!place) return { title: 'Place Not Found' }

  const meta = place.metadata || {};
  const cleanLoc = place.location ? place.location.replace(/ > /g, ', ') : '';
  
  const descriptionText = meta.shortDescription 
    ? cleanText(meta.shortDescription) 
    : `Complete guide to visit ${place.title}, ${cleanLoc}. Read about best time to visit, timings, entry fees, and history.`;

  return {
    title: `${place.title} - Ultimate Travel Guide & Details | DayTour`,
    description: descriptionText.substring(0, 160),
    alternates: {
      canonical: `https://daytour.in/places/${resolvedParams.slug}`,
    }
  }
}

export default async function TouristPlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  
  // URL slug ya ID ke basis par database se fetch karna
  let { data: place, error } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single()

  // Fallback if slug fails, check by ID
  if (error || !place) {
    const { data: placeById } = await supabase
      .from('listings')
      .select('*')
      .eq('id', resolvedParams.slug)
      .single()
    if (!placeById) return notFound()
    place = placeById
  }

  // Safety check relaxed
  if (place.category && place.category !== 'destination' && place.category !== 'blog') {
    console.warn(`Category warning for slug ${resolvedParams.slug}: ${place.category}`);
  }

  // 🌟 Clean Location for Display and Extract Target City
  const formattedLocation = formatLocation(place.location);
  const targetCity = formattedLocation !== 'Not specified' ? formattedLocation.split(',')[0].trim() : '';

  // 🌟 FETCHING EXTRA DATA FOR BOTTOM SECTIONS (Sliders & Top 10)
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
    supabase.from('listings').select('id, title, slug, location, image, metadata').eq('category', 'destination').ilike('location', `%${targetCity}%`).neq('id', place.id).limit(8),
    // Vendors operating in this city
    supabase.from('profiles').select('id, full_name, company_name, location').eq('role', 'vendor').eq('approval_status', 'approved').ilike('location', `%${targetCity}%`).limit(8),
    // Top 10 Lists
    supabase.from('listings').select('title, slug').eq('category', 'tour').limit(10),
    supabase.from('listings').select('title, slug').eq('category', 'cab').limit(10),
    supabase.from('listings').select('title, slug').eq('category', 'destination').limit(10)
  ]);

  const meta = place.metadata || {}
  const image = place.image || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?auto=format&fit=crop&q=80&w=1200')
  const galleryUrls = meta.gallery && meta.gallery.length > 0 ? meta.gallery : []
  const faqs = meta.faqItems || []

  // JSON-LD Schema Markup for Attractions
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": place.title,
    "description": meta.shortDescription ? cleanText(meta.shortDescription) : `Explore ${place.title}`,
    "image": image,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": formattedLocation || "Maharashtra",
      "addressCountry": "IN"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://daytour.in" },
      { "@type": "ListItem", "position": 2, "name": place.title, "item": `https://daytour.in/places/${place.slug}` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-blue-600 selection:text-white">
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schemaMarkup, breadcrumbSchema]) }} />

      {/* --- HERO SECTION --- */}
      <div className="relative h-[60vh] md:h-[75vh] w-full bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={image} 
          alt={place.title} 
          className="w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto w-full p-6 md:p-12 text-white">
            <Link href="/" className="text-amber-400 hover:text-white text-sm font-bold mb-4 inline-block transition-colors">
              ← Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-amber-500 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                Tourist Attraction
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-3 tracking-tight">
              {place.title}
            </h1>
            <p className="text-slate-200 mt-2 text-lg md:text-2xl font-medium flex items-center gap-2">
              📍 {formattedLocation}
            </p>
          </div>
        </div>
      </div>

      {/* --- BREADCRUMBS & MAIN CONTENT CONTAINER --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8">
        
        <nav className="flex items-center text-xs md:text-sm text-slate-500 font-bold mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">🏠 Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-800 truncate">{place.title}</span>
        </nav>

        {/* --- ESSENTIAL INFO SHIFTED TO TOP (DARKER, BOLDER, LARGER) --- */}
        {(meta.timing || meta.entryFee || meta.bestTimeToVisit || meta.howToReach || meta.nearestPlaces) && (
          <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-10">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
              <span>📋</span> Essential Visitor Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {meta.timing && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-amber-100 p-3 rounded-2xl">🕒</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Timings</h4>
                    <p className="text-slate-900 font-black text-base md:text-lg">{meta.timing}</p>
                  </div>
                </div>
              )}

              {meta.entryFee && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-amber-100 p-3 rounded-2xl">🎟️</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Entry Fee</h4>
                    <p className="text-slate-900 font-black text-base md:text-lg">{meta.entryFee}</p>
                  </div>
                </div>
              )}

              {meta.bestTimeToVisit && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-amber-100 p-3 rounded-2xl">⛅</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Best Time To Visit</h4>
                    <p className="text-slate-900 font-black text-base md:text-lg">{meta.bestTimeToVisit}</p>
                  </div>
                </div>
              )}

              {meta.howToReach && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-blue-100 p-3 rounded-2xl">🚆</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">How To Reach</h4>
                    <p className="text-slate-800 font-bold text-base leading-relaxed whitespace-pre-line">{meta.howToReach}</p>
                  </div>
                </div>
              )}

              {meta.nearestPlaces && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 lg:col-span-2">
                  <span className="text-3xl bg-blue-100 p-3 rounded-2xl">📍</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Nearby Attractions</h4>
                    <p className="text-slate-800 font-bold text-base leading-relaxed whitespace-pre-line">{meta.nearestPlaces}</p>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Descriptions & Details */}
          <div className="lg:col-span-3 space-y-10">
            
            {/* Main Rich Text Description */}
            <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-amber-500 rounded-full inline-block"></span>
                About {place.title}
              </h2>
              {meta.shortDescription && (
                <p className="text-amber-800 font-bold text-lg leading-relaxed mb-8 border-l-4 border-amber-500 pl-5 bg-amber-50/60 py-4 pr-4 rounded-r-2xl">
                  "{meta.shortDescription}"
                </p>
              )}
              
              <div 
                className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg break-words"
                dangerouslySetInnerHTML={{ __html: place.description }}
              />
            </section>

            {/* History & Significance */}
            {meta.history && (
              <section className="bg-slate-900 text-slate-300 p-8 md:p-10 rounded-[2.5rem] shadow-xl">
                <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                  <span>📜</span> History & Significance
                </h2>
                <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.history}</p>
              </section>
            )}

            {/* Why Visit (Highlights) */}
            {meta.whyVisit && (
              <section className="bg-blue-50 text-blue-950 p-8 md:p-10 rounded-[2.5rem] border border-blue-100 shadow-sm">
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                  <span>💡</span> Why You Should Visit
                </h2>
                <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.whyVisit}</p>
              </section>
            )}

            {/* Top Attractions List */}
            {meta.topAttractions && meta.topAttractions.length > 0 && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-6">✨ Top Attractions & Highlights</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meta.topAttractions.map((spot: string, idx: number) => (
                    <li key={idx} className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-800 font-bold flex gap-3 items-center">
                      <span className="text-amber-500 text-xl">✦</span> {spot}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Rituals & Activities */}
            {meta.rituals && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span>🙏</span> Rituals & Activities
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">{meta.rituals}</p>
              </section>
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <span>❓</span> Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-900 text-lg mb-2">Q: {faq.question}</h3>
                      <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Photo Gallery Grid */}
            {galleryUrls.length > 0 && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryUrls.map((imgUrl: string, idx: number) => (
                    <div key={idx} className="h-48 rounded-2xl overflow-hidden bg-slate-100 group relative shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={imgUrl} 
                        alt={`${place.title} gallery image ${idx+1}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cab Booking CTA Banner */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 md:p-10 rounded-[2.5rem] text-center text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <div className="text-4xl mb-2">🚖</div>
                <h4 className="font-black text-2xl mb-1">Planning a Visit to {place.title}?</h4>
                <p className="text-white/90">Book a comfortable private outstation or local cab for a hassle-free trip today.</p>
              </div>
              <Link 
                href={`/?service=cab&city=${encodeURIComponent(formattedLocation.split(',')[0].trim())}`}
                className="bg-slate-900 hover:bg-black text-white font-black py-4 px-8 rounded-2xl transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                Search Cabs Now →
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🌟 NEW BOTTOM SECTIONS (Full Width) */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-6 space-y-12">
        
        {/* Section 1: Tour Packages in This City (Slider) */}
        {cityTours && cityTours.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">Top Tour Packages in {targetCity || 'This Area'}</h2>
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
              {cityTours.map((item: any) => {
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

        {/* Section 2: More Tourist Places in This City (Slider) */}
        {cityPlaces && cityPlaces.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">More Places to Visit in {targetCity || 'This Area'}</h2>
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
              {cityPlaces.map((item: any) => {
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

        {/* Section 3: Verified Vendors/Travel Agents in This City (Slider) */}
        {cityVendors && cityVendors.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">Travel Agents & Providers in {targetCity || 'This Area'}</h2>
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
              {cityVendors.map((vendor: any) => (
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
                {topTours && topTours.map((t: any, i: number) => (
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
                {topCabs && topCabs.map((c: any, i: number) => (
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
                {topPlaces && topPlaces.map((p: any, i: number) => (
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

      <FloatingContact />

    </main>
  )
}