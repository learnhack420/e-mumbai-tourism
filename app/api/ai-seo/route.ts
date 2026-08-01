import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, location } = body;
    
    if (!title) {
      return NextResponse.json({ success: false, data: {} });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Cloudflare mein GEMINI_API_KEY missing hai!");
      return NextResponse.json({ success: false, data: {} });
    }

    // 🚀 PROMPT MEIN SIRF TITLE AUR LOCATION HAI (No long description)
    const prompt = `Act as an expert SEO specialist. Write SEO optimizations for a tourist place named "${title}" located in "${location}". Return ONLY a valid JSON object with: metaTitle, metaDescription (catchy, 150 chars), metaKeywords, seoScore (random 85-98), suggestions (2 short tips).`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

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
    return NextResponse.json({ success: false, data: {} });
  }
}