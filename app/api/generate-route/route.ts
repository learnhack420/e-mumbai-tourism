import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai';

// Cloudflare Workers / Edge Runtime ke liye zaroori hai
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { origin, destination } = await req.json()
    
    // Agar origin aur destination nahi hain ya same hain toh empty array return karein
    if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json({ success: false, routes: [] })
    }

    // API Key check (Cloudflare env ya process.env dono handle karega)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in environment variables.");
      return NextResponse.json({ success: false, error: "API key not configured on server." }, { status: 500 })
    }

    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi.
    Return ONLY a valid JSON array. No explanations, no markdown formatting outside the JSON, just the array with objects containing: mode (string), icon (emoji string like 🚆, 🚌, 🚖), details (string route info), duration (string like "3h 13m"), and priceRange (string in INR like "₹638–₹2,532").`

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Safely extract text from response
    const text = response.text ? await response.text() : '[]';
    
    // Clean JSON response from markdown blocks safely
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let routes = [];
    try {
      routes = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("JSON Parse Error from AI response:", text);
      routes = []; // Agar JSON kharab bhi aaye toh app crash nahi hoga, empty array jayega
    }

    return NextResponse.json({ success: true, routes })
  } catch (error: any) {
    console.error("AI Route Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 })
  }
}