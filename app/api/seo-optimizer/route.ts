import { NextResponse } from 'next/server';

// 🔥 CLOUDFLARE FIX: Edge config
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 🛠️ FIX 1: Safely parse body to prevent edge crashes
    const textBody = await req.text();
    if (!textBody) {
      return NextResponse.json({ success: false, error: 'Request body is empty.' }, { status: 400 });
    }
    
    const body = JSON.parse(textBody);
    const { title, description } = body;

    if (!title && !description) {
      return NextResponse.json({ success: false, error: 'Title or description is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Cloudflare mein GEMINI_API_KEY missing hai!");
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing!' }, { status: 500 });
    }

    const prompt = `
    You are an expert SEO specialist for an Indian travel portal ("India Tour Operators"). 
    Analyze the following content and provide SEO optimizations in strict JSON format.

    Title: "${title}"
    Content: "${description}"

    Return ONLY a valid JSON object with the following keys:
    - "metaTitle": Catchy, SEO-optimized title under 60 characters containing key search terms.
    - "metaDescription": Engaging description under 160 characters with a clear Call to Action.
    - "metaKeywords": Comma-separated list of 5-8 highly relevant target keywords.
    - "seoScore": An estimated SEO score out of 100 based on the input quality.
    - "suggestions": A short bullet list of 2 actionable tips to further improve the content ranking.
    `;

    // 🛠️ FIX 2: Correct model version (gemini-2.5-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      return NextResponse.json({ success: false, error: 'Google AI error or invalid key.' }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
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
    
    // 🛠️ FIX 3: Added { status: 500 } so frontend knows it's an actual error
    return NextResponse.json({ 
      success: false, 
      error: isTimeout ? 'AI optimization took too long. Please try a shorter description.' : 'Internal Server Error' 
    }, { status: 500 });
  }
}