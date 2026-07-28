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
        // 🔥 FRONTEND SE DIRECT CALL (Bypassing Cloudflare Server Limits)
        // Frontend par env variables ko NEXT_PUBLIC_ se shuru karna zaroori hai
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
        
        if (!apiKey) {
          console.error("API Key missing! Make sure NEXT_PUBLIC_GEMINI_API_KEY is set.");
          setError(true);
          setLoading(false);
          return;
        }

        const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi. Return ONLY a valid JSON array of objects with: mode (string), icon (emoji string), details (string route info), duration (string), priceRange (string in INR).`;
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
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500 animate-pulse">AI is calculating the best routes from {origin} to {destination}...</p>
      </div>
    )
  }

  if (error || routes.length === 0) {
    return null; // Agar error aaye toh silent raho, sirf map dikhao (App crash nahi hoga)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-3">AI Suggested Travel Options</h3>
      <div className="grid grid-cols-1 gap-3">
        {routes.map((route, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <span className="text-3xl bg-blue-50 p-2 rounded-lg">{route.icon || '📍'}</span>
              <div>
                <h4 className="font-extrabold text-gray-900">{route.mode}</h4>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{route.details}</p>
              </div>
            </div>
            <div className="text-right whitespace-nowrap pl-4">
              <span className="block font-black text-blue-700">{route.priceRange}</span>
              <span className="text-xs font-bold text-gray-400">{route.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}