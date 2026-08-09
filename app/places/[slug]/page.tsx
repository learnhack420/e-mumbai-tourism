import { supabase } from '../../../utils/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script' // 🌟 Next.js ka official Script component
import type { Metadata } from 'next'

import FloatingContact from '../../components/FloatingContact'
import RelatedPlaceSections from '../../components/RelatedPlaceSections'
import AITouristGuide from '../../components/AITouristGuide'

export const revalidate = 0 

// String safety function
const cleanText = (htmlString: any) => {
  if (!htmlString || typeof htmlString !== 'string') return "";
  return String(htmlString).replace(/(<([^>]+)>)/gi, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").trim();
};

// Location array to string safety
const formatLocation = (locStr?: any) => {
  if (!locStr) return 'Not specified'
  if (Array.isArray(locStr)) return locStr.join(', ') 
  return String(locStr).replace(/ > /g, ', ')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug
    const { data: place } = await supabase.from('listings').select('title, metadata, location, image').eq('slug', slug).single()
    if (!place) return { title: 'Place Not Found' }
    
    const meta = typeof place.metadata === 'string' ? JSON.parse(place.metadata) : (place.metadata || {});
    
    const descriptionText = meta.shortDescription ? cleanText(meta.shortDescription) : `Travel guide to ${place.title}.`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.emumbaitourism.com';
    const currentUrl = `${siteUrl}/places/${slug}`;
    const safeGallery = Array.isArray(meta.gallery) ? meta.gallery : [];
    
    const imageUrl = place.image || meta.image || meta.thumbnail || (safeGallery.length > 0 ? safeGallery[0] : `${siteUrl}/default-tour.jpg`);

    return {
      title: meta.metaTitle || meta.seo?.metaTitle || `${place.title} - Guide`,
      description: meta.metaDescription || meta.seo?.metaDescription || descriptionText.substring(0, 160),
      keywords: meta.metaKeywords || meta.seo?.metaKeywords || `${place.title}`,
      alternates: { canonical: currentUrl },
      openGraph: { title: place.title, description: descriptionText.substring(0, 160), url: currentUrl, type: 'website', images: [{ url: imageUrl, width: 1200, height: 630, alt: place.title }] },
      twitter: { card: 'summary_large_image', title: place.title, description: descriptionText.substring(0, 160), images: [imageUrl] }
    }
  } catch (err) {
    return { title: 'Tourist Place' }
  }
}

