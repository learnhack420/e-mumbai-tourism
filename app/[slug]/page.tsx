import { supabase } from '../../utils/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

// Cloudflare build ke liye dynamic slugs pre-fetch karne ke liye
export async function generateStaticParams() {
  const { data: places } = await supabase
    .from('listings')
    .select('slug')
    
  if (!places) return []

  return places.map((place) => ({
    slug: place.slug,
  }))
}

export const dynamicParams = true

// Dynamic SEO Metadata for Tourist Attractions & Blogs
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { data: place } = await supabase
    .from('listings')
    .select('title, metadata, location, category')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!place) return { title: 'Page Not Found' }

  const isBlog = place.category === 'blog'

  return {
    title: isBlog ? `${place.title} - Expert Travel Blog` : `${place.title} - Complete Travel Guide & How to Reach`,
    description: place.metadata?.shortDescription || `Explore ${place.title}, ${place.location}. Find best time to visit, top attractions, and travel guide.`,
  }
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  
  // Database se slug ya ID ke through listing fetch karna
  let { data: place, error } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single()

  if (error || !place) {
    const { data: placeById } = await supabase
      .from('listings')
      .select('*')
      .eq('id', resolvedParams.slug)
      .single()
    if (!placeById) return notFound()
    place = placeById
  }

  // 'destination' aur 'blog' dono categories ko allow kiya gaya hai
  if (place.category !== 'destination' && place.category !== 'blog') {
    return notFound()
  }

  const meta = place.metadata || {}
  const gallery = meta.gallery && meta.gallery.length > 0 
    ? meta.gallery 
    : ['https://images.unsplash.com/photo-1506461883276-594c8e0eb500?auto=format&fit=crop&q=80&w=1200']

  // FAQ Schema for Google SEO
  const faqSchema = meta.faqItems && meta.faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": meta.faqItems.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800">
      
      {/* --- INJECT GOOGLE FAQ SCHEMA --- */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* --- HERO SECTION --- */}
      <div className="relative h-[50vh] md:h-[65vh] w-full bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={gallery[0]} 
          alt={place.title} 
          className="w-full h-full object-cover opacity-75" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-6xl mx-auto">
          <Link href="/" className="text-teal-400 hover:text-teal-300 text-sm font-bold mb-6 inline-block transition-colors drop-shadow-md">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-teal-500/90 backdrop-blur-sm text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-teal-400/50">
              {place.category === 'blog' ? (meta.blogCategory || 'Travel Blog') : 'Tourist Attraction Guide'}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
            {place.title}
          </h1>
          <p className="text-slate-200 mt-4 text-xl md:text-2xl font-medium flex items-center gap-2 drop-shadow-md">
            📍 {place.location}
          </p>
        </div>
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Section: About & Highlights & FAQs */}
        <div className="lg:col-span-2 space-y-12">
          
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            
            {place.category !== 'blog' && (
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 tracking-tight">
                About {place.title}
              </h2>
            )}
            
            {meta.shortDescription && (
              <div className="border-l-4 border-teal-500 pl-5 mb-8 py-2 bg-teal-50/50 rounded-r-2xl">
                <p className="text-teal-800 font-semibold text-xl leading-relaxed italic">
                  "{meta.shortDescription}"
                </p>
              </div>
            )}

            {/* 🔥 FIXED PROSE STYLING FOR BACKEND LISTS & TABLES */}
            <div 
              className="prose prose-lg md:prose-xl max-w-none w-full break-words overflow-x-auto text-slate-700 leading-loose prose-headings:font-black prose-headings:text-slate-900 prose-h2:text-4xl md:prose-h2:text-5xl prose-h3:text-3xl prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-img:rounded-2xl prose-img:shadow-md prose-img:max-w-full prose-ul:list-disc prose-ol:list-decimal prose-li:my-2 prose-ul:pl-6 prose-ol:pl-6 prose-table:border-collapse prose-th:border prose-th:bg-slate-50 prose-td:border prose-th:p-3 prose-td:p-3"
              dangerouslySetInnerHTML={{ __html: place.description || '' }}
            />
          </section>

          {/* Top Attractions */}
          {meta.topAttractions && meta.topAttractions.length > 0 && (
            <section className="bg-gradient-to-br from-teal-50 to-emerald-50 p-8 md:p-10 rounded-3xl border border-teal-100 shadow-sm">
              <h2 className="text-4xl md:text-5xl font-black text-teal-950 mb-6 tracking-tight">Top Highlights & Things to Do</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {meta.topAttractions.map((spot: string, idx: number) => (
                  <li key={idx} className="bg-white px-5 py-4 rounded-xl shadow-sm border border-teal-100/50 text-teal-900 font-bold flex gap-4 items-start break-words">
                    <span className="text-teal-500 text-xl leading-none">✨</span> 
                    <span className="leading-snug">{spot}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Photo Gallery */}
          {gallery.length > 1 && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 tracking-tight">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {gallery.slice(1).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-48 rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer relative shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`${place.title} image ${idx+2}`} className="absolute w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQs Section */}
          {meta.faqItems && meta.faqItems.length > 0 && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4 tracking-tight">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {meta.faqItems.map((faq: any, index: number) => (
                  <div key={index} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-start gap-3">
                      <span className="text-teal-500 text-2xl leading-none">Q.</span>
                      <span className="leading-snug">{faq.question}</span>
                    </h3>
                    <p className="text-slate-700 leading-relaxed md:pl-9 flex items-start gap-3 md:gap-0">
                      <span className="font-bold text-slate-400 text-xl leading-none md:hidden">A.</span>
                      <span>{faq.answer}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Sidebar: Visitor Info & Cab Booking CTA */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 sticky top-24">
            <h3 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 tracking-tight">
              {place.category === 'blog' ? 'Trip Details' : 'Visitor Info'}
            </h3>
            
            <div className="space-y-6">
              {meta.bestTimeToVisit && (
                <div className="flex gap-4 items-start">
                  <span className="text-2xl bg-slate-50 p-2.5 rounded-xl">⛅</span>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Best Time To Visit</h4>
                    <p className="text-slate-800 font-bold text-lg break-words">{meta.bestTimeToVisit}</p>
                  </div>
                </div>
              )}
              
              {meta.howToReach && (
                <div className="flex gap-4 items-start pt-4 border-t border-slate-50">
                  <span className="text-2xl bg-slate-50 p-2.5 rounded-xl">🚆</span>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">How To Reach</h4>
                    <p className="text-slate-700 font-medium text-base leading-relaxed break-words">{meta.howToReach}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cab Booking Integration */}
            <div className="mt-10 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-center shadow-xl">
              <div className="text-4xl mb-3 drop-shadow-md">🚖</div>
              <h4 className="font-black text-white text-xl mb-2">Planning to visit?</h4>
              <p className="text-sm text-blue-100 mb-6 font-medium">Book a reliable outstation cab directly from your location.</p>
              <Link 
                href={`/?service=cab&city=${encodeURIComponent(place.location ? place.location.split(',')[0] : '')}`}
                className="block w-full bg-white hover:bg-slate-50 text-blue-700 font-black py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 break-words"
              >
                Book Cab Now →
              </Link>
            </div>
            
          </div>
        </div>

      </div>
    </main>
  )
}