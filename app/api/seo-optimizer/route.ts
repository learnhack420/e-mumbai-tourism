import { NextResponse } from 'next/server';

// 🔥 CLOUDFLARE FIX: Edge runtime aur force-dynamic
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title && !description) {
      return NextResponse.json({ success: false, error: 'Title or description is required.' }, { status: 400 });
    }

    // 🔒 Direct process.env se key le rahe hain
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Cloudflare mein GEMINI_API_KEY missing hai!");
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing in Environment Variables!' }, { status: 400 });
    }

    const prompt = `
    You are an expert SEO specialist for an Indian travel portal ("India Tour Operators"). 
    Analyze the following content and provide SEO optimizations in strict JSON format.

    Title: "${title || ''}"
    Content: "${description || ''}"

    Return ONLY a valid JSON object with the following keys:
    - "metaTitle": Catchy, SEO-optimized title under 60 characters containing key search terms.
    - "metaDescription": Engaging description under 160 characters with a clear Call to Action.
    - "metaKeywords": Comma-separated list of 5-8 highly relevant target keywords.
    - "seoScore": An estimated SEO score out of 100 based on the input quality.
    - "suggestions": A short bullet list of 2 actionable tips to further improve the content ranking.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 🔥 8.5-Second Timeout: Cloudflare ke 10-second kill se bachne ke liye
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    // 🚀 Pure native fetch (No Google SDK imported anywhere)
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

    if (!apiResponse.ok) {
      const errData = await apiResponse.text();
      console.error('Google API Error:', errData);
      return NextResponse.json({ success: false, error: 'Google AI limit reached or invalid key.' }, { status: 400 });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // JSON clean karna
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let seoData;
    try {
      seoData = JSON.parse(cleanedJson);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'AI returned invalid data format.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: seoData });

  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    console.error('SERVER AI SEO Error:', error.message);
    
    // 🚨 Agar Code Phat Bhi Gaya, Toh Properly Formatted JSON Error Jayega
    return NextResponse.json({ 
      success: false, 
      error: isTimeout ? 'AI optimization took too long. Please try a shorter description.' : 'Internal Server Error' 
    }, { status: 500 });
  }
}