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

  const meta = place.metadata || {}
  
  const image = place.image || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?auto=format&fit=crop&q=80&w=1200')
  const galleryUrls = meta.gallery && meta.gallery.length > 0 ? meta.gallery : []
  const faqs = meta.faqItems || []

  // 🌟 Clean Location for Display
  const formattedLocation = formatLocation(place.location);

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

  const dynamicWhatsAppNumber = "919892455466"; 

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

        {/* --- ESSENTIAL INFO SHIFTED TO TOP --- */}
        {(meta.timing || meta.entryFee || meta.bestTimeToVisit || meta.howToReach || meta.nearestPlaces) && (
          <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-10">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
              <span>📋</span> Essential Visitor Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {meta.timing && (
                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-2xl bg-amber-100 p-2.5 rounded-xl">🕒</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Timings</h4>
                    <p className="text-slate-800 font-bold">{meta.timing}</p>
                  </div>
                </div>
              )}

              {meta.entryFee && (
                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-2xl bg-amber-100 p-2.5 rounded-xl">🎟️</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Entry Fee</h4>
                    <p className="text-slate-800 font-bold">{meta.entryFee}</p>
                  </div>
                </div>
              )}

              {meta.bestTimeToVisit && (
                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-2xl bg-amber-100 p-2.5 rounded-xl">⛅</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Best Time To Visit</h4>
                    <p className="text-slate-800 font-bold">{meta.bestTimeToVisit}</p>
                  </div>
                </div>
              )}

              {meta.howToReach && (
                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-2xl bg-blue-100 p-2.5 rounded-xl">🚆</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">How To Reach</h4>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{meta.howToReach}</p>
                  </div>
                </div>
              )}

              {meta.nearestPlaces && (
                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2 lg:col-span-2">
                  <span className="text-2xl bg-blue-100 p-2.5 rounded-xl">📍</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Nearby Attractions</h4>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{meta.nearestPlaces}</p>
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
              
              {/* ReactQuill HTML Rendering */}
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

      
      <FloatingContact />

    </main>
  )
}