const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM = 'MexicoTrademarkCenter <tm@mexicotrademarkcenter.com>';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'sergio.legorreta@lawtaem.com';

export async function sendViaResend(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [NOTIFY_EMAIL], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}
