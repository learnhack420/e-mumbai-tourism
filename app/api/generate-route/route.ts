import { NextResponse } from 'next/server';

// 🔥 CLOUDFLARE FIX: In dono lines ka hona sabse zaroori hai
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination } = body;
    
    // Agar data nahi hai toh silently khali array bhej do
    if (!origin || !destination) {
      return NextResponse.json({ success: false, routes: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Cloudflare mein GEMINI_API_KEY missing hai!");
      return NextResponse.json({ success: false, routes: [] });
    }

    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi. Return ONLY a valid JSON array of objects with: mode (string), icon (string), details (string), duration (string), priceRange (string).`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 🔥 7-Second Timeout: Cloudflare ke 10-second kill se bachne ke liye
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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

  } catch (error) {
    // Agar Timeout ho jaye ya Next.js crash ho, toh bhi Frontend ko 200 OK ke sath empty array milega (App crash nahi hoga)
    return NextResponse.json({ success: false, routes: [] });
  }
}