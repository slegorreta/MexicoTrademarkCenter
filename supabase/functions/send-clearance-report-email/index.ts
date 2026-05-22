import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APP_URL = "https://mexicotrademarkcenter.com";
const ADMIN_URL = "https://mexicotrademarkcenter.com/admin/search-reports";
const STAFF_EMAILS = ["info@mexicotrademarkcenter.com", "tm@mexicotrademarkcenter.com"];
const STAFF_CC_EMAILS = ["sergiolegorreta@yahoo.com", "Sergio.Legorreta@lawteam.com"];

const SHIELD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

const SUBJECTS: Record<string, (mark: string) => string> = {
  en: (mark) => `Your Trademark Clearance Report — ${mark}`,
  es: (mark) => `Tu Reporte de Disponibilidad de Marca — ${mark}`,
  zh: (mark) => `您的商标检索报告 — ${mark}`,
  de: (mark) => `Ihr Markenrecherche-Bericht — ${mark}`,
  fr: (mark) => `Votre rapport de disponibilité de marque — ${mark}`,
  hi: (mark) => `आपकी ट्रेडमार्क क्लीयरेंस रिपोर्ट — ${mark}`,
  pt: (mark) => `Seu Relatório de Disponibilidade de Marca — ${mark}`,
};

function getSubject(language: string, markName: string): string {
  return (SUBJECTS[language] ?? SUBJECTS["en"])(markName);
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
    en: "Your detailed report for <strong>{mark}</strong> is ready and available for download using the button below. The download link is valid for 7 days.",
    es: "Tu reporte detallado para <strong>{mark}</strong> está listo para descarga con el botón de abajo. El enlace es válido por 7 días.",
    zh: "您关于 <strong>{mark}</strong> 的详细报告已准备好，可通过下方按钮下载，链接有效期7天。",
    de: "Ihr detaillierter Bericht für <strong>{mark}</strong> steht zum Download bereit. Der Link ist 7 Tage gültig.",
    fr: "Votre rapport détaillé pour <strong>{mark}</strong> est prêt et disponible en téléchargement ci-dessous. Le lien est valable 7 jours.",
    hi: "<strong>{mark}</strong> की आपकी विस्तृत रिपोर्ट तैयार है। नीचे दिए बटन से डाउनलोड करें। लिंक 7 दिनों के लिए वैध है।",
    pt: "Seu relatório detalhado para <strong>{mark}</strong> está pronto para download pelo botão abaixo. O link é válido por 7 dias.",
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
  ctaNewTitle: {
    en: "Save Your Report to Your Account",
    es: "Guarda tu Reporte en tu Cuenta",
    zh: "将报告保存至您的账户",
    de: "Bericht in Ihrem Konto speichern",
    fr: "Enregistrez votre rapport dans votre compte",
    hi: "अपनी रिपोर्ट अपने खाते में सहेजें",
    pt: "Salve seu Relatório na sua Conta",
  },
  ctaNewBody: {
    en: "Create a free account to access your report anytime from your dashboard — no expiring links.",
    es: "Crea una cuenta gratuita para acceder a tu reporte cuando quieras desde tu panel.",
    zh: "创建免费账户，随时从您的控制面板访问报告，无需担心链接过期。",
    de: "Erstellen Sie ein kostenloses Konto, um jederzeit über Ihr Dashboard auf Ihren Bericht zuzugreifen.",
    fr: "Créez un compte gratuit pour accéder à votre rapport à tout moment depuis votre tableau de bord.",
    hi: "एक मुफ्त खाता बनाएं और अपने डैशबोर्ड से कभी भी रिपोर्ट एक्सेस करें।",
    pt: "Crie uma conta gratuita para acessar seu relatório a qualquer momento pelo painel.",
  },
  ctaNewBtn: {
    en: "Create Free Account",
    es: "Crear Cuenta Gratuita",
    zh: "创建免费账户",
    de: "Kostenloses Konto erstellen",
    fr: "Créer un compte gratuit",
    hi: "मुफ्त खाता बनाएं",
    pt: "Criar Conta Gratuita",
  },
  ctaExistingTitle: {
    en: "Your Report Is Saved to Your Account",
    es: "Tu Reporte está Guardado en tu Cuenta",
    zh: "报告已保存至您的账户",
    de: "Ihr Bericht wurde in Ihrem Konto gespeichert",
    fr: "Votre rapport a été enregistré dans votre compte",
    hi: "आपकी रिपोर्ट आपके खाते में सहेजी गई है",
    pt: "Seu Relatório foi Salvo na sua Conta",
  },
  ctaExistingBody: {
    en: "You can access this and all your past reports anytime in the Search Reports section of your dashboard.",
    es: "Puedes acceder a este y todos tus reportes anteriores en cualquier momento en tu panel.",
    zh: "您可以随时在控制面板的搜索报告部分访问此报告及所有历史报告。",
    de: "Sie können diesen und alle Ihre früheren Berichte jederzeit im Bereich Suchberichte Ihres Dashboards aufrufen.",
    fr: "Vous pouvez accéder à ce rapport et à tous vos rapports passés à tout moment dans votre tableau de bord.",
    hi: "आप अपने डैशबोर्ड के सर्च रिपोर्ट्स सेक्शन में कभी भी इस और सभी पिछली रिपोर्ट्स को एक्सेस कर सकते हैं।",
    pt: "Você pode acessar este e todos os seus relatórios anteriores a qualquer momento no painel.",
  },
  ctaExistingBtn: {
    en: "View My Dashboard",
    es: "Ver Mi Panel",
    zh: "查看我的控制面板",
    de: "Mein Dashboard anzeigen",
    fr: "Voir mon tableau de bord",
    hi: "मेरा डैशबोर्ड देखें",
    pt: "Ver Meu Painel",
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
  hasAccount: boolean,
  userEmail: string,
): string {
  const lang = COPY["greeting"][language] ? language : "en";
  const shortId = orderId.slice(0, 8).toUpperCase();
  const dateStr = new Date(paidAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const bodyText = tr("body", lang).replace("{mark}", markName);

  const signupUrl = hasAccount
    ? `${APP_URL}/dashboard`
    : `${APP_URL}/login?email=${encodeURIComponent(userEmail)}`;

  const ctaSection = `
  <!-- Account CTA -->
  <tr>
    <td style="padding:0 40px 32px">
      <div style="background:${hasAccount ? "#f0f7f0" : "#faf8f0"};border:1px solid ${hasAccount ? "#c3dfc3" : "#e8d98a"};border-radius:10px;padding:24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:16px;font-weight:bold;color:#1a2e1a;font-family:Arial,sans-serif">${tr(hasAccount ? "ctaExistingTitle" : "ctaNewTitle", lang)}</span>
        </div>
        <p style="font-size:13px;color:#4a5568;line-height:1.6;margin:0 0 16px;font-family:Arial,sans-serif">${tr(hasAccount ? "ctaExistingBody" : "ctaNewBody", lang)}</p>
        <a href="${signupUrl}" style="display:inline-block;background:#1a2e1a;color:#ffffff;font-size:13px;font-weight:bold;padding:10px 24px;border-radius:7px;text-decoration:none;font-family:Arial,sans-serif">${tr(hasAccount ? "ctaExistingBtn" : "ctaNewBtn", lang)}</a>
      </div>
    </td>
  </tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,'Times New Roman',serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px">

  <!-- Header -->
  <tr>
    <td style="background:#1a2e1a;padding:28px 40px;text-align:center">
      <div style="margin-bottom:12px">${SHIELD_SVG}</div>
      <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:6px;font-weight:bold">Mexico Trademark Center</div>
      <div style="font-size:20px;color:#ffffff;font-weight:bold;font-family:Georgia,serif">Trademark Clearance Report</div>
      <div style="font-size:13px;color:#9db89d;margin-top:6px;font-family:Arial,sans-serif">${markName}</div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:36px 40px 24px">
      <p style="font-size:15px;color:#2d2d2d;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif">${tr("greeting", lang)}</p>
      <p style="font-size:15px;color:#2d2d2d;line-height:1.7;margin:0 0 28px;font-family:Arial,sans-serif">${bodyText}</p>

      <!-- Download button -->
      <div style="text-align:center;margin:0 0 32px">
        <a href="${downloadUrl}" style="display:inline-block;background:#c9a84c;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.3px">${tr("downloadBtn", lang)}</a>
      </div>

      <!-- Receipt -->
      <div style="background:#f8f8f5;border-radius:8px;padding:20px 24px;border:1px solid #e8e8e0">
        <div style="font-size:10px;letter-spacing:2px;color:#888;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:14px;font-weight:bold">${tr("receiptTitle", lang)}</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#555;padding:5px 0;font-family:Arial,sans-serif">${tr("orderRef", lang)}</td>
            <td style="font-size:13px;color:#1a2e1a;font-weight:bold;text-align:right;font-family:Arial,sans-serif">${shortId}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#555;padding:5px 0;font-family:Arial,sans-serif">${tr("amountCharged", lang)}</td>
            <td style="font-size:13px;color:#1a2e1a;font-weight:bold;text-align:right;font-family:Arial,sans-serif">USD $${Number(finalAmountUsd).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#555;padding:5px 0;font-family:Arial,sans-serif">${tr("datePaid", lang)}</td>
            <td style="font-size:13px;color:#1a2e1a;text-align:right;font-family:Arial,sans-serif">${dateStr}</td>
          </tr>
        </table>
      </div>
    </td>
  </tr>

  ${ctaSection}

  <!-- Disclaimer -->
  <tr>
    <td style="background:#f8f8f5;border-top:1px solid #e8e8e0;padding:20px 40px">
      <p style="font-size:11px;color:#999;line-height:1.6;margin:0;font-family:Arial,sans-serif">${tr("disclaimer", lang)}</p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#1a2e1a;padding:18px 40px;text-align:center">
      <p style="font-size:11px;color:#9db89d;margin:0 0 4px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:1px">MEXICO TRADEMARK CENTER</p>
      <p style="font-size:11px;color:#6a8a6a;margin:0;font-family:Arial,sans-serif">mexicotrademarkcenter.com &nbsp;·&nbsp; tm@mexicotrademarkcenter.com</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildStaffNotificationHtml(
  orderId: string,
  markName: string,
  goodsServices: string,
  language: string,
  risk: string,
  finalAmountUsd: number,
  customerEmail: string,
  couponCode: string | null,
  discountPercent: number,
  paidAt: string,
  downloadUrl: string,
): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const dateStr = new Date(paidAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const riskColor = risk === "high" ? "#b91c1c" : risk === "medium" ? "#b45309" : "#166534";
  const riskBg = risk === "high" ? "#fee2e2" : risk === "medium" ? "#fef3c7" : "#dcfce7";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:32px 20px">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:580px">

  <!-- Staff header -->
  <tr>
    <td style="background:#1a2e1a;padding:20px 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase;font-weight:bold;margin-bottom:4px">Mexico Trademark Center — Internal</div>
            <div style="font-size:17px;color:#ffffff;font-weight:bold">TM Report Purchased</div>
          </td>
          <td align="right">
            <div style="background:#c9a84c;color:#1a2e1a;font-size:11px;font-weight:bold;padding:6px 14px;border-radius:5px;white-space:nowrap">Order ${shortId}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Main details -->
  <tr>
    <td style="padding:28px 32px">

      <!-- Mark name highlight -->
      <div style="background:#f8f7f2;border-left:4px solid #c9a84c;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px">
        <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Mark Searched</div>
        <div style="font-size:22px;font-weight:bold;color:#1a2e1a">${markName}</div>
        ${goodsServices ? `<div style="font-size:12px;color:#666;margin-top:6px">${goodsServices.slice(0, 200)}${goodsServices.length > 200 ? "..." : ""}</div>` : ""}
      </div>

      <!-- Risk badge -->
      <div style="margin-bottom:24px">
        <span style="display:inline-block;background:${riskBg};color:${riskColor};font-size:12px;font-weight:bold;padding:6px 16px;border-radius:20px;text-transform:uppercase;letter-spacing:1px">
          Overall Risk: ${risk.toUpperCase()}
        </span>
      </div>

      <!-- Details table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e0;border-radius:8px;overflow:hidden">
        <tr style="background:#f8f8f5">
          <td style="font-size:11px;color:#888;padding:10px 16px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;width:40%">Field</td>
          <td style="font-size:11px;color:#888;padding:10px 16px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">Value</td>
        </tr>
        <tr style="border-top:1px solid #f0f0ec">
          <td style="font-size:13px;color:#555;padding:10px 16px">Customer Email</td>
          <td style="font-size:13px;color:#1a2e1a;padding:10px 16px;font-weight:bold">${customerEmail}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0ec;background:#fafaf8">
          <td style="font-size:13px;color:#555;padding:10px 16px">Report Language</td>
          <td style="font-size:13px;color:#1a2e1a;padding:10px 16px">${language.toUpperCase()}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0ec">
          <td style="font-size:13px;color:#555;padding:10px 16px">Amount Paid</td>
          <td style="font-size:13px;color:#1a2e1a;padding:10px 16px;font-weight:bold">USD $${Number(finalAmountUsd).toFixed(2)}${discountPercent > 0 ? ` (${discountPercent}% discount applied)` : ""}</td>
        </tr>
        ${couponCode ? `<tr style="border-top:1px solid #f0f0ec;background:#fafaf8">
          <td style="font-size:13px;color:#555;padding:10px 16px">Coupon Used</td>
          <td style="font-size:13px;color:#1a2e1a;padding:10px 16px;font-family:monospace">${couponCode}</td>
        </tr>` : ""}
        <tr style="border-top:1px solid #f0f0ec${couponCode ? "" : ";background:#fafaf8"}">
          <td style="font-size:13px;color:#555;padding:10px 16px">Paid At</td>
          <td style="font-size:13px;color:#1a2e1a;padding:10px 16px">${dateStr}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0ec">
          <td style="font-size:13px;color:#555;padding:10px 16px">Order Reference</td>
          <td style="font-size:13px;color:#1a2e1a;padding:10px 16px;font-family:monospace">${shortId}</td>
        </tr>
      </table>

      <!-- Action buttons -->
      <div style="margin-top:24px;display:flex;gap:12px">
        <a href="${ADMIN_URL}" style="display:inline-block;background:#1a2e1a;color:#ffffff;font-size:13px;font-weight:bold;padding:10px 22px;border-radius:7px;text-decoration:none;margin-right:10px">View in Admin Dashboard</a>
        ${downloadUrl ? `<a href="${downloadUrl}" style="display:inline-block;background:#f8f7f2;color:#1a2e1a;border:1px solid #c9a84c;font-size:13px;font-weight:bold;padding:10px 22px;border-radius:7px;text-decoration:none">Download Report PDF</a>` : ""}
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f0f4f0;border-top:1px solid #e0e8e0;padding:14px 32px;text-align:center">
      <p style="font-size:11px;color:#888;margin:0;font-family:Arial,sans-serif">This is an automated internal notification — Mexico Trademark Center</p>
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
      .select("id, email, mark_name, goods_services, language, pdf_storage_path, final_amount_usd, amount_usd, discount_percent, coupon_code, paid_at, user_id, clearance_result")
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

    const hasAccount = !!order.user_id;
    const lang = order.language ?? "en";
    const subject = getSubject(lang, order.mark_name);
    const html = buildEmailHtml(
      order.mark_name,
      lang,
      downloadUrl,
      order.id,
      order.final_amount_usd ?? 4.99,
      order.paid_at ?? new Date().toISOString(),
      hasAccount,
      order.email,
    );

    const risk = order.clearance_result?.risk ?? "low";
    const staffHtml = buildStaffNotificationHtml(
      order.id,
      order.mark_name,
      order.goods_services ?? "",
      lang,
      risk,
      order.final_amount_usd ?? 4.99,
      order.email,
      order.coupon_code ?? null,
      order.discount_percent ?? 0,
      order.paid_at ?? new Date().toISOString(),
      downloadUrl,
    );

    const staffSubject = `🚨 [TM Report Purchased] ${order.mark_name} — Order ${order.id.slice(0, 8).toUpperCase()}`;

    // Send both emails independently so neither failure affects the other
    const [clientResult, staffResult] = await Promise.allSettled([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Mexico Trademark Center <tm@mexicotrademarkcenter.com>",
          to: [order.email],
          subject,
          html,
        }),
      }).then(r => r.json().then(d => ({ ok: r.ok, data: d }))),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Mexico Trademark Center <tm@mexicotrademarkcenter.com>",
          to: STAFF_EMAILS,
          cc: STAFF_CC_EMAILS,
          subject: staffSubject,
          html: staffHtml,
        }),
      }).then(r => r.json().then(d => ({ ok: r.ok, data: d }))),
    ]);

    const clientOk = clientResult.status === "fulfilled" && clientResult.value.ok;
    const clientData = clientResult.status === "fulfilled" ? clientResult.value.data : {};

    if (clientOk) {
      await supabase
        .from("clearance_report_orders")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", reportOrderId);
    }

    // Log client email
    await supabase.from("email_log").insert({
      application_id: null,
      recipient_email: order.email,
      template_key: "clearance_report",
      subject,
      status: clientOk ? "sent" : "failed",
      resend_message_id: clientData.id ?? null,
      error_message: clientOk ? null : JSON.stringify(clientData),
    });

    // Log staff notification
    const staffOk = staffResult.status === "fulfilled" && staffResult.value.ok;
    const staffData = staffResult.status === "fulfilled" ? staffResult.value.data : {};
    await supabase.from("email_log").insert({
      application_id: null,
      recipient_email: STAFF_EMAILS.join(", "),
      template_key: "clearance_report_staff_notification",
      subject: staffSubject,
      status: staffOk ? "sent" : "failed",
      resend_message_id: staffData.id ?? null,
      error_message: staffOk ? null : JSON.stringify(staffData),
    });

    if (!clientOk) {
      console.error("Client email failed:", clientData);
      return new Response(JSON.stringify({ error: "Failed to send client email" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-clearance-report-email error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
