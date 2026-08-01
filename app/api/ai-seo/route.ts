import { NextResponse } from 'next/server';

// 🔥 CLOUDFLARE FIX: Edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, description } = body;
    
    if (!title && !description) {
      return NextResponse.json({ success: false, data: {} });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, data: {} });
    }

    // 🚀 CPU CRASH PREVENTER: Lamba description Cloudflare ko crash kar deta hai.
    const safeTitle = title ? String(title).substring(0, 150) : '';
    const safeDescription = description ? String(description).substring(0, 1500) : '';

    const prompt = `Act as an expert SEO specialist. Analyze the following and provide SEO optimizations in strict JSON format. Title: "${safeTitle}" Content: "${safeDescription}". Return ONLY a valid JSON object with: metaTitle, metaDescription, metaKeywords, seoScore, suggestions.`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 🔥 6.5 Second Timeout
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