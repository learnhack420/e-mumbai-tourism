// 🚀 NextResponse hata diya hai. Pure Web API (Response) use karenge jo Cloudflare par 100% stable hai.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 🛡️ Safe JSON Parsing: Agar frontend se galat data aaya toh server crash nahi hoga
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request body sent from frontend.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { title, description } = body;

    if (!title && !description) {
      return new Response(JSON.stringify({ success: false, error: 'Title or description is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINI_API_KEY is missing in Environment Variables!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

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
      return new Response(JSON.stringify({ success: false, error: 'Google AI limit reached or invalid key.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let seoData;
    try {
      seoData = JSON.parse(cleanedJson);
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'AI returned invalid data format.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Har condition mein perfectly formatted JSON jayega
    return new Response(JSON.stringify({ success: true, data: seoData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    
    // 🚨 Agar Code Phat Bhi Gaya, Toh Pure JSON Response Jayega, Plain Text Nahi
    return new Response(JSON.stringify({ 
      success: false, 
      error: isTimeout ? 'AI optimization took too long. Please try again.' : `Backend Error: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}