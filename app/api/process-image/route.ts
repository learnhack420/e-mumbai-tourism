export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // 1. Initialize Supabase INSIDE the handler
    const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Name matched with dashboard
);

    const { imageUrl } = await req.json();

    // 2. Fetch image from the external URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    // 3. Generate a Unique Filename
    let extension = contentType.split('/')[1] || 'jpg';
    if (extension === 'jpeg') extension = 'jpg';
    
    const fileName = `tour-images/${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('public-images')
      .upload(fileName, arrayBuffer, { 
        contentType: contentType,
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase Upload Error: ${error.message}`);
    }

    // 5. Get the Public URL
    const { data: publicUrlData } = supabase.storage
      .from('public-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
    
  } catch (error: any) {
    console.error("Image Upload API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}