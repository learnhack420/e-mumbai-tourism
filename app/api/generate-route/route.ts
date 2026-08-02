import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination } = body;
    
    if (!origin || !destination) {
      return NextResponse.json({ success: false, error: "Origin or Destination missing" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is missing in .env file" });
    }

    const prompt = `You are a professional mapping and travel guide in India. Calculate the accurate road distance, realistic travel times, and current fair market costs for traveling from "${origin}" to "${destination}".
    Return EXACTLY this JSON structure. No markdown, no extra text.
    {
      "distance": "e.g. 170 km",
      "driveTime": "e.g. 4h 15m",
      "driveDetails": "e.g. via Mumbai-Agra National Hwy",
      "trainTime": "e.g. 3h 45m",
      "trainOptions": "e.g. Panchavati Exp, Tapovan Exp",
      "busTime": "e.g. 4h 30m",
      "busOptions": "e.g. MSRTC Shivneri AC, Neeta Volvo",
      "taxiTime": "e.g. 4h 15m",
      "taxiOptions": "e.g. Sedan/SUV via Ola/Uber",
      "trainCost": "e.g. ₹140 - ₹550",
      "busCost": "e.g. ₹350 - ₹950",
      "cabCost": "e.g. ₹3,200 - ₹4,500",
      "fuelCost": "e.g. ₹1,400 - ₹2,100"
    }`;
    
    // 🔥 Yahan dhyaan dejiye: humne 2.5 ko 1.5 kar diya hai kyunki Google me 1.5 flash latest hai
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 🔥 NAYI TRICK: Agar Google API fail hoti hai, toh wo pura error Frontend ko bhej dega
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text(); // Google ka exact error message
      return NextResponse.json({ 
        success: false, 
        error: `Google API Error (${apiResponse.status}): ${errorText}` 
      });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanedJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let routeData = {};
    try {
      routeData = JSON.parse(cleanedJson);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Google sent invalid JSON format" });
    }

    return NextResponse.json({ success: true, routes: routeData });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: `Crash: ${error.message}` });
  }
}