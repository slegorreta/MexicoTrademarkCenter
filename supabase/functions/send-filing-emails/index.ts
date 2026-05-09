import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";
const FILING_TO_EMAIL = "sergio.legorreta@lawtaem.com";
const FILING_CC_EMAIL = "sergiolegorreta@yahoo.com";

async function sendEmail(to: string, subject: string, html: string, attachments?: { filename: string; content: string; type: string }[], cc?: string[]) {
  const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], subject, html };
  if (cc?.length) body.cc = cc;
  if (attachments?.length) body.attachments = attachments;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildClientEmail(app: Record<string, unknown>, client: Record<string, unknown>, trademark: Record<string, unknown>, classes: unknown[], totalPaid: number) {
  const classCount = classes.length;
  const govFeePerClass = 170;
  const govFeeTotal = classCount * govFeePerClass;
  const serviceFee = totalPaid - govFeeTotal;
  const filingDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const classList = (classes as Record<string, unknown>[])
    .map((c) => `<li>Class ${c.class_number} — ${c.class_title_en ?? c.goods_services_en ?? ""}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.header p { color: #a8c5a8; font-size: 13px; margin: 4px 0 0; }
.body { padding: 40px; }
.case-banner { background: #f0f7f0; border: 1px solid #c8e0c8; border-radius: 6px; padding: 20px 24px; margin-bottom: 32px; }
.case-banner .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a7a5a; }
.case-banner .value { font-size: 24px; font-weight: 700; color: #1a2e1a; margin-top: 4px; font-family: monospace; }
.section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8a7a6a; border-bottom: 1px solid #e8e4de; padding-bottom: 8px; margin: 28px 0 14px; }
table.data { width: 100%; border-collapse: collapse; font-size: 14px; }
table.data td { padding: 7px 0; vertical-align: top; }
table.data td:first-child { color: #6a6a6a; width: 48%; }
table.data td:last-child { font-weight: 500; }
.inv-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: 14px; border-bottom: 1px solid #f0ece6; }
.inv-total { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #1a2e1a; }
ul.classes { font-size: 14px; color: #3a4a3a; padding-left: 20px; line-height: 1.8; margin: 0; }
.cta { text-align: center; margin: 36px 0; }
.cta a { background: #1a2e1a; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; line-height: 1.6; }
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Mexico Trademark Center</h1>
    <p>Official Filing Confirmation</p>
  </div>
  <div class="body">
    <p style="font-size:15px;">Dear ${String(client.legal_name ?? client.contact_person ?? "Valued Client")},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Thank you for your trademark filing instruction. Your payment has been confirmed and our team has received your filing details. We will begin processing your application immediately.</p>

    <div class="case-banner">
      <div class="label">Your Reference Number</div>
      <div class="value">${String(app.case_number)}</div>
    </div>

    <div class="section-title">Trademark Details</div>
    <table class="data">
      <tr><td>Mark Name / Identifier</td><td>${String(trademark.mark_name ?? "—")}</td></tr>
      <tr><td>Mark Type</td><td>${String(trademark.mark_type ?? "—")}</td></tr>
      <tr><td>Classes Filed</td><td>${classCount} class${classCount !== 1 ? "es" : ""}</td></tr>
      <tr><td>Filing Date</td><td>${filingDate}</td></tr>
    </table>

    <div class="section-title">International Classes</div>
    <ul class="classes">${classList}</ul>

    <div class="section-title">Payment Summary</div>
    <div class="inv-row"><span>Professional Service Fee</span><span>USD ${formatCurrency(serviceFee)}</span></div>
    <div class="inv-row"><span>Government Filing Fee (${classCount} class${classCount !== 1 ? "es" : ""} × USD ${govFeePerClass})</span><span>USD ${formatCurrency(govFeeTotal)}</span></div>
    <div class="inv-total"><span>Total Paid</span><span>USD ${formatCurrency(totalPaid)}</span></div>

    <div class="section-title">Track Your Application</div>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Monitor every stage of your trademark prosecution through your secure client portal — from filing receipt to registration certificate.</p>

    <div class="cta">
      <a href="https://mexicotrademarkcenter.com/login">Access Your Client Portal</a>
    </div>

    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">Questions? Contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a></p>
  </div>
  <div class="footer">
    Mexico Trademark Center &bull; Professional Trademark Filing Services<br>
    This email confirms your paid filing instruction. Please retain it for your records.
  </div>
</div>
</body></html>`;
}

function buildStaffInstructionEmail(
  app: Record<string, unknown>,
  client: Record<string, unknown>,
  trademark: Record<string, unknown>,
  classes: unknown[],
  logoUrl: string | null
) {
  const classRows = (classes as Record<string, unknown>[])
    .map(
      (c) =>
        `<tr><td style="padding:6px 10px;border:1px solid #ccc;text-align:center;">${c.class_number}</td><td style="padding:6px 10px;border:1px solid #ccc;">${c.goods_services_es ?? c.goods_services_en ?? c.class_title_en ?? ""}</td></tr>`
    )
    .join("");

  const logoSection = logoUrl
    ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Trademark Image</td><td style="padding:6px 10px;border:1px solid #ccc;"><img src="${logoUrl}" style="max-width:200px;max-height:120px;" alt="Trademark logo"></td></tr>`
    : `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Trademark Image</td><td style="padding:6px 10px;border:1px solid #ccc;">See logo file attached / word mark only</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;font-size:13px;color:#111;max-width:700px;margin:0 auto;padding:20px;">
<h2 style="text-align:center;border-bottom:2px solid #111;padding-bottom:10px;">Checklist of MEXICO Trademark Application for Registration</h2>

<p><strong>1. Our Reference:</strong> <span style="font-family:monospace;font-size:15px;background:#f0f0f0;padding:2px 8px;">${String(app.case_number)}</span></p>

<p><strong>2. Applicant Details</strong></p>
<table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;width:38%;">Owner Name</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.legal_name ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Address</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.address ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">City</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.city ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Applicant Country</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.country ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Entity Type</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.applicant_type === "company" ? "Company" : "Individual")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Zip / Postal Code</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.postal_code ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Email</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.email ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Phone</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.phone ?? "—")}</td></tr>
  ${client.state_province ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">State/Province</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(client.state_province)}</td></tr>` : ""}
</table>

<p><strong>3. Trademark Information</strong></p>
<table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;width:38%;">Trademark Name</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(trademark.mark_name ?? "—")}</td></tr>
  ${logoSection}
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Trademark Format</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(trademark.mark_type ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Trademark Pattern Color</td><td style="padding:6px 10px;border:1px solid #ccc;">${trademark.claims_color ? String(trademark.color_description ?? "As shown") : "Black and White"}</td></tr>
  ${trademark.mark_name ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Statement / Slogan</td><td style="padding:6px 10px;border:1px solid #ccc;">${trademark.mark_type === "slogan" ? String(trademark.mark_name) : "N/A"}</td></tr>` : ""}
  ${trademark.meaning_spanish ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Meaning in Spanish</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(trademark.meaning_spanish)}</td></tr>` : ""}
  ${trademark.transliteration ? `<tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Transliteration</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(trademark.transliteration)}</td></tr>` : ""}
</table>

<p><strong>4. (International Classification) and Goods/Services</strong></p>
<table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
  <tr style="background:#f5f5f5;"><th style="padding:6px 10px;border:1px solid #ccc;text-align:center;width:15%;">Class No.</th><th style="padding:6px 10px;border:1px solid #ccc;text-align:left;">Classification in Spanish / Goods & Services</th></tr>
  ${classRows}
</table>

${app.priority_claimed ? `
<p><strong>5. Priority Claim</strong></p>
<table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;width:38%;">Priority Country</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(app.priority_country ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Priority App. Number</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(app.priority_app_number ?? "—")}</td></tr>
  <tr><td style="padding:6px 10px;border:1px solid #ccc;font-weight:600;background:#f5f5f5;">Priority Filing Date</td><td style="padding:6px 10px;border:1px solid #ccc;">${String(app.priority_filing_date ?? "—")}</td></tr>
</table>` : ""}

<hr style="margin:30px 0;">
<p style="font-size:11px;color:#888;">Generated by Mexico Trademark Center Portal &bull; ${new Date().toISOString()}</p>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full application data
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", app.client_id)
      .maybeSingle();

    const { data: trademark } = await supabase
      .from("trademarks")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    const { data: classes } = await supabase
      .from("trademark_classes")
      .select("*")
      .eq("application_id", application_id)
      .order("class_number");

    const { data: payment } = await supabase
      .from("payments")
      .select("amount_usd")
      .eq("application_id", application_id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const totalPaid = payment?.amount_usd ?? app.total_amount_usd ?? 0;
    const classCount = classes?.length ?? 0;

    // Get logo URL if exists
    let logoUrl: string | null = null;
    if (trademark?.logo_file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("trademark-assets")
        .createSignedUrl(trademark.logo_file_path, 60 * 60 * 24 * 7);
      logoUrl = signedUrl?.signedUrl ?? trademark.logo_preview_url ?? null;
    }

    const results: Record<string, unknown> = {};

    // 1. Send client confirmation email
    if (client?.email) {
      const clientHtml = buildClientEmail(app, client, trademark ?? {}, classes ?? [], Number(totalPaid));
      const clientResult = await sendEmail(
        client.email,
        `Your Trademark Application Has Been Received — ${app.case_number}`,
        clientHtml
      );
      results.client_email = clientResult;

      await supabase.from("email_log").insert({
        application_id,
        recipient_email: client.email,
        template_key: "client_confirmation",
        subject: `Your Trademark Application Has Been Received — ${app.case_number}`,
        status: clientResult.ok ? "sent" : "failed",
        resend_message_id: clientResult.data?.id,
        error_message: clientResult.ok ? null : JSON.stringify(clientResult.data),
      });
    }

    // 2. Send staff instruction email
    const staffHtml = buildStaffInstructionEmail(app, client ?? {}, trademark ?? {}, classes ?? [], logoUrl);
    const staffResult = await sendEmail(
      FILING_TO_EMAIL,
      `NEW FILING INSTRUCTION — ${app.case_number} — ${trademark?.mark_name ?? "Trademark"}`,
      staffHtml,
      undefined,
      [FILING_CC_EMAIL]
    );
    results.staff_email = staffResult;

    await supabase.from("email_log").insert({
      application_id,
      recipient_email: FILING_TO_EMAIL,
      template_key: "staff_instruction",
      subject: `NEW FILING INSTRUCTION — ${app.case_number}`,
      status: staffResult.ok ? "sent" : "failed",
      resend_message_id: staffResult.data?.id,
      error_message: staffResult.ok ? null : JSON.stringify(staffResult.data),
    });

    // 3. Create timeline event
    await supabase.from("timeline_events").insert({
      application_id,
      event_type: "payment_confirmed",
      title: "Payment confirmed — filing instructions sent",
      description: `Payment of USD ${Number(totalPaid).toFixed(2)} confirmed. Filing instruction checklist sent to the team. Your application is now in queue for processing.`,
      is_visible_to_client: true,
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-filing-emails error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
