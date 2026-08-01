export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Hum bas check kar rahe hain ki Cloudflare JSON bhej pata hai ya nahi
    return new Response(JSON.stringify({ 
      success: true, 
      data: { 
        metaDescription: "Bhai, Cloudflare successfully chal raha hai!", 
        seoScore: 99, 
        suggestions: ["Server is perfectly fine!"] 
      } 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, data: {} }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}