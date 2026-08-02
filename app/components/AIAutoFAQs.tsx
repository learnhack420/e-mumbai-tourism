"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'

interface FAQ {
  question: string;
  answer: string;
}

export default function AIAutoFAQs({ 
  origin, 
  destination, 
  tourName,
  existingFaqs 
}: { 
  origin: string, 
  destination: string, 
  tourName: string,
  existingFaqs?: any[] 
}) {
  
  const hasValidExistingFaqs = existingFaqs && existingFaqs.length > 0 && existingFaqs[0]?.question;

  const [faqs, setFaqs] = useState<FAQ[]>(hasValidExistingFaqs ? existingFaqs : []);
  const [loading, setLoading] = useState(!hasValidExistingFaqs);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (hasValidExistingFaqs) {
      setLoading(false);
      return;
    }

    async function fetchAIFaqs() {
      const routeKey = `faq_${origin}_${destination}`.replace(/\s+/g, '_').toLowerCase();
      
      try {
        // 🔥 FIX: .single() ki jagah .maybeSingle() use kiya taaki 406 error na aaye
        const { data } = await supabase.from('ai_route_cache').select('data').eq('route_key', routeKey).maybeSingle();
        if (data && data.data && data.data.length > 0) {
          setFaqs(data.data as FAQ[]);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Ignore cache error, move to API
      }

      // Call API
      try {
        const res = await fetch('/api/generate-faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin, destination, tourName })
        });
        
        const json = await res.json();
        
        if (json.success && json.faqs) {
          setFaqs(json.faqs);
          supabase.from('ai_route_cache').insert([{ route_key: routeKey, data: json.faqs }]).then();
        } else {
          setErrorMsg(json.error || "Failed to generate");
        }
      } catch (error: any) {
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAIFaqs();
  }, [origin, destination, tourName, existingFaqs, hasValidExistingFaqs]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-8 border rounded-3xl bg-white mt-10">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  if (faqs.length === 0) {
    return null; // Kuch mat dikhao agar error aaye toh section hide rahega
  }

  return (
    <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200 mt-10">
      <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">
        Frequently Asked Questions
      </h2>
      <div className="space-y-5">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-gray-100 rounded-2xl p-6 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
            <h4 className="font-black text-gray-800 flex gap-3 text-lg"><span className="text-xl">❓</span> {faq.question}</h4>
            <p className="text-gray-600 text-base mt-3 flex gap-3 leading-relaxed"><span className="text-xl text-blue-400">👉</span> {faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}