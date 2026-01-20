export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email || !email.includes("@")) {
    return new Response("Invalid email", { status: 400 });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Newsletter <onboarding@resend.dev>",
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
