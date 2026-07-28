import { NextResponse } from 'next/server'

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // 1. Hyper-safe JSON parsing (Agar frontend se galat data aaye toh crash nahi hoga)
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, routes: [] });
    }

    const { origin, destination } = body;
    
    if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json({ success: false, routes: [] });
    }

    // 2. Hyper-safe Environment Variable checking
    let apiKey = '';
    try {
      apiKey = process.env.GEMINI_API_KEY || '';
    } catch (e) {
      console.error("Process is not defined in this edge environment");
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, routes: [] });
    }

    const prompt = `Act as a travel transit expert. Provide realistic travel options from ${origin} to ${destination} including Train, Bus, Drive, and Taxi.
    Return ONLY a valid JSON array. No explanations, no markdown formatting, just the array with objects containing: mode (string), icon (emoji string like 🚆, 🚌, 🚖), details (string route info), duration (string like "3h 13m"), and priceRange (string in INR like "₹638–₹2,532").`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!apiResponse.ok) {
      return NextResponse.json({ success: false, routes: [] });
    }

    const data = await apiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let routes = [];
    try {
      routes = JSON.parse(cleanedJson);
    } catch (parseErr) {
      routes = []; 
    }

    return NextResponse.json({ success: true, routes })
  } catch (error: any) {
    // Agar koi bhi unknown error aaye toh JSON bhejega, 500 nahi dega
    return NextResponse.json({ success: false, routes: [] })
  }
}