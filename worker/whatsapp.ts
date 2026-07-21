// Sends via Meta's WhatsApp Cloud API. Business-initiated messages (the
// farmer/vendor/report recipient didn't message first) require a
// pre-approved message template — freeform text only works inside a 24h
// window after the recipient messages the business number. Until real
// credentials + an approved template exist, this no-ops the same way
// email does when unconfigured, so nothing breaks — invoices/reports just
// don't get a WhatsApp send attached.
export async function sendWhatsAppTemplate(
  env: Env,
  toPhone: string,
  templateName: string,
  bodyParams: string[]
): Promise<{ sent: boolean; message: string }> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { sent: false, message: "WhatsApp is not configured." };
  }
  const to = toPhone.replace(/[^\d+]/g, "");
  if (!to) return { sent: false, message: "No WhatsApp number on file." };

  const response = await fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: bodyParams.map((text) => ({ type: "text", text }))
          }
        ]
      }
    })
  });
  const message = response.ok ? "Sent" : await response.text();
  return { sent: response.ok, message };
}

// One-time setup helper: registers a message template with Meta for review.
// Not called automatically — run once (e.g. from a scratch script) after
// WhatsApp credentials are configured, then wait for Meta's approval before
// the template can actually be used to send.
export async function createMessageTemplate(env: Env, name: string, bodyText: string, exampleParams: string[]) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    return { ok: false, message: "WhatsApp is not configured." };
  }
  const response = await fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      name,
      language: "en",
      category: "UTILITY",
      components: [
        {
          type: "BODY",
          text: bodyText,
          example: { body_text: [exampleParams] }
        }
      ]
    })
  });
  const message = await response.text();
  return { ok: response.ok, message };
}
