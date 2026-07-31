import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client initialize (Service Role ya standard client jo aap use kar rahe hain)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { placeId, targetCity, needFaqs } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    // 🌟 STEP 1: Check if data already exists in Supabase Database for this place
    if (placeId) {
      const { data: existingPlace, error: fetchError } = await supabase
        .from('listings')
        .select('metadata')
        .eq('id', placeId)
        .single();

      if (!fetchError && existingPlace?.metadata?.ai_guide) {
        console.log(`⚡ Using CACHED AI Data from Database for place ID: ${placeId}`);
        return NextResponse.json(existingPlace.metadata.ai_guide);
      }
    }

    console.log(`⏳ No cache found. Fetching fresh AI Data for: ${targetCity}...`);

    // 🌟 STEP 2: Dynamically detect available Gemini model
    const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsReq.json();
    
    let selectedModel = "models/gemini-2.5-flash"; 
    if (modelsData && modelsData.models) {
        const validModels = modelsData.models.filter((m: any) => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes("generateContent") &&
            m.name.includes("gemini")
        );
        if (validModels.length > 0) {
            const flashModel = validModels.find((m: any) => m.name.includes("flash"));
            selectedModel = flashModel ? flashModel.name : validModels[0].name;
        }
    }

    // 🌟 STEP 3: Generate AI Content
    const prompt = `Act as an expert local travel guide for ${targetCity}, India.
    Provide the following information in strict JSON format ONLY. 
    1. "food": 2-3 sentences about what local food a tourist MUST eat here (in English).
    2. "shopping": 2-3 sentences about what to shop and the best local markets (in English).
    3. "famous": 2-3 sentences about what this city/place is most famous for (in English).
    ${needFaqs ? `4. "faqs": Provide EXACTLY 5 frequently asked questions and answers for a tourist visiting ${targetCity}. Format as an array of objects with "question" and "answer" keys.` : ''}
    
    Ensure the response is ONLY a valid JSON object. Do not add markdown like \`\`\`json.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const rawData = await response.json();
    
    if (rawData.error) {
      console.error("❌ Gemini API Error:", rawData.error.message);
      return NextResponse.json({ error: rawData.error.message }, { status: 500 });
    }

    let generatedText = rawData.candidates[0].content.parts[0].text;
    generatedText = generatedText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const finalData = JSON.parse(generatedText);

    // 🌟 STEP 4: Save generated data into Supabase Database permanently
    if (placeId) {
      // Pehle purana metadata fetch karo taaki baki fields delete na ho jayein
      const { data: currentPlace } = await supabase
        .from('listings')
        .select('metadata')
        .eq('id', placeId)
        .single();

      const updatedMetadata = {
        ...(currentPlace?.metadata || {}),
        ai_guide: finalData // Save AI guide inside metadata jsonb
      };

      await supabase
        .from('listings')
        .update({ metadata: updatedMetadata })
        .eq('id', placeId);

      console.log(`💾 AI Data successfully SAVED to Database for future visitors!`);
    }

    return NextResponse.json(finalData);

  } catch (error) {
    console.error("❌ Backend Route Server Error:", error);
    return NextResponse.json({ error: "Failed to generate AI guide" }, { status: 500 });
  }
}