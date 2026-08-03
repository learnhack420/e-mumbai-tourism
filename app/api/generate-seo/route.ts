import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    // 1. Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing in .env.local file");
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const { title, description, location, categoryType } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 2. Clear Prompt for AI
    const prompt = `
      You are an Expert SEO Specialist. 
      I am giving you details about a ${categoryType} (can be hotel, tour, cab, or blog).
      
      Title: "${title}"
      Location: "${location || 'Not specified'}"
      Content/Description: "${description || 'No description provided'}"

      Based on this, generate:
      1. A highly clickable SEO Meta Title (max 60 characters).
      2. An engaging Meta Description (between 140 to 160 characters).
      3. 5 to 8 relevant Meta Keywords separated by commas.

      Return the response as a JSON object strictly following this schema:
      {
        "metaTitle": "string",
        "metaDescription": "string",
        "metaKeywords": "string"
      }
    `

    // 3. Force JSON Output (Yeh naya feature hai jo crash rokkega)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // 4. Parse and Return
    const seoData = JSON.parse(responseText)
    return NextResponse.json(seoData)

  } catch (error) {
    // Terminal mein proper error print karega taaki reason pata chale
    console.error('🔥 AI SEO Route Error:', error)
    return NextResponse.json({ error: 'Failed to generate SEO' }, { status: 500 })
  }
}