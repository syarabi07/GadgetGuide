export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = formData.get("email");
  const token = formData.get("cf-turnstile-response");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email", { status: 400 });
  }

  if (!token) {
    return new Response("Missing Turnstile token", { status: 403 });
  }

  // 🔐 Verify Turnstile
  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token
      })
    }
  );

  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return new Response("Bot detected", { status: 403 });
  }

  // 📧 Send email via Resend
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: ["syarabi07@gmail.com"],
      subject: "New Newsletter Subscription",
      html: `
        <h2>New Subscriber</h2>
        <p>Email: <b>${email}</b></p>
      `
    })
  });

  if (!resendResponse.ok) {
    return new Response("Email failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
