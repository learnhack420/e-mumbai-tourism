import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    // 🔒 Secure way: Only using Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is missing in Environment Variables!' }, 
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { title, description } = await req.json();

    if (!title && !description) {
      return NextResponse.json({ success: false, error: 'Title or description is required.' }, { status: 400 });
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
      }
    });

    let resultText = '';
    if (typeof response.text === 'string') {
      resultText = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      resultText = response.candidates[0].content.parts[0].text;
    } else {
      resultText = JSON.stringify(response);
    }

    let seoData;
    try {
      seoData = JSON.parse(resultText);
    } catch (parseErr) {
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      seoData = JSON.parse(cleanJson);
    }

    return NextResponse.json({ success: true, data: seoData });

  } catch (error: any) {
    console.error('SERVER AI SEO Error:', error);

    const isRateLimit = 
      error?.status === 429 || 
      error?.message?.includes('429') || 
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.status === 'RESOURCE_EXHAUSTED';

    if (isRateLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Our AI service is temporarily busy handling other requests. Please wait about a minute and try again.' 
        }, 
        { status: 429 } 
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}