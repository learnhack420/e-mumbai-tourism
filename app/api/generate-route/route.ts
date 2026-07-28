import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { origin, destination } = await req.json()
    
    if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json({ success: false, routes: [] })
    }

    // Cloudflare environment safety check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is missing on Cloudflare/Server.");
      return NextResponse.json({ 
        success: false, 
        error: "GEMINI_API_KEY is missing. Please add it in Cloudflare Workers settings." 
      }, { status: 500 })
    }

    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi.
    Return ONLY a valid JSON array. No explanations, no markdown formatting, just the array with objects containing: mode (string), icon (emoji string like 🚆, 🚌, 🚖), details (string route info), duration (string like "3h 13m"), and priceRange (string in INR like "₹638–₹2,532").`

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // 🔥 FIXED: Removed the `await ()` because response.text is already a string
    const text = response.text || '[]';
    
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let routes = [];
    try {
      routes = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("JSON Parse Error:", text);
      routes = []; 
    }

    return NextResponse.json({ success: true, routes })
  } catch (error: any) {
    console.error("AI Route Internal Error:", error?.message || error)
    return NextResponse.json({ success: false, error: error?.message || "Internal Server Error" }, { status: 500 })
  }
}