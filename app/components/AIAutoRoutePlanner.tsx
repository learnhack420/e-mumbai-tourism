"use client"
import { useState, useEffect } from 'react'

export default function AIAutoRoutePlanner({ origin, destination }: { origin: string, destination: string }) {
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<any>(null)

  useEffect(() => {
    async function fetchAiroutes() {
      if (!origin || !destination) return
      setLoading(true)
      try {
        // Yahan hum internal API route call karenge jo AI se data layega
        const res = await fetch('/api/generate-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin, destination })
        })
        const data = await res.json()
        if (data.success) {
          setRoutes(data.routes)
        }
      } catch (err) {
        console.error("Failed to load AI routes", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAiroutes()
  }, [origin, destination])

  // Improved Skeleton Loader for a smooth user experience while AI thinks
  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-purple-100 rounded-full w-28"></div>
        </div>
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  // Agar AI koi route na dhund paye ya koi issue aaye
  if (!routes || routes.length === 0) return null

  return (
    <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-2xl font-extrabold text-gray-900">Travel Options & Routes</h2>
        <span className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
          ✨ AI Route Planner
        </span>
      </div>

      <div className="space-y-4">
        {routes.map((route: any, idx: number) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{route.icon || '🚆'}</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{route.mode}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{route.details}</p>
              </div>
            </div>
            <div className="text-right whitespace-nowrap ml-4">
              <span className="block font-extrabold text-gray-900 text-sm">{route.priceRange}</span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                {route.duration}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}