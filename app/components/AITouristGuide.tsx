"use client"
import { useEffect, useState } from 'react'

export default function AITouristGuide({ 
  placeId,
  targetCity, 
  hasExistingFaqs,
  placeTitle
}: { 
  placeId: string,
  targetCity: string, 
  hasExistingFaqs: boolean,
  placeTitle: string
}) {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const queryName = targetCity || placeTitle || 'India';
  const exactLocationQuery = encodeURIComponent(`${placeTitle} ${targetCity}`);
  const hotelSearchUrl = `https://www.google.com/maps/search/Hotels+near+${encodeURIComponent(placeTitle)}`;

  useEffect(() => {
    async function fetchAIGuide() {
      try {
        const res = await fetch('/api/place-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            placeId,
            targetCity: queryName, 
            needFaqs: !hasExistingFaqs
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if(!data.error) {
             setAiData(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI guide", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAIGuide();
  }, [placeId, queryName, hasExistingFaqs]);

  return (
    <div className="space-y-12 mt-10">
      
      {/* 🗺️ MAP SECTION */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Location of {placeTitle}</h2>
          </div>
          <a 
            href={hotelSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
          >
            🏨 Find Nearby Hotels
          </a>
        </div>
        <div className="w-full h-[350px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
          <iframe 
            width="100%" 
            height="100%" 
            style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
            loading="lazy" 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade" 
            src={`https://maps.google.com/maps?q=${exactLocationQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>
      </section>

      {/* ✨ AI GUIDE SECTION */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 opacity-50"></div>
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
            ✨
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Travel Guide for {queryName}</h2>
            <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-wider">Expert local recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <>
              <div className="h-48 bg-slate-100 rounded-[2rem] w-full animate-pulse border border-slate-200"></div>
              <div className="h-48 bg-slate-100 rounded-[2rem] w-full animate-pulse border border-slate-200"></div>
              <div className="h-48 bg-slate-100 rounded-[2rem] w-full animate-pulse border border-slate-200"></div>
            </>
          ) : (
            <>
              {/* FOOD CARD */}
              <div className="group relative bg-white p-6 md:p-8 rounded-[2rem] border border-amber-100 shadow-md shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 -z-10"></div>
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm border border-amber-200/50">🍜</div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-3">What to Eat in {queryName}</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">{aiData?.food || "Discover local street food and culinary specialties."}</p>
              </div>
              
              {/* SHOPPING CARD */}
              <div className="group relative bg-white p-6 md:p-8 rounded-[2rem] border border-purple-100 shadow-md shadow-purple-100/50 hover:shadow-xl hover:shadow-purple-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 -z-10"></div>
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm border border-purple-200/50">🛍️</div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-3">Where to Shop in {queryName}</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">{aiData?.shopping || "Explore famous local markets and unique shopping spots."}</p>
              </div>

              {/* FAMOUS FOR CARD */}
              <div className="group relative bg-white p-6 md:p-8 rounded-[2rem] border border-emerald-100 shadow-md shadow-emerald-100/50 hover:shadow-xl hover:shadow-emerald-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 -z-10"></div>
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm border border-emerald-200/50">📸</div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-3">Famous For {queryName}</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">{aiData?.famous || "Learn about the top historical and cultural landmarks here."}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ❓ GENERATED FAQS */}
      {!hasExistingFaqs && aiData?.faqs && !loading && (
        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <span className="text-3xl">❓</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions about {queryName}</h2>
          </div>
          <div className="space-y-4">
            {aiData.faqs.map((faq: any, idx: number) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Q: {faq.question}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}