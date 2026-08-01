import { NextResponse } from 'next/server';

// 🔥 CLOUDFLARE FIX: Edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    // 🛡️ FIX 1: Safe JSON Parsing (Taki galat request par crash na ho)
    const body = await req.json().catch(() => ({}));
    const { title, description } = body;
    
    if (!title && !description) {
      return NextResponse.json({ success: false, data: {} });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Cloudflare mein GEMINI_API_KEY missing hai!");
      return NextResponse.json({ success: false, data: {} });
    }

    // 🚀 FIX 2: THE MAGIC BULLET (CPU Crash Preventer)
    // Lamba description Cloudflare ko crash kar deta hai, isliye hum isko 1500 characters par rok rahe hain.
    const safeTitle = title ? String(title).substring(0, 150) : '';
    const safeDescription = description ? String(description).substring(0, 1500) : '';

    const prompt = `Act as an expert SEO specialist. Analyze the following and provide SEO optimizations in strict JSON format. Title: "${safeTitle}" Content: "${safeDescription}". Return ONLY a valid JSON object with: metaTitle, metaDescription, metaKeywords, seoScore, suggestions.`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 🔥 FIX 3: Timeout ko 6 seconds kiya hai taaki Cloudflare ke kill switch se pehle humara catch chal jaye
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
    // Ab CPU overload nahi hoga, toh properly yeh catch block chalega!
    console.error("SEO API Caught Error:", error);
    return NextResponse.json({ success: false, data: {} });
  }
}