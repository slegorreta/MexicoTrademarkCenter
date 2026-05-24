import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";

// Fallback multilingual copy for the payment link email
const COPY: Record<string, Record<string, string>> = {
  subject: {
    en: "Payment Required — Trademark Application",
    es: "Pago Requerido — Solicitud de Marca",
    zh: "付款通知 — 商标申请",
    de: "Zahlung erforderlich — Markenanmeldung",
    fr: "Paiement requis — Dépôt de marque",
    hi: "भुगतान आवश्यक — ट्रेडमार्क आवेदन",
    pt: "Pagamento Necessário — Pedido de Marca",
    ja: "お支払いのお願い — 商標出願",
  },
  greeting: {
    en: "Dear", es: "Estimado/a", zh: "尊敬的", de: "Sehr geehrte/r",
    fr: "Cher/Chère", hi: "प्रिय", pt: "Caro(a)", ja: "様",
  },
  intro: {
    en: "Your trademark application has been prepared and is ready for payment. Once confirmed, our team will begin the filing process immediately.",
    es: "Su solicitud de marca ha sido preparada y está lista para el pago. Una vez confirmado, nuestro equipo iniciará el proceso de presentación de inmediato.",
    zh: "您的商标申请已准备就绪，请完成付款。付款确认后，我们的团队将立即开始申请流程。",
    de: "Ihre Markenanmeldung wurde vorbereitet und ist zahlungsbereit. Nach Zahlungseingang beginnt unser Team sofort mit dem Einreichungsprozess.",
    fr: "Votre dépôt de marque a été préparé et est prêt pour le paiement. Une fois confirmé, notre équipe débutera immédiatement le processus de dépôt.",
    hi: "आपकी ट्रेडमार्क अर्जी तैयार है और भुगतान के लिए तैयार है। पुष्टि होने पर हमारी टीम तुरंत फाइलिंग प्रक्रिया शुरू करेगी।",
    pt: "Seu pedido de marca foi preparado e está pronto para pagamento. Após a confirmação, nossa equipe iniciará o processo de protocolo imediatamente.",
    ja: "商標出願の準備が整い、お支払いの準備ができました。確認後、チームは直ちに出願手続きを開始します。",
  },
  refLabel: {
    en: "Reference Number", es: "Número de Referencia", zh: "参考编号",
    de: "Referenznummer", fr: "Numéro de référence", hi: "संदर्भ संख्या",
    pt: "Número de Referência", ja: "参照番号",
  },
  trademarkLabel: {
    en: "Trademark", es: "Marca", zh: "商标", de: "Marke", fr: "Marque",
    hi: "ट्रेडमार्क", pt: "Marca", ja: "商標",
  },
  amountDue: {
    en: "Amount Due", es: "Importe a Pagar", zh: "应付金额",
    de: "Fälliger Betrag", fr: "Montant dû", hi: "देय राशि",
    pt: "Valor a Pagar", ja: "お支払い金額",
  },
  ctaBtn: {
    en: "Pay Securely Now", es: "Pagar Ahora de Forma Segura", zh: "立即安全付款",
    de: "Jetzt sicher bezahlen", fr: "Payer en toute sécurité", hi: "अभी सुरक्षित भुगतान करें",
    pt: "Pagar com Segurança", ja: "今すぐ安全に支払う",
  },
  note: {
    en: "Payment is processed securely via Stripe. If you have any questions, contact us at tm@mexicotrademarkcenter.com.",
    es: "El pago se procesa de forma segura a través de Stripe. Para consultas, contáctenos en tm@mexicotrademarkcenter.com.",
    zh: "付款通过Stripe安全处理。如有疑问，请联系 tm@mexicotrademarkcenter.com。",
    de: "Die Zahlung wird sicher über Stripe abgewickelt. Bei Fragen wenden Sie sich an tm@mexicotrademarkcenter.com.",
    fr: "Le paiement est traité de manière sécurisée via Stripe. Pour toute question, contactez tm@mexicotrademarkcenter.com.",
    hi: "भुगतान Stripe के माध्यम से सुरक्षित रूप से संसाधित किया जाता है। प्रश्नों के लिए tm@mexicotrademarkcenter.com से संपर्क करें।",
    pt: "O pagamento é processado com segurança via Stripe. Para dúvidas, contate tm@mexicotrademarkcenter.com.",
    ja: "お支払いはStripeで安全に処理されます。ご質問は tm@mexicotrademarkcenter.com までお問い合わせください。",
  },
};

function c(key: string, lang: string): string {
  return COPY[key]?.[lang] ?? COPY[key]?.["en"] ?? "";
}

function buildPaymentLinkEmail(
  clientName: string,
  markName: string,
  caseNumber: string,
  amount: string,
  paymentLinkUrl: string,
  lang: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
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
</style></head>
<body>
<div class="wrapper">
  <div class="header" style="text-align:center">
    <div style="margin-bottom:10px"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;font-weight:bold;margin-bottom:4px">Mexico Trademark Center</div>
    <h1 style="color:#fff;font-size:18px;margin:0;font-weight:bold;font-family:Georgia,serif">${c("subject", lang)}</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;">${c("greeting", lang)} ${clientName},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">${c("intro", lang)}</p>
    <div class="details">
      <div class="row"><span>${c("refLabel", lang)}</span><span style="font-family:monospace;">${caseNumber}</span></div>
      <div class="row"><span>${c("trademarkLabel", lang)}</span><span>${markName}</span></div>
    </div>
    <div class="amount-box">
      <div class="label">${c("amountDue", lang)}</div>
      <div class="value">USD ${amount}</div>
    </div>
    <div class="cta">
      <a href="${paymentLinkUrl}">${c("ctaBtn", lang)}</a>
    </div>
    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">${c("note", lang)}</p>
  </div>
  <div style="background:#1a2e1a;padding:18px 40px;text-align:center">
    <p style="font-size:11px;color:#9db89d;margin:0 0 4px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:1px">MEXICO TRADEMARK CENTER</p>
    <p style="font-size:11px;color:#6a8a6a;margin:0;font-family:Arial,sans-serif">mexicotrademarkcenter.com · tm@mexicotrademarkcenter.com</p>
  </div>
</div>
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
      .select("case_number, total_amount_usd, client_id, language")
      .eq("id", application_id)
      .maybeSingle();
    if (!app) throw new Error("Application not found");

    const { data: client } = await supabase
      .from("clients")
      .select("email, legal_name, contact_person, preferred_language")
      .eq("id", app.client_id)
      .maybeSingle();
    if (!client?.email) throw new Error("Client email not found");

    const { data: trademark } = await supabase
      .from("trademarks")
      .select("mark_name")
      .eq("application_id", application_id)
      .maybeSingle();

    // Resolve language: client preferred_language > application language > en
    const lang = client.preferred_language || app.language || "en";

    const clientName = String(client.legal_name ?? client.contact_person ?? "Valued Client");
    const markName = String(trademark?.mark_name ?? "your trademark");
    const amount = Number(app.total_amount_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const subject = `${c("subject", lang)} — ${String(app.case_number)}`;
    const html = buildPaymentLinkEmail(clientName, markName, String(app.case_number), amount, payment_link_url, lang);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [client.email], subject, html }),
    });
    const resData = await res.json();

    // Log email
    await supabase.from("email_log").insert({
      application_id,
      recipient_email: client.email,
      template_key: "staff_payment_link",
      subject,
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
