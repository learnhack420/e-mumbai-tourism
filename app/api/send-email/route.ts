export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'info@rajcabs.in',
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
      throw new Error(data.message || 'Failed to send email');
    }

    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}