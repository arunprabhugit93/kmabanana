// Uses SendGrid's Single Sender Verification (verify one email address you
// own, no domain required) rather than Resend, which requires a verified
// domain to send to anyone but the account owner's own inbox.
export async function sendEmail(env: Env, to: string[], subject: string, text: string) {
  if (!env.SENDGRID_API_KEY || !env.EMAIL_FROM) {
    return { sent: false, message: "Email provider is not configured." };
  }
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: to.map((email) => ({ email })) }],
      from: { email: env.EMAIL_FROM },
      subject,
      content: [{ type: "text/plain", value: text }]
    })
  });
  const message = response.status === 202 ? "Sent" : await response.text();
  return { sent: response.status === 202, message };
}
