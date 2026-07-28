import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'; // ya aapka preferred AI client

export async function POST(req: Request) {
  try {
    const { origin, destination } = await req.json()
    
    // Agar origin aur destination same hain (Local Tour) toh zaroorat nahi
    if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json({ success: false, routes: [] })
    }

    // AI Prompt generate karna jaisa Rome2rio dikhata hai
    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi.
    Return ONLY a JSON array with objects containing: mode (string), icon (emoji string like 🚆, 🚌, 🚖), details (string route info), duration (string like "3h 13m"), and priceRange (string in INR like "₹638–₹2,532").`

    // Gemini API initialization (using environment key)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '[]'
    // Clean JSON response from markdown blocks if any
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const routes = JSON.parse(cleanedJson)

    return NextResponse.json({ success: true, routes })
  } catch (error: any) {
    console.error("AI Route Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}