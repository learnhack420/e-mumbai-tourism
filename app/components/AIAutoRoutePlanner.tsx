"use client"
import { useEffect, useState } from 'react'

interface RouteOption {
  mode: string;
  icon: string;
  details: string;
  duration: string;
  priceRange: string;
}

export default function AIAutoRoutePlanner({ origin, destination }: { origin: string, destination: string }) {
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchRoutesDirectly() {
      if (!origin || !destination) {
        setLoading(false)
        return
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
        
        if (!apiKey) {
          console.error("API Key missing! Make sure NEXT_PUBLIC_GEMINI_API_KEY is set.");
          setError(true);
          setLoading(false);
          return;
        }

        // 🔥 TWEAKED PROMPT: Instructed AI to keep price & duration concise
        const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi. Return ONLY a valid JSON array of objects with: mode (string), icon (emoji string), details (string route info, put all long explanations here), duration (SHORT string like '3h 15m'), priceRange (SHORT string in INR like '₹500-₹800').`;
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) throw new Error("Google Gemini API limit or error");

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        setRoutes(JSON.parse(cleanedJson));
      } catch (err) {
        console.error("AI Client Fetch Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRoutesDirectly();
  }, [origin, destination])

  if (loading) {
    return (
      <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide uppercase">AI is analyzing best routes...</p>
      </div>
    )
  }

  if (error || routes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-2xl">🗺️</span> AI Suggested Travel Options
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {routes.map((route, idx) => (
          // 🔥 FIXED LAYOUT: Responsive flex-col to flex-row, removed tight width restrictions
          <div key={idx} className="flex flex-col md:flex-row gap-4 justify-between p-4 md:p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            
            {/* Left side: Icon + Details (Now uses flex-1 to take available space) */}
            <div className="flex items-start gap-4 flex-1">
              <span className="text-3xl bg-blue-50/80 p-3 rounded-xl shrink-0 border border-blue-100 shadow-inner">
                {route.icon || '📍'}
              </span>
              <div className="flex-1">
                <h4 className="font-extrabold text-gray-900 text-base md:text-lg">{route.mode}</h4>
                <p className="text-sm font-medium text-gray-600 mt-1 leading-relaxed pr-2">
                  {route.details}
                </p>
              </div>
            </div>

            {/* Right side: Price & Duration (Wraps nicely, highlighted in a sub-box) */}
            <div className="flex flex-col items-start md:items-end justify-center shrink-0 bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 md:min-w-[150px] md:max-w-[250px]">
              <span className="block font-black text-blue-700 text-sm md:text-base break-words text-left md:text-right">
                {route.priceRange}
              </span>
              <span className="text-xs font-bold text-slate-500 mt-1 break-words text-left md:text-right">
                ⏳ {route.duration}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}