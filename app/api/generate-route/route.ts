import { NextResponse } from 'next/server'

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // 1. Safe Body Parsing for Edge
    const textBody = await req.text();
    if (!textBody) return NextResponse.json({ success: false, routes: [] });
    
    const body = JSON.parse(textBody);
    const { origin, destination } = body;
    
    if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json({ success: false, routes: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, routes: [] });
    }

    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi. Return ONLY a valid JSON array of objects with: mode, icon, details, duration, priceRange.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 🔥 FIX: 8-Second Timeout Guard (Cloudflare kills at 10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const apiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal
      });

      clearTimeout(timeoutId); // Clear timeout if response comes early

      if (!apiResponse.ok) {
        return NextResponse.json({ success: false, routes: [] });
      }

      const data = await apiResponse.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let routes = [];
      try {
        routes = JSON.parse(cleanedJson);
      } catch (e) {
        routes = [];
      }

      return NextResponse.json({ success: true, routes });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Agar 8 second timeout ho jaye ya network error aaye
      console.error("Fetch aborted or failed:", fetchError.message);
      return NextResponse.json({ success: false, routes: [] });
    }

  } catch (error: any) {
    // Kisi bhi haalat mein 500 error return nahi karni hai
    return NextResponse.json({ success: false, routes: [] });
  }
}