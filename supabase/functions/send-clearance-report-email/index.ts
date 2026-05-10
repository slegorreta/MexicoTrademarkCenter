import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUBJECTS: Record<string, string> = {
  en: (mark: string) => `Your Trademark Clearance Report — ${mark}`,
  es: (mark: string) => `Tu Reporte de Disponibilidad de Marca — ${mark}`,
  zh: (mark: string) => `您的商标检索报告 — ${mark}`,
  de: (mark: string) => `Ihr Markenrecherche-Bericht — ${mark}`,
  fr: (mark: string) => `Votre rapport de disponibilité de marque — ${mark}`,
  hi: (mark: string) => `आपकी ट्रेडमार्क क्लीयरेंस रिपोर्ट — ${mark}`,
  pt: (mark: string) => `Seu Relatório de Disponibilidade de Marca — ${mark}`,
} as unknown as Record<string, (mark: string) => string>;

function getSubject(language: string, markName: string): string {
  const fn = (SUBJECTS as Record<string, (m: string) => string>)[language] ?? (SUBJECTS as Record<string, (m: string) => string>)["en"];
  return fn(markName);
}

const COPY: Record<string, Record<string, string>> = {
  greeting: {
    en: "Thank you for purchasing your Trademark Clearance Report.",
    es: "Gracias por adquirir tu Reporte de Disponibilidad de Marca.",
    zh: "感谢您购买商标检索报告。",
    de: "Vielen Dank für Ihren Kauf des Markenrecherche-Berichts.",
    fr: "Merci d'avoir acheté votre rapport de disponibilité de marque.",
    hi: "अपनी ट्रेडमार्क क्लीयरेंस रिपोर्ट खरीदने के लिए धन्यवाद।",
    pt: "Obrigado por adquirir o seu Relatório de Disponibilidade de Marca.",
  },
  body: {
    en: "Your detailed report for <strong>{mark}</strong> is attached and available for download using the button below. The download link is valid for 7 days.",
    es: "Tu reporte detallado para <strong>{mark}</strong> está disponible para descarga con el botón de abajo. El enlace de descarga es válido por 7 días.",
    zh: "您关于 <strong>{mark}</strong> 的详细报告可通过下方按钮下载，下载链接有效期为7天。",
    de: "Ihr detaillierter Bericht für <strong>{mark}</strong> steht zum Download bereit. Der Link ist 7 Tage gültig.",
    fr: "Votre rapport détaillé pour <strong>{mark}</strong> est disponible en téléchargement ci-dessous. Le lien est valable 7 jours.",
    hi: "<strong>{mark}</strong> की आपकी विस्तृत रिपोर्ट नीचे दिए बटन से डाउनलोड के लिए उपलब्ध है। डाउनलोड लिंक 7 दिनों के लिए वैध है।",
    pt: "Seu relatório detalhado para <strong>{mark}</strong> está disponível para download pelo botão abaixo. O link é válido por 7 dias.",
  },
  downloadBtn: {
    en: "Download PDF Report",
    es: "Descargar Reporte PDF",
    zh: "下载PDF报告",
    de: "PDF-Bericht herunterladen",
    fr: "Télécharger le rapport PDF",
    hi: "PDF रिपोर्ट डाउनलोड करें",
    pt: "Baixar Relatório PDF",
  },
  receiptTitle: {
    en: "Payment Receipt",
    es: "Recibo de Pago",
    zh: "付款收据",
    de: "Zahlungsbeleg",
    fr: "Reçu de paiement",
    hi: "भुगतान रसीद",
    pt: "Recibo de Pagamento",
  },
  orderRef: {
    en: "Order Reference",
    es: "Referencia de Orden",
    zh: "订单编号",
    de: "Bestellreferenz",
    fr: "Référence de commande",
    hi: "ऑर्डर संदर्भ",
    pt: "Referência do Pedido",
  },
  amountCharged: {
    en: "Amount Charged",
    es: "Monto Cobrado",
    zh: "收费金额",
    de: "Berechneter Betrag",
    fr: "Montant facturé",
    hi: "चार्ज की गई राशि",
    pt: "Valor Cobrado",
  },
  datePaid: {
    en: "Date",
    es: "Fecha",
    zh: "日期",
    de: "Datum",
    fr: "Date",
    hi: "तारीख",
    pt: "Data",
  },
  disclaimer: {
    en: "This report is an AI-assisted preliminary trademark screening. It does not constitute legal advice or a formal clearance opinion. Always consult a qualified trademark attorney before filing.",
    es: "Este reporte es una verificación preliminar asistida por IA. No constituye asesoría legal ni una opinión formal de disponibilidad. Consulte a un especialista en marcas antes de presentar su solicitud.",
    zh: "本报告是AI辅助的初步商标筛查，不构成法律建议或正式检索意见。在提交申请前，请咨询有资质的商标代理人。",
    de: "Dieser Bericht ist eine KI-gestützte vorläufige Markenprüfung. Er stellt keine Rechtsberatung dar. Konsultieren Sie immer einen Markenanwalt.",
    fr: "Ce rapport est un dépistage préliminaire assisté par IA. Il ne constitue pas un avis juridique. Consultez toujours un avocat en propriété intellectuelle.",
    hi: "यह रिपोर्ट AI-सहायता प्राप्त प्रारंभिक ट्रेडमार्क जांच है। यह कानूनी सलाह नहीं है। दाखिल करने से पहले हमेशा एक ट्रेडमार्क वकील से परामर्श करें।",
    pt: "Este relatório é uma triagem preliminar assistida por IA. Não constitui aconselhamento jurídico. Consulte sempre um advogado especializado antes de protocolar.",
  },
};

