export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return Response.json({ success: false, error: "Missing RESEND_API_KEY in environment variables!" }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'rajtours14@gmail.com', // Aapka email jo Resend par registered hai
        subject: `New Inquiry from ${name}`,
        html: `
          <h3>New Message Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ success: false, error: data.message || 'Resend API rejected the request' }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}