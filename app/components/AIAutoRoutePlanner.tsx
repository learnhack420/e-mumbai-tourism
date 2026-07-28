"use client"
import { useEffect, useState } from 'react'

interface RouteData {
  distance: string;
  driveTime: string;
  trainTime: string;
  busTime: string;
  taxiTime: string;
  trainCost: string;
  busCost: string;
  cabCost: string;
  fuelCost: string;
  trainOptions: string;
  busOptions: string;
  driveDetails: string;
  taxiOptions: string;
}

export default function AIAutoRoutePlanner({ 
  origin, 
  destination, 
  location 
}: { 
  origin?: string, 
  destination?: string, 
  location?: string 
}) {
  let finalOrigin = origin || 'India';
  let finalDestination = destination;

  if (location && !finalDestination) {
    const parts = location.split('➔').map((s: string) => s.trim())
    if (parts.length > 1) {
      finalOrigin = parts[0]
      finalDestination = parts[1]
    } else {
      finalOrigin = 'Current Location'
      finalDestination = parts[0]
    }
  }

  if (!finalDestination) finalDestination = location || 'Destination';

  const [estimates, setEstimates] = useState<RouteData>({
    distance: "Calculating...",
    driveTime: "Loading...",
    trainTime: "Loading...",
    busTime: "Loading...",
    taxiTime: "Loading...",
    trainCost: "...",
    busCost: "...",
    cabCost: "...",
    fuelCost: "...",
    trainOptions: "Fetching details...",
    busOptions: "Fetching details...",
    driveDetails: "Fetching details...",
    taxiOptions: "Fetching details..."
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGeminiRouteEstimates() {
      // Create a unique key for the database (e.g., "mumbai_pune")
      const routeKey = `${finalOrigin}_${finalDestination}`.replace(/\s+/g, '_').toLowerCase();
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // 1. SUPABASE DATABASE CHECK
      if (supabaseUrl && supabaseKey) {
        try {
          const dbCheckRes = await fetch(`${supabaseUrl}/rest/v1/ai_route_cache?route_key=eq.${routeKey}&select=data`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          
          if (dbCheckRes.ok) {
            const rows = await dbCheckRes.json();
            if (rows.length > 0 && rows[0].data) {
              setEstimates(rows[0].data);
              setLoading(false);
              console.log(`Loaded ${finalOrigin} to ${finalDestination} from Supabase Database!`);
              return; // Halt execution here. No Gemini API Call!
            }
          }
        } catch (dbErr) {
          console.warn("Supabase read failed, attempting Gemini fetch...", dbErr);
        }
      }

      // 2. FETCH FROM GEMINI (If DB misses)
      let parsedData: RouteData | null = null;

      try {
        const rawApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const geminiApiKey = rawApiKey ? rawApiKey.trim() : "";
        
        if (!geminiApiKey) throw new Error("Missing Gemini API Key in .env file");
        if (!geminiApiKey.startsWith('AIzaSy')) throw new Error("Invalid API Key Format");

        const prompt = `You are a professional mapping and travel guide in India. Calculate the accurate road distance, realistic travel times, and current fair market costs for traveling from "${finalOrigin}" to "${finalDestination}".
        Return exactly this JSON structure with real estimates:
        {
          "distance": "exact road distance e.g. 170 km",
          "driveTime": "e.g. 4h 15m",
          "driveDetails": "Name of best highway/route e.g. via Mumbai-Agra National Hwy",
          "trainTime": "e.g. 3h 45m",
          "trainOptions": "Names of 2-3 popular trains e.g. Panchavati Exp, Tapovan Exp",
          "busTime": "e.g. 4h 30m",
          "busOptions": "Types/Operators e.g. MSRTC Shivneri AC, Neeta Volvo, Sleeper",
          "taxiTime": "e.g. 4h 15m",
          "taxiOptions": "Types of cabs e.g. Sedan/SUV via Ola/Uber/MakeMyTrip",
          "trainCost": "in INR, e.g. ₹140 - ₹550 (2S to CC)",
          "busCost": "in INR, e.g. ₹350 - ₹950 (Non-AC to AC Sleeper)",
          "cabCost": "in INR, e.g. ₹3,200 - ₹4,500 (Hatchback to SUV)",
          "fuelCost": "in INR, e.g. ₹1,400 - ₹2,100"
        }`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) throw new Error(`Status: ${response.status}`);

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;
        parsedData = JSON.parse(content);
        
        setEstimates(parsedData as RouteData);
        
      } catch (err: any) {
        console.warn("Gemini Error:", err);
        const errorMsg = err.message || "";
        const cleanMessage = (errorMsg.includes("Quota") || errorMsg.includes("429")) 
            ? "Data unavailable right now (Server Busy)" 
            : "Data temporarily unavailable";

        setEstimates({
          distance: cleanMessage, driveTime: "--", trainTime: "--", busTime: "--",
          taxiTime: "--", trainCost: "--", busCost: "--", cabCost: "--", fuelCost: "--",
          trainOptions: "Please check back later", busOptions: "Please check back later",
          driveDetails: "Please check back later", taxiOptions: "Please check back later"
        });
      } finally {
        setLoading(false);
      }

      // 3. SAVE TO SUPABASE (If Gemini data was fetched successfully)
      if (parsedData && supabaseUrl && supabaseKey) {
        try {
          await fetch(`${supabaseUrl}/rest/v1/ai_route_cache`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates' // Overwrites if route already exists
            },
            body: JSON.stringify({
              route_key: routeKey,
              data: parsedData
            })
          });
          console.log(`Saved ${finalOrigin} to ${finalDestination} into Supabase!`);
        } catch (dbSaveErr) {
          console.warn("Failed to save to Supabase Database", dbSaveErr);
        }
      }
    }

    fetchGeminiRouteEstimates();
  }, [finalOrigin, finalDestination]);

  const transitMapUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(finalOrigin)}&daddr=${encodeURIComponent(finalDestination)}&dirflg=r&output=embed`;
  const isMatheranRoute = finalDestination.toLowerCase().includes('matheran');

  const renderCostDetails = (costString: string, colorClass: string) => {
    if (!costString || costString === "--") return <span className="font-black text-slate-400">--</span>;
    const parts = costString.split('(');
    const price = parts[0].trim();
    const subtext = parts.length > 1 ? `(${parts[1]}`.trim() : null;

    return (
      <div className="flex flex-col items-end justify-center">
        <span className={`font-black ${colorClass} text-base leading-none`}>{price}</span>
        {subtext && <span className="text-[10px] text-slate-500 font-medium mt-1 leading-none">{subtext}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span className="text-2xl">🗺️</span> AI Route, Map & Travel Options
        </h3>
        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
          {finalOrigin} ➔ {finalDestination} {loading && " (Calculating...)"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        
        {/* CAR CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <span className="text-3xl bg-slate-50 p-3 rounded-2xl border border-slate-100 shrink-0">🚗</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-extrabold text-slate-900 text-base">Self Drive / Road</h4>
                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">DRIVE</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-1">🛣️ Distance: <span className="text-blue-600">{estimates.distance}</span> (⏱️ {estimates.driveTime})</p>
              <p className="text-[11px] text-slate-500 leading-snug"><span className="font-semibold text-slate-700">Route:</span> {estimates.driveDetails}</p>
            </div>
          </div>
          <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center md:items-end justify-between shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 md:hidden">Est. Fuel Cost</span>
            {renderCostDetails(estimates.fuelCost, "text-slate-900")}
          </div>
        </div>

        {/* TRAIN CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <span className="text-3xl bg-emerald-50 p-3 rounded-2xl border border-emerald-100 shrink-0">🚂</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-extrabold text-slate-900 text-base">Train & Transit</h4>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">CHEAPEST</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-1">⏱️ Duration: <span className="text-emerald-600">{estimates.trainTime}</span></p>
              <p className="text-[11px] text-slate-500 leading-snug mb-1"><span className="font-semibold text-slate-700">Trains:</span> {estimates.trainOptions}</p>
              {isMatheranRoute && <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-extrabold border border-amber-200 inline-block mt-1"></span>}
            </div>
          </div>
          <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center md:items-end justify-between shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 md:hidden">Est. Ticket Cost</span>
            {renderCostDetails(estimates.trainCost, "text-emerald-700")}
          </div>
        </div>

        {/* TAXI CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <span className="text-3xl bg-amber-50 p-3 rounded-2xl border border-amber-100 shrink-0">🚖</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-extrabold text-slate-900 text-base">Private Taxi</h4>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">COMFORT</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-1">⏱️ Duration: <span className="text-amber-600">{estimates.taxiTime}</span></p>
              <p className="text-[11px] text-slate-500 leading-snug"><span className="font-semibold text-slate-700">Options:</span> {estimates.taxiOptions}</p>
            </div>
          </div>
          <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center md:items-end justify-between shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 md:hidden">Est. Cab Fare</span>
            {renderCostDetails(estimates.cabCost, "text-amber-700")}
          </div>
        </div>

        {/* BUS CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <span className="text-3xl bg-purple-50 p-3 rounded-2xl border border-purple-100 shrink-0">🚌</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-extrabold text-slate-900 text-base">Bus Services</h4>
                <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md">REGULAR</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-1">⏱️ Duration: <span className="text-purple-600">{estimates.busTime}</span></p>
              <p className="text-[11px] text-slate-500 leading-snug"><span className="font-semibold text-slate-700">Bus Types:</span> {estimates.busOptions}</p>
            </div>
          </div>
          <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center md:items-end justify-between shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 md:hidden">Est. Bus Fare</span>
            {renderCostDetails(estimates.busCost, "text-purple-700")}
          </div>
        </div>

      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mt-6">
        <div className="w-full h-[400px] md:h-[450px] bg-slate-100 relative">
          <iframe 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            loading="lazy" 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade" 
            src={transitMapUrl}
            title="Google Maps Transit Route"
          ></iframe>
        </div>

        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl bg-slate-800 p-2 rounded-xl">📍</span>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Route Direction</span>
              <span className="font-extrabold text-white text-sm sm:text-base">
                {finalOrigin} to {finalDestination} <span className="text-blue-400 font-bold ml-1">
                  {estimates.distance.includes("unavailable") ? "" : `(${estimates.distance})`}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/90 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">⏱️ Drive Time:</span> 
              <span className="text-white font-black text-sm">{estimates.driveTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}