function tr(key: string, lang: string): string {
  return COPY[key]?.[lang] ?? COPY[key]?.["en"] ?? key;
}

function buildEmailHtml(
  markName: string,
  language: string,
  downloadUrl: string,
  orderId: string,
  finalAmountUsd: number,
  paidAt: string,
): string {
  const lang = COPY["greeting"][language] ? language : "en";
  const shortId = orderId.slice(0, 8).toUpperCase();
  const dateStr = new Date(paidAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const bodyText = tr("body", lang).replace("{mark}", markName);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,'Times New Roman',serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

  <!-- Header -->
  <tr>
    <td style="background:#1a2e1a;padding:32px 40px;text-align:center">
      <div style="font-size:11px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:8px">Mexico Trademark Center</div>
      <div style="font-size:22px;color:#ffffff;font-weight:bold">Trademark Clearance Report</div>
      <div style="font-size:14px;color:#9db89d;margin-top:6px">${markName}</div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:36px 40px">
      <p style="font-size:15px;color:#2d2d2d;line-height:1.7;margin:0 0 20px">${tr("greeting", lang)}</p>
      <p style="font-size:15px;color:#2d2d2d;line-height:1.7;margin:0 0 28px">${bodyText}</p>

      <!-- Download button -->
      <div style="text-align:center;margin:0 0 36px">
        <a href="${downloadUrl}" style="display:inline-block;background:#c9a84c;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif">${tr("downloadBtn", lang)}</a>
      </div>

      <!-- Receipt -->
      <div style="background:#f8f8f5;border-radius:8px;padding:20px 24px;border:1px solid #e8e8e0">
        <div style="font-size:11px;letter-spacing:2px;color:#888;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:14px">${tr("receiptTitle", lang)}</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#555;padding:4px 0;font-family:Arial,sans-serif">${tr("orderRef", lang)}</td>
            <td style="font-size:13px;color:#1a2e1a;font-weight:bold;text-align:right;font-family:Arial,sans-serif">${shortId}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#555;padding:4px 0;font-family:Arial,sans-serif">${tr("amountCharged", lang)}</td>
            <td style="font-size:13px;color:#1a2e1a;font-weight:bold;text-align:right;font-family:Arial,sans-serif">USD $${finalAmountUsd.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#555;padding:4px 0;font-family:Arial,sans-serif">${tr("datePaid", lang)}</td>
            <td style="font-size:13px;color:#1a2e1a;text-align:right;font-family:Arial,sans-serif">${dateStr}</td>
          </tr>
        </table>
      </div>
    </td>
  </tr>

  <!-- Disclaimer -->
  <tr>
    <td style="background:#f8f8f5;border-top:1px solid #e8e8e0;padding:20px 40px">
      <p style="font-size:11px;color:#999;line-height:1.6;margin:0;font-family:Arial,sans-serif">${tr("disclaimer", lang)}</p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#1a2e1a;padding:16px 40px;text-align:center">
      <p style="font-size:11px;color:#9db89d;margin:0;font-family:Arial,sans-serif">Mexico Trademark Center · mexicotrademarkcenter.com · tm@mexicotrademarkcenter.com</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!resendKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reportOrderId } = await req.json() as { reportOrderId: string };
    if (!reportOrderId) {
      return new Response(JSON.stringify({ error: "reportOrderId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: order } = await supabase
      .from("clearance_report_orders")
      .select("id, email, mark_name, language, pdf_storage_path, final_amount_usd, paid_at, coupon_code")
      .eq("id", reportOrderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate signed download URL (7 days)
    let downloadUrl = "";
    if (order.pdf_storage_path) {
      const { data: signed } = await supabase.storage
        .from("clearance-reports")
        .createSignedUrl(order.pdf_storage_path, 60 * 60 * 24 * 7);
      downloadUrl = signed?.signedUrl ?? "";
    }

    const lang = order.language ?? "en";
    const subject = getSubject(lang, order.mark_name);
    const html = buildEmailHtml(
      order.mark_name,
      lang,
      downloadUrl,
      order.id,
      order.final_amount_usd ?? 4.99,
      order.paid_at ?? new Date().toISOString(),
    );

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Mexico Trademark Center <tm@mexicotrademarkcenter.com>",
        to: [order.email],
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();
    const emailStatus = emailRes.ok ? "sent" : "failed";

    // Log the email
    await supabase.from("email_log").insert({
      application_id: null,
      recipient_email: order.email,
      template_key: "clearance_report",
      subject,
      status: emailStatus,
      resend_message_id: emailData.id ?? null,
      error_message: emailRes.ok ? null : JSON.stringify(emailData),
    }).select();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-clearance-report-email error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
