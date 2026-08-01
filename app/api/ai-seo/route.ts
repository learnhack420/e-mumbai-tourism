import { NextResponse } from 'next/server';

// 🔥 CLOUDFLARE FIX: Exactly same as your working transit code
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    // Exact Transit API style parsing (No extra catch blocks)
    const body = await req.json();
    const { title, location } = body;
    
    if (!title || !location) {
      return NextResponse.json({ success: false, data: {} });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, data: {} });
    }

    const prompt = `Act as an expert SEO specialist. Write SEO optimizations for a tourist place named "${title}" located in "${location}". Return ONLY a valid JSON object with: metaTitle, metaDescription, metaKeywords, seoScore, suggestions.`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 🔥 7-Second Timeout: Exactly same as Transit
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
      return NextResponse.json({ success: false, data: {} });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let seoData = {};
    try {
      seoData = JSON.parse(cleanedJson);
    } catch (e) {
      seoData = {};
    }

    return NextResponse.json({ success: true, data: seoData });

  } catch (error) {
    // Exact Transit style Catch block
    return NextResponse.json({ success: false, data: {} });
  }
}