export default async function TouristPlacePage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug
    let { data: place, error } = await supabase.from('listings').select('*').eq('slug', slug).single()

    if (error || !place) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
        const { data: placeById } = await supabase.from('listings').select('*').eq('id', slug).single()
        if (!placeById) return notFound()
        place = placeById
      } else return notFound()
    }

    const formattedLocation = formatLocation(place.location);
    const targetCity = formattedLocation !== 'Not specified' ? formattedLocation.split(',')[0].trim() : '';
    
    const meta = typeof place.metadata === 'string' ? JSON.parse(place.metadata) : (place.metadata || {});
    
    const galleryUrls = Array.isArray(meta.gallery) ? meta.gallery : []
    const faqs = Array.isArray(meta.faqItems) ? meta.faqItems : []
    const topAttractions = Array.isArray(meta.topAttractions) ? meta.topAttractions : []
    const placeCats = Array.isArray(meta.placeCategories) && meta.placeCategories.length > 0 ? meta.placeCategories : ['Tourist Attraction'];
    
    // 🌟 SMART NEAREST PLACES CARD BUILDER
    let finalNearbyCards: any[] = [];
    let oldNearestText = "";
    let rawNearest = meta.nearestPlaces;

    if (typeof rawNearest === 'string' && rawNearest.trim() !== '') {
      try {
        const parsed = JSON.parse(rawNearest);
        if (Array.isArray(parsed)) rawNearest = parsed;
        else oldNearestText = rawNearest;
      } catch (e) {
        if (rawNearest.includes(',')) {
          rawNearest = rawNearest.split(',').map((s: string) => s.trim());
        } else {
          oldNearestText = rawNearest;
        }
      }
    }

    if (Array.isArray(rawNearest) && rawNearest.length > 0) {
      const { data: slugMatches } = await supabase.from('listings').select('id, title, slug, image, metadata').in('slug', rawNearest);
      const { data: titleMatches } = await supabase.from('listings').select('id, title, slug, image, metadata').in('title', rawNearest);
      const combined = [...(slugMatches || []), ...(titleMatches || [])];
      const dbPlaces = Array.from(new Map(combined.map(item => [item.id, item])).values());

      finalNearbyCards = rawNearest.map(identifier => {
        const realData = dbPlaces.find(p => p.slug === identifier || p.title === identifier);
        
        if (realData) {
          const nearMeta = typeof realData.metadata === 'string' ? JSON.parse(realData.metadata) : (realData.metadata || {});
          
          // 🌟 Backend se image/thumbnail/gallery fetch karne ka proper logic
          let extractedImg = realData.image || nearMeta.image || nearMeta.thumbnail; 
          
          if (!extractedImg && Array.isArray(nearMeta.gallery) && nearMeta.gallery.length > 0) {
            extractedImg = nearMeta.gallery[0];
          }
          if (!extractedImg || typeof extractedImg !== 'string' || extractedImg.trim() === '') {
            extractedImg = '/ITO LOGO.png';
          }

          return {
            id: realData.id,
            link: `/places/${realData.slug || realData.id}`,
            title: realData.title,
            image: extractedImg
          };
        } else {
          const readableTitle = identifier.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          return {
            id: identifier,
            link: `/places/${identifier}`,
            title: readableTitle,
            image: '/ITO LOGO.png' 
          };
        }
      });
    }
    
    const image = place.image || meta.image || (galleryUrls.length > 0 ? galleryUrls[0] : 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?auto=format&fit=crop&q=80&w=1200')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.emumbaitourism.com';

    const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [ { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` }, { "@type": "ListItem", "position": 2, "name": "Places", "item": `${siteUrl}/places` }, { "@type": "ListItem", "position": 3, "name": place.title, "item": `${siteUrl}/places/${slug}` } ] };
    const placeSchema = { "@context": "https://schema.org", "@type": "TouristAttraction", "name": place.title, "description": meta.metaDescription || meta.shortDescription || `Explore ${place.title}.`, "image": image, "address": { "@type": "PostalAddress", "addressLocality": targetCity || "India", "addressCountry": "IN" } };

    return (
      <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-blue-600 selection:text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />

        <div className="relative h-[60vh] md:h-[75vh] w-full bg-slate-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={place.title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex items-end">
            <div className="max-w-7xl mx-auto w-full p-6 md:p-12 text-white">
              <Link href="/" className="text-amber-400 hover:text-white text-sm font-bold mb-4 inline-block transition-colors">← Back to Home</Link>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {placeCats.map((cat: string, index: number) => (
                  <Link key={index} href={`/places?category=${encodeURIComponent(cat)}`} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md transition-colors">
                    {cat}
                  </Link>
                ))}
              </div>

              <h1 className="text-4xl md:text-7xl font-black mb-3 tracking-tight">{place.title}</h1>
              <p className="text-slate-200 mt-2 text-lg md:text-2xl font-medium flex items-center gap-2">📍 {formattedLocation}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12 py-8">
          
          <nav className="flex items-center text-xs md:text-sm text-slate-500 font-bold mb-8 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">🏠 Home</Link><span className="mx-2 text-slate-300">/</span>
            <Link href="/places" className="hover:text-blue-600 transition-colors flex items-center gap-1">Places</Link><span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-800 truncate">{place.title}</span>
          </nav>

          {(meta.timing || meta.entryFee || meta.bestTimeToVisit || meta.howToReach) && (
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-10 w-full">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2 border-b pb-3"><span>📋</span> Essential Visitor Information of {place.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {meta.timing && (
                  <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border shadow-sm">
                    <span className="text-3xl bg-amber-100 p-3 rounded-2xl">🕒</span>
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-slate-900 mb-1">Timings of {place.title}</h4>
                      <p className="font-semibold text-slate-700 text-base md:text-lg">{meta.timing}</p>
                    </div>
                  </div>
                )}
                
                {meta.entryFee && (
                  <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border shadow-sm">
                    <span className="text-3xl bg-amber-100 p-3 rounded-2xl">🎟️</span>
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-slate-900 mb-1">Entry Fee of {place.title}</h4>
                      <p className="font-semibold text-slate-700 text-base md:text-lg">{meta.entryFee}</p>
                    </div>
                  </div>
                )}
                
                {meta.bestTimeToVisit && (
                  <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border shadow-sm">
                    <span className="text-3xl bg-amber-100 p-3 rounded-2xl">⛅</span>
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-slate-900 mb-1">Best Time To Visit {place.title}</h4>
                      <p className="font-semibold text-slate-700 text-base md:text-lg">{meta.bestTimeToVisit}</p>
                    </div>
                  </div>
                )}
                
                {meta.howToReach && (
                  <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border shadow-sm sm:col-span-2 lg:col-span-3">
                    <span className="text-3xl bg-blue-100 p-3 rounded-2xl">🚆</span>
                    <div className="w-full">
                      <h4 className="text-lg md:text-xl font-black text-slate-900 mb-2">How To Reach {place.title}</h4>
                      <p className="text-slate-700 font-semibold text-base md:text-lg whitespace-pre-line">{meta.howToReach}</p>
                    </div>
                  </div>
                )}
                
              </div>
            </section>
          )}

          <div className="w-full space-y-10">
            {galleryUrls.length > 0 && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryUrls.map((imgUrl: string, idx: number) => (
                    <div key={idx} className="h-48 rounded-2xl overflow-hidden bg-slate-100 group relative"><img src={imgUrl} alt="View" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 flex items-center gap-3"><span className="w-8 h-1 bg-amber-500 rounded-full inline-block"></span> About {place.title}</h2>
              {meta.shortDescription && <p className="text-amber-800 font-bold text-lg leading-relaxed mb-8 border-l-4 border-amber-500 pl-5 bg-amber-50/60 py-4 pr-4 rounded-r-2xl">"{meta.shortDescription}"</p>}
              <div className="prose prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed text-lg break-words" dangerouslySetInnerHTML={{ __html: place.description || '' }} />
            </section>

            {meta.history && (
              <section className="bg-slate-900 text-slate-300 p-8 md:p-10 rounded-[2.5rem] shadow-xl">
                <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2"><span>📜</span> History & Significance of {place.title}</h2>
                <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.history}</p>
              </section>
            )}

            {meta.whyVisit && (
              <section className="bg-blue-50 text-blue-950 p-8 md:p-10 rounded-[2.5rem] border border-blue-100 shadow-sm">
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><span>💡</span> Why You Should Visit {place.title}</h2>
                <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.whyVisit}</p>
              </section>
            )}

            {meta.rituals && (
              <section className="bg-orange-50 text-orange-950 p-8 md:p-10 rounded-[2.5rem] border border-orange-100 shadow-sm">
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><span>🙏</span> Rituals, Activities & Things to Do at {place.title}</h2>
                <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.rituals}</p>
              </section>
            )}

            {/* 🌟 EQUAL HEIGHT & ALIGNED BUTTONS SLIDER FOR NEARBY PLACES */}
            {(finalNearbyCards.length > 0 || oldNearestText) && (
              <section className="bg-emerald-50 text-emerald-950 p-8 md:p-10 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-2"><span>📍</span> Nearby Places & Attractions</h2>
                </div>
                
                {finalNearbyCards.length > 0 ? (
                  <>
                    <div id="nearby-slider" className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">
                      {finalNearbyCards.map((card) => (
                        <Link 
                          key={card.id} 
                          href={card.link} 
                          className="min-w-[280px] sm:min-w-[320px] h-full flex-shrink-0 snap-center bg-white border border-emerald-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col self-stretch"
                        >
                          <div className="h-44 w-full overflow-hidden bg-emerald-100 relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors line-clamp-2 h-[3.5rem] mb-3 leading-tight">{card.title}</h3>
                            <div className="mt-auto pt-2">
                              <span className="text-xs font-bold text-emerald-700 inline-block bg-emerald-100 w-max px-4 py-2 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                Explore Place →
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {/* 🌟 FIX: Official Next.js <Script> Tag */}
                    <Script id="nearby-auto-slider" strategy="lazyOnload">
                      {`
                        setInterval(function() {
                          var slider = document.getElementById('nearby-slider');
                          if (slider) {
                            if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 10) {
                              slider.scrollTo({ left: 0, behavior: 'smooth' });
                            } else {
                              slider.scrollBy({ left: 344, behavior: 'smooth' });
                            }
                          }
                        }, 3000);
                      `}
                    </Script>
                  </>
                ) : (
                  <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{oldNearestText}</p>
                )}
              </section>
            )}

            {topAttractions.length > 0 && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-6">✨ Top Attractions & Highlights</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topAttractions.map((spot: string, idx: number) => <li key={idx} className="bg-slate-50 px-5 py-4 rounded-2xl border font-bold">✦ {spot}</li>)}
                </ul>
              </section>
            )}

            <AITouristGuide placeId={place.id} targetCity={targetCity} hasExistingFaqs={faqs.length > 0} placeTitle={place.title} /> 

            {faqs.length > 0 && (
              <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>❓</span> Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 border shadow-sm">
                      <h3 className="font-bold text-slate-900 text-lg mb-2">Q: {faq.question}</h3><p className="text-slate-600 text-lg whitespace-pre-line">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 md:p-10 rounded-[2.5rem] text-center text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left"><div className="text-4xl mb-2">🚖</div><h4 className="font-black text-2xl mb-1">Planning a Visit to {place.title}?</h4><p className="text-white/90 font-medium">Book a comfortable private outstation or local cab for a hassle-free trip today.</p></div>
              <Link href={targetCity ? `/?service=cab&city=${encodeURIComponent(targetCity)}` : '/'} className="bg-slate-900 hover:bg-black text-white font-black py-4 px-8 rounded-2xl transition-all shadow-md active:scale-95 whitespace-nowrap">Search Cabs Now →</Link>
            </div>

          </div>
        </div>

        <RelatedPlaceSections placeId={place.id} targetCity={targetCity} />
        <FloatingContact />

      </main>
    )

  } catch (err: any) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50 p-6"><div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl w-full border-2 border-red-200"><h1 className="text-2xl font-black text-red-600 mb-4">⚠️ Server Crash Report</h1><div className="bg-red-100 text-red-900 p-4 rounded-lg font-mono text-sm overflow-auto mb-4">{err.message}</div></div></div>
  }
}