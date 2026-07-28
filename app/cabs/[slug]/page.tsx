import { supabase } from '@/utils/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import CabBookingSidebar from '@/app/components/CabBookingSidebar'
import AIAutoRoutePlanner from '@/app/components/AIAutoRoutePlanner'
import VendorInfoCard from '@/app/components/VendorInfoCard'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { data: cab } = await supabase.from('listings').select('title, location, category').eq('slug', resolvedParams.slug).single()
  
  if (!cab) return { title: 'Not Found' }
  
  return {
    title: `${cab.title} - Book Best Cabs in ${cab.location}`,
    description: `Book reliable and comfortable outstation and local cabs for ${cab.title}. Best prices guaranteed.`,
  }
}

export default async function CabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: cab, error } = await supabase.from('listings').select('*').eq('slug', slug).single()

  if (error || !cab) {
    const { data: cabById } = await supabase.from('listings').select('*').eq('id', slug).single()
    if (!cabById) return notFound()
    cab = cabById
  }

  // Security check: Only show cab categories
  if (cab.category !== 'cab') {
    return notFound()
  }

  const meta = cab.metadata || {}
  const gallery = meta.gallery && meta.gallery.length > 0 
    ? meta.gallery 
    : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200']

  // Generate Google Maps Search Query for Local Map
  const isLocal = meta.mainType === 'Local';
  const isOutstation = meta.mainType === 'Outstation';
  let mapQuery = cab.location || 'India';
  
  if (isLocal && meta.pickupPoint && meta.dropPoint) {
      mapQuery = `${meta.pickupPoint} to ${meta.dropPoint}`;
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[0]} alt={cab.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-6xl mx-auto">
          <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm font-bold mb-6 inline-block transition-colors drop-shadow-md">
            ← Back to Home
          </Link>
          <div className="mb-4">
            <span className="bg-yellow-500 text-yellow-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md inline-block">
              Cab Service
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg">{cab.title}</h1>
          <p className="text-slate-200 mt-3 text-lg md:text-xl font-medium flex items-center gap-2 drop-shadow-md">📍 {cab.location}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* ========================================= */}
        {/* LEFT COLUMN: MAIN CONTENT                 */}
        {/* ========================================= */}
        <div className="lg:col-span-2 space-y-10">
          
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4 tracking-tight">Trip Overview</h2>
            
            {/* 1. Trip Type & Service Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-700 mb-8">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Trip Type:</span>
                <span className="font-bold text-lg text-slate-800">{meta.mainType || 'Local'}</span>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Service Type:</span>
                <span className="font-bold text-lg text-slate-800">{meta.subType || 'Point to Point'}</span>
              </div>
            </div>

            {/* 2. Route & Details */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 mb-10">
              <h3 className="text-xl font-black text-slate-900 mb-6">Route & Details:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {meta.mainType === 'Local' && meta.subType === 'Point to Point' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pickup Point</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.pickupPoint || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Drop Point</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.dropPoint || 'N/A'}</span>
                    </div>
                  </>
                )}

                {meta.mainType === 'Local' && meta.subType === 'Local Rental' && (
                  <div className="md:col-span-2">
                    <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Rental Package</span>
                    <span className="font-bold text-slate-800 text-lg">{meta.rentalPackage || 'N/A'}</span>
                  </div>
                )}

                {meta.mainType === 'Outstation' && meta.subType === 'One Way' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pickup City</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.pickupCity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Drop City</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.dropCity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Distance (km)</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.distance ? `${meta.distance} KM` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Night Charge (9pm-6am)</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.nightCharge ? `₹${meta.nightCharge}` : 'N/A'}</span>
                    </div>
                  </>
                )}

                {meta.mainType === 'Outstation' && meta.subType === 'Round Trip' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pickup City</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.pickupCity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Destination City</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.dropCity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Distance (km)</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.distance ? `${meta.distance} KM` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Min KM per Day Limit</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.minKmPerDay ? `${meta.minKmPerDay} KM` : 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Description */}
            {meta.description && (
              <div className="mb-10">
                <h3 className="text-xl font-black text-slate-900 mb-4">Description:</h3>
                <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                  {meta.description}
                </div>
              </div>
            )}

            {/* 4. Included & Not Included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-emerald-50 p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm">
                <h3 className="text-xl font-black text-emerald-950 mb-4 flex items-center gap-2">Included:</h3>
                <ul className="text-emerald-900 font-medium space-y-3">
                  {/* Default/Base Inclusions */}
                  {meta.tollCharges === 'Yes' && <li className="flex items-center gap-2"><span className="text-emerald-500 text-lg leading-none">✓</span> Toll Charges</li>}
                  {meta.parkingCharges === 'Yes' && <li className="flex items-center gap-2"><span className="text-emerald-500 text-lg leading-none">✓</span> Parking Charges</li>}
                  {meta.driverDa === 'Yes' && meta.subType !== 'Round Trip' && <li className="flex items-center gap-2"><span className="text-emerald-500 text-lg leading-none">✓</span> Driver Allowance</li>}
                  
                  {/* 🔥 DYNAMIC/CUSTOM INCLUSIONS MAPPED HERE */}
                  {meta.customInclusions && meta.customInclusions.length > 0 && meta.customInclusions.map((item: string, idx: number) => (
                    <li key={`inc-${idx}`} className="flex items-center gap-2">
                      <span className="text-emerald-500 text-lg leading-none">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-rose-50 p-6 md:p-8 rounded-3xl border border-rose-100 shadow-sm">
                <h3 className="text-xl font-black text-rose-950 mb-4 flex items-center gap-2">Not Included:</h3>
                <ul className="text-rose-900 font-medium space-y-3">
                  {/* Default/Base Exclusions */}
                  {meta.tollCharges === 'No' && <li className="flex items-center gap-2"><span className="text-rose-500 text-lg leading-none">✕</span> Toll Charges</li>}
                  {meta.parkingCharges === 'No' && <li className="flex items-center gap-2"><span className="text-rose-500 text-lg leading-none">✕</span> Parking Charges</li>}
                  {meta.driverDa === 'No' && meta.subType !== 'Round Trip' && <li className="flex items-center gap-2"><span className="text-rose-500 text-lg leading-none">✕</span> Driver Allowance</li>}
                  
                  {/* 🔥 DYNAMIC/CUSTOM EXCLUSIONS MAPPED HERE */}
                  {meta.customExclusions && meta.customExclusions.length > 0 && meta.customExclusions.map((item: string, idx: number) => (
                    <li key={`exc-${idx}`} className="flex items-center gap-2">
                      <span className="text-rose-500 text-lg leading-none">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5. Map & Route Section */}
            <div className="mb-10 border-t border-slate-100 pt-10">
              {isOutstation ? (
                <>
                  {meta.howToReach && (
                    <div className="mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Route Information</h3>
                      <p className="text-slate-700 leading-relaxed font-medium">{meta.howToReach}</p>
                    </div>
                  )}
                  
                  {(meta.pickupCity || cab.location) && (meta.dropCity) && (
                    <div className="mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <AIAutoRoutePlanner 
                        origin={meta.pickupCity || cab.location} 
                        destination={meta.dropCity} 
                      />
                    </div>
                  )}

                  <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Travel Route Map</h3>
                  <div className="w-full h-[350px] bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }} 
                      src={`https://maps.google.com/maps?saddr=${encodeURIComponent(meta.pickupCity || cab.location)}&daddr=${encodeURIComponent(meta.dropCity || cab.location)}&output=embed`} 
                      allowFullScreen 
                      title="Outstation Route Map"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Pickup & Drop Route Map</h3>
                  <div className="w-full h-[350px] bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }} 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=10&ie=UTF8&iwloc=&output=embed`} 
                      allowFullScreen 
                      title="Local Route Map"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 6. Frequently Asked Questions */}
            {meta.faqs && meta.faqs.length > 0 && (
              <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight border-b border-slate-100 pb-3">Frequently Asked Questions</h3>
                <div className="space-y-5">
                  {meta.faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <h4 className="font-bold text-slate-900 text-lg flex items-start gap-3">
                        <span className="text-blue-500 text-xl leading-none mt-0.5">Q.</span> 
                        <span>{faq.question}</span>
                      </h4>
                      <p className="text-slate-600 font-medium mt-2 flex items-start gap-3 md:pl-8">
                        <span className="text-slate-400 font-bold text-lg leading-none mt-0.5 md:hidden">A.</span> 
                        <span>{faq.answer}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. VENDOR INFO CARD */}
            <div className="mt-10 pt-6 border-t border-slate-100">
              <VendorInfoCard vendorId={cab?.vendor_id || 'default-fallback'} />
            </div>

          </section>

          {/* 8. Cab Gallery */}
          {gallery.length > 1 && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-3xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 tracking-tight">Cab Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {gallery.slice(1).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-32 md:h-40 rounded-2xl overflow-hidden bg-slate-100 relative group cursor-pointer shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Cab ${idx+1}`} className="absolute w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ========================================= */}
        {/* RIGHT COLUMN: SIDEBAR (Only Booking Box)  */}
        {/* ========================================= */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CabBookingSidebar cab={cab} meta={meta} />
          </div>
        </div>

      </div>
    </main>
  )
}