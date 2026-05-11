import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller is staff
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { application_id, payment_link_url, payment_link_id } = await req.json();
    if (!application_id || !payment_link_url) {
      return new Response(JSON.stringify({ error: "application_id and payment_link_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch application + client + trademark
    const { data: app } = await supabase
      .from("applications")
      .select("case_number, total_amount_usd, client_id")
      .eq("id", application_id)
      .maybeSingle();
    if (!app) throw new Error("Application not found");

    const { data: client } = await supabase
      .from("clients")
      .select("email, legal_name, contact_person")
      .eq("id", app.client_id)
      .maybeSingle();
    if (!client?.email) throw new Error("Client email not found");

    const { data: trademark } = await supabase
      .from("trademarks")
      .select("mark_name")
      .eq("application_id", application_id)
      .maybeSingle();

    const clientName = String(client.legal_name ?? client.contact_person ?? "Valued Client");
    const markName = String(trademark?.mark_name ?? "your trademark");
    const amount = Number(app.total_amount_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.body { padding: 40px; }
.amount-box { background: #f0f7f0; border: 1px solid #c8e0c8; border-radius: 6px; padding: 24px; margin: 28px 0; text-align: center; }
.amount-box .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a7a5a; }
.amount-box .value { font-size: 32px; font-weight: 700; color: #1a2e1a; margin-top: 6px; }
.details { background: #f8f7f4; border: 1px solid #e8e4de; border-radius: 4px; padding: 16px 20px; margin: 0 0 28px; font-size: 14px; }
.details .row { display: flex; justify-content: space-between; padding: 5px 0; }
.details .row span:first-child { color: #6a6a6a; }
.details .row span:last-child { font-weight: 500; }
.cta { text-align: center; margin: 32px 0; }
.cta a { background: #1a2e1a; color: #fff !important; text-decoration: none; padding: 16px 44px; border-radius: 4px; font-size: 15px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; line-height: 1.6; }
</style></head>
<body>
<div class="wrapper">
  <div class="header" style="text-align:center">
    <div style="margin-bottom:12px"><img src="https://mexicotrademarkcenter.com/logo.png" alt="Mexico Trademark Center" style="height:44px;width:auto;display:block;margin:0 auto;background:#fff;padding:4px 10px;border-radius:8px;" /></div>
    <h1 style="color:#fff;font-size:18px;margin:0;font-weight:bold;font-family:Georgia,serif">Payment Request</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;">Dear ${clientName},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Your trademark application for <strong>${markName}</strong> has been prepared and is ready for payment. Once your payment is confirmed, our team will begin the filing process immediately.</p>

    <div class="details">
      <div class="row"><span>Reference Number</span><span style="font-family:monospace;">${String(app.case_number)}</span></div>
      <div class="row"><span>Trademark</span><span>${markName}</span></div>
    </div>

    <div class="amount-box">
      <div class="label">Amount Due</div>
      <div class="value">USD ${amount}</div>
    </div>

    <div class="cta">
      <a href="${payment_link_url}">Pay Securely Now</a>
    </div>

    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">Payment is processed securely via Stripe. We accept all major credit cards and bank transfers. If you have any questions about this invoice, please contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a>.</p>
    <p style="font-size:12px;color:#999;">After payment, you will receive a confirmation email with instructions to access your client portal where you can track your application.</p>
  </div>
  <div class="footer" style="background:#1a2e1a;padding:18px 40px;text-align:center">
    <p style="font-size:11px;color:#9db89d;margin:0 0 4px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:1px">MEXICO TRADEMARK CENTER</p>
    <p style="font-size:11px;color:#6a8a6a;margin:0;font-family:Arial,sans-serif">mexicotrademarkcenter.com &nbsp;·&nbsp; tm@mexicotrademarkcenter.com</p>
  </div>
</div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [client.email],
        subject: `Payment Required — Trademark Application ${String(app.case_number)}`,
        html,
      }),
    });
    const resData = await res.json();

    // Log email
    await supabase.from("email_log").insert({
      application_id,
      recipient_email: client.email,
      template_key: "staff_payment_link",
      subject: `Payment Required — Trademark Application ${String(app.case_number)}`,
      status: res.ok ? "sent" : "failed",
      resend_message_id: resData?.id,
      error_message: res.ok ? null : JSON.stringify(resData),
    });

    // Update staff_payment_links with email sent timestamp
    if (payment_link_id) {
      await supabase
        .from("staff_payment_links")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("stripe_payment_link_id", payment_link_id);
    }

    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(resData)}`);

    return new Response(JSON.stringify({ success: true, message_id: resData?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-payment-link-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
