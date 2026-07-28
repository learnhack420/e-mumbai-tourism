import { NextResponse } from 'next/server'

// Edge runtime ke liye Native Fetch best hai
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { origin, destination } = await req.json()
    
    if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json({ success: false, routes: [] })
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, routes: [], error: "API Key missing" }, { status: 500 })
    }

    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi.
    Return ONLY a valid JSON array. No explanations, no markdown formatting, just the array with objects containing: mode (string), icon (emoji string like 🚆, 🚌, 🚖), details (string route info), duration (string like "3h 13m"), and priceRange (string in INR like "₹638–₹2,532").`

    // Native Fetch API for Gemini (100% Edge Compatible)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error("Gemini Fetch Error:", errorData);
      return NextResponse.json({ success: false, routes: [], error: "API limit or bad request" }, { status: 500 })
    }

    const data = await apiResponse.json();
    
    // Safety extract text from response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
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
    // Front-end crash se bachane ke liye valid JSON hi return karein
    return NextResponse.json({ success: false, routes: [] }, { status: 500 })
  }
}