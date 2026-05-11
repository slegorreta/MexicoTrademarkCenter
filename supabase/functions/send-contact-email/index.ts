import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";
const TO_EMAIL = "info@mexicotrademarkcenter.com";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese (中文)",
  es: "Spanish (Español)",
  de: "German (Deutsch)",
  fr: "French (Français)",
  hi: "Hindi (हिन्दी)",
  pt: "Portuguese (Português)",
  ja: "Japanese (日本語)",
};

async function translateToSpanish(text: string, sourceLang: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the following text to Spanish. Return only the translated text, no explanations or extra formatting.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error("OpenAI translation failed");
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? text;
}

function buildEmailHtml(
  name: string,
  phone: string,
  email: string | null,
  subject: string,
  message: string,
  language: string,
  translatedMessage: string | null
): string {
  const langLabel = LANGUAGE_NAMES[language] ?? language;
  const translationBlock =
    translatedMessage
      ? `
        <tr>
          <td style="padding: 0 40px 28px;">
            <div style="background:#f0f7f0;border-left:4px solid #2e6b2e;padding:16px 18px;border-radius:4px;">
              <div style="font-size:11px;font-weight:700;color:#2e6b2e;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Traducción automática al Español</div>
              <div style="font-size:14px;color:#1a1a1a;line-height:1.65;white-space:pre-wrap;">${translatedMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            </div>
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f1;font-family:Georgia,serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e0ddd8;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="background:#0d1f3c;padding:28px 40px;">
          <div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Mexico Trademark Center</div>
          <div style="color:#fff;font-size:20px;font-weight:400;letter-spacing:0.04em;">New Contact Form Message</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 40px 20px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:7px 0;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.07em;width:130px;">Name</td>
              <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${name.replace(/</g, "&lt;")}</td>
            </tr>
            <tr style="border-top:1px solid #f0ede8;">
              <td style="padding:7px 0;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.07em;">Phone</td>
              <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${phone.replace(/</g, "&lt;")}</td>
            </tr>
            ${email ? `<tr style="border-top:1px solid #f0ede8;">
              <td style="padding:7px 0;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.07em;">Email</td>
              <td style="padding:7px 0;font-size:14px;color:#1a1a1a;"><a href="mailto:${email}" style="color:#0d1f3c;">${email.replace(/</g, "&lt;")}</a></td>
            </tr>` : ""}
            <tr style="border-top:1px solid #f0ede8;">
              <td style="padding:7px 0;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.07em;">Language</td>
              <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${langLabel}</td>
            </tr>
            <tr style="border-top:1px solid #f0ede8;">
              <td style="padding:7px 0;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.07em;">Subject</td>
              <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${subject.replace(/</g, "&lt;")}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 40px 28px;">
          <div style="font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;">Message (original — ${langLabel})</div>
          <div style="background:#f9f8f6;border:1px solid #e8e5e0;border-radius:4px;padding:16px 18px;font-size:14px;line-height:1.65;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </td>
      </tr>
      ${translationBlock}
      <tr>
        <td style="background:#f5f4f1;padding:16px 40px;border-top:1px solid #e0ddd8;">
          <div style="font-size:11px;color:#888;">Mexico Trademark Center · info@mexicotrademarkcenter.com</div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { name, phone, email, subject, message, language } = await req.json();

    if (!name || !phone || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = (language ?? "en") as string;
    let translatedMessage: string | null = null;

    if (lang !== "es") {
      try {
        translatedMessage = await translateToSpanish(message, lang);
      } catch {
        // proceed without translation if OpenAI fails
      }
    }

    const html = buildEmailHtml(name, phone, email, subject, message, lang, translatedMessage);
    const emailSubject = `[Contact] ${subject} — ${name}`;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: emailSubject,
        html,
      }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
