import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { origin, destination, tourName } = await req.json();
    
    console.log("👉 1. FAQ Request aayi:", origin, "to", destination);

    if (!destination) {
      console.log("❌ FAQ ERROR: Destination missing");
      return NextResponse.json({ success: false, error: "Destination missing" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("❌ FAQ ERROR: API Key missing in .env");
      return NextResponse.json({ success: false, error: "API Key missing" });
    }

    const prompt = `Act as a local travel expert. Generate exactly 5 most frequently asked questions and their short, helpful answers for a tourist traveling from "${origin}" to "${destination}" for the tour "${tourName}".
    Return EXACTLY this JSON array format. No markdown, no extra text.
    [
      { "question": "Question 1?", "answer": "Answer 1" },
      { "question": "Question 2?", "answer": "Answer 2" },
      { "question": "Question 3?", "answer": "Answer 3" },
      { "question": "Question 4?", "answer": "Answer 4" },
      { "question": "Question 5?", "answer": "Answer 5" }
    ]`;
    
    // 🔥 Wahi model yahan dalein jo aapke Route Planner me successfully chal raha hai
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 20 seconds diya hai

    console.log("⏳ 2. Gemini se FAQs maang rahe hain...");
    
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
      const errorText = await apiResponse.text();
      console.log("❌ FAQ ERROR: Gemini Rejected:", errorText);
      return NextResponse.json({ success: false, error: "API Rejected" });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleanedJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    console.log("✅ 3. FAQs generate ho gaye!");
    
    return NextResponse.json({ success: true, faqs: JSON.parse(cleanedJson) });

  } catch (error: any) {
    console.log("❌ FAQ ERROR: Crash ho gaya -", error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}