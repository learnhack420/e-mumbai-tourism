import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge' // Cloudflare Edge runtime ke liye zaroori hai

export async function POST(req: Request) {
  try {
    // Cloudflare par process.env ya global scope se key lene ka tareeqa
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing on Cloudflare environment");
      return NextResponse.json({ error: 'API Key missing on server configuration' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const body = await req.json()
    const { title, description, location, categoryType } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

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

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const seoData = JSON.parse(responseText)
    return NextResponse.json(seoData)

  } catch (error: any) {
    console.error('🔥 Cloudflare AI SEO Route Error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to generate SEO: ' + (error?.message || 'Unknown error') }, { status: 500 })
  }
}