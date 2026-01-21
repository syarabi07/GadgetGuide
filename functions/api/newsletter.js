const RATE_LIMIT = 5;        // max requests
const RATE_WINDOW = 60;     // seconds

const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com"
];

export async function onRequestPost({ request, env, cf }) {
  /* ---------------- RATE LIMIT ---------------- */
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  const { success } = await cf.rateLimit({
    key: `newsletter:${ip}`,
    limit: RATE_LIMIT,
    period: RATE_WINDOW
  });

  if (!success) {
    return new Response("Too many requests. Try later.", { status: 429 });
  }

  /* ---------------- FORM DATA ---------------- */
  const formData = await request.formData();
  const email = formData.get("email")?.toLowerCase().trim();

  /* ---------------- STRICT EMAIL VALIDATION ---------------- */
  if (!isValidEmail(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  /* ---------------- SEND EMAIL ---------------- */
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

/* ---------------- HELPERS ---------------- */

function isValidEmail(email) {
  if (!email) return false;
  if (email.length > 254) return false;

  // RFC-like regex (strict)
  const emailRegex =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

  if (!emailRegex.test(email)) return false;

  const domain = email.split("@")[1];

  // Block disposable domains
  if (DISPOSABLE_DOMAINS.includes(domain)) return false;

  return true;
}
