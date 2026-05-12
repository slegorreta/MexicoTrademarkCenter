import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";
const FILING_TO_EMAIL = "tm@mexicotrademarkcenter.com";
const FILING_CC_EMAIL = "sergiolegorreta@yahoo.com";

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  cc?: string[]
) {
  const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], subject, html };
  if (cc?.length) body.cc = cc;

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

function labelRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 12px;border:1px solid #d0d0d0;text-align:right;font-weight:600;background:#f7f7f7;width:38%;font-size:13px;color:#222;">${label}</td>
    <td style="padding:6px 12px;border:1px solid #d0d0d0;font-size:13px;color:#111;">${value}</td>
  </tr>`;
}

export function buildInstructionFormHtml(
  app: Record<string, unknown>,
  client: Record<string, unknown>,
  trademark: Record<string, unknown>,
  classes: Record<string, unknown>[],
  goodsServices: Record<string, unknown> | null,
  logoUrl: string | null
): string {
  const classRows = classes
    .map(
      (c) => `
    <tr>
      <td colspan="2" style="padding:7px 12px;border:1px solid #d0d0d0;text-align:center;font-weight:700;font-size:13px;background:#f0f0f0;letter-spacing:0.03em;">
        CLASS ${c.class_number} — for trademark application
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding:7px 12px;border:1px solid #d0d0d0;font-size:13px;color:#111;">
        ${String(c.goods_services_es ?? c.goods_services_en ?? c.class_title_en ?? "—")}
      </td>
    </tr>`
    )
    .join("");

  const logoRow = logoUrl
    ? labelRow(
        "Trademark",
        `<img src="${logoUrl}" style="max-width:220px;max-height:130px;object-fit:contain;" alt="Trademark mark">`
      )
    : labelRow("Trademark", "WORD MARK — no logo image");

  const colorValue = trademark.claims_color
    ? String(trademark.color_description ?? "As shown in color")
    : "Black and white";

  const sloganValue =
    trademark.mark_type === "slogan"
      ? String(trademark.mark_name ?? "—")
      : "N/A";

  const stateRow = client.state_province
    ? labelRow("State / Province", String(client.state_province))
    : "";

  const meaningRow = trademark.meaning_spanish
    ? labelRow("Meaning in Spanish", String(trademark.meaning_spanish))
    : "";

  const transliterationRow = trademark.transliteration
    ? labelRow("Transliteration", String(trademark.transliteration))
    : "";

  const prioritySection = app.priority_claimed
    ? `
  <p style="font-size:14px;font-weight:700;margin:28px 0 8px;">6.&nbsp;&nbsp;Priority Claim</p>
  <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
    ${labelRow("Priority Country", String(app.priority_country ?? "—"))}
    ${labelRow("Priority App. Number", String(app.priority_app_number ?? "—"))}
    ${labelRow("Priority Filing Date", String(app.priority_filing_date ?? "—"))}
  </table>`
    : "";

  const originalDescription = goodsServices?.description_original
    ? String(goodsServices.description_original)
    : "—";

  const markTypeLabel = String(trademark.mark_type ?? "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l: string) => l.toUpperCase());

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; max-width: 760px; margin: 0 auto; padding: 28px 32px; background: #fff; }
  h1 { text-align: center; font-size: 16px; font-weight: 700; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 24px; letter-spacing: 0.02em; }
  .section-label { font-size: 14px; font-weight: 700; margin: 24px 0 8px; }
  table.form-table { border-collapse: collapse; width: 100%; margin-bottom: 4px; }
  .ref-box { display: inline-block; font-family: monospace; font-size: 16px; font-weight: 700; background: #f0f0f0; border: 1px solid #ccc; padding: 4px 14px; border-radius: 3px; letter-spacing: 0.05em; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 11px; color: #888; text-align: center; }
  .header-banner { background: #1a2e1a; padding: 14px 24px; text-align: center; margin-bottom: 24px; }
  .header-banner span { font-size: 11px; letter-spacing: 3px; color: #c9a84c; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: 700; }
</style>
</head>
<body>
<div class="header-banner">
  <span>Mexico Trademark Center</span>
</div>

<h1>MEXICO Trademark Application for Registration</h1>

<p class="section-label">1.&nbsp;&nbsp;Our Reference:&nbsp;&nbsp;<span class="ref-box">${String(app.case_number)}</span></p>

<p class="section-label">2.&nbsp;&nbsp;Applicant Details</p>
<table class="form-table">
  ${labelRow("Owner Name", String(client.legal_name ?? "—"))}
  ${labelRow("Address", String(client.address ?? "—"))}
  ${stateRow}
  ${labelRow("City", String(client.city ?? "—"))}
  ${labelRow("Applicant Country", String(client.country ?? "—"))}
  ${labelRow("Entity Type", client.applicant_type === "company" ? "Company" : "Individual")}
  ${labelRow("Zip / Postal Code", String(client.postal_code ?? "—"))}
</table>

<p class="section-label">3.&nbsp;&nbsp;Trademark Information</p>
<table class="form-table">
  ${logoRow}
  ${labelRow("Trademark Pattern Color", colorValue)}
  ${labelRow("Trademark Format", markTypeLabel)}
  ${labelRow("Statement / Slogan", sloganValue)}
  ${meaningRow}
  ${transliterationRow}
</table>

<p class="section-label">4.&nbsp;&nbsp;(International Classification) and Goods / Services</p>
<table class="form-table">
  ${classRows}
</table>

<p class="section-label">5.&nbsp;&nbsp;Original Classification</p>
<p style="font-size:13px;color:#111;line-height:1.6;margin:0 0 8px;padding:10px 12px;border:1px solid #d0d0d0;background:#fafafa;">${originalDescription}</p>

${prioritySection}

<div class="footer">
  Generated by Mexico Trademark Center Portal &bull; ${new Date().toISOString()} &bull; ${String(app.case_number)}
</div>
</body>
</html>`;
}

const CLIENT_EMAIL_COPY: Record<string, Record<string, string>> = {
  subject: {
    en: "Your Trademark Application Has Been Received",
    es: "Tu Solicitud de Marca Ha Sido Recibida",
    zh: "您的商标申请已收到",
    de: "Ihre Markenanmeldung wurde erhalten",
    fr: "Votre demande de marque a été reçue",
    hi: "आपका ट्रेडमार्क आवेदन प्राप्त हो गया है",
    pt: "Sua Solicitação de Marca Foi Recebida",
    ja: "商標出願を受け付けました",
  },
  heading: {
    en: "Official Filing Confirmation",
    es: "Confirmación Oficial de Presentación",
    zh: "官方申请确认",
    de: "Offizielle Anmeldebestätigung",
    fr: "Confirmation officielle de dépôt",
    hi: "आधिकारिक दाखिल पुष्टि",
    pt: "Confirmação Oficial de Protocolo",
    ja: "正式な出願確認",
  },
  greeting: {
    en: "Dear",
    es: "Estimado/a",
    zh: "尊敬的",
    de: "Sehr geehrte/r",
    fr: "Cher/Chère",
    hi: "प्रिय",
    pt: "Prezado/a",
    ja: "様",
  },
  intro: {
    en: "Thank you for your trademark filing instruction. Your payment has been confirmed and our team has received your filing details. We will begin processing your application immediately.",
    es: "Gracias por tu instrucción de solicitud de marca. Tu pago ha sido confirmado y nuestro equipo ha recibido los detalles de tu solicitud. Comenzaremos a procesarla de inmediato.",
    zh: "感谢您的商标申请指令。您的付款已确认，我们的团队已收到您的申请详情，将立即开始处理您的申请。",
    de: "Vielen Dank für Ihren Markenanmeldeauftrag. Ihre Zahlung wurde bestätigt und unser Team hat Ihre Anmeldedetails erhalten. Wir werden Ihren Antrag sofort bearbeiten.",
    fr: "Merci pour votre instruction de dépôt de marque. Votre paiement a été confirmé et notre équipe a reçu vos détails de dépôt. Nous commencerons à traiter votre demande immédiatement.",
    hi: "आपके ट्रेडमार्क दाखिल निर्देश के लिए धन्यवाद। आपका भुगतान पुष्टि हो गया है और हमारी टीम को आपके दाखिल विवरण प्राप्त हो गए हैं। हम तुरंत आपके आवेदन को प्रोसेस करना शुरू करेंगे।",
    pt: "Obrigado pela sua instrução de protocolo de marca. Seu pagamento foi confirmado e nossa equipe recebeu seus detalhes de protocolo. Começaremos a processar sua solicitação imediatamente.",
    ja: "商標出願のご依頼ありがとうございます。お支払いが確認され、チームが出願詳細を受領しました。直ちに処理を開始いたします。",
  },
  refLabel: {
    en: "Your Reference Number",
    es: "Tu Número de Referencia",
    zh: "您的参考编号",
    de: "Ihre Referenznummer",
    fr: "Votre numéro de référence",
    hi: "आपका संदर्भ नंबर",
    pt: "Seu Número de Referência",
    ja: "参照番号",
  },
  sectionTrademark: {
    en: "Trademark Details",
    es: "Detalles de la Marca",
    zh: "商标详情",
    de: "Markendetails",
    fr: "Détails de la marque",
    hi: "ट्रेडमार्क विवरण",
    pt: "Detalhes da Marca",
    ja: "商標詳細",
  },
  labelMarkName: {
    en: "Mark Name / Identifier",
    es: "Nombre / Identificador de la Marca",
    zh: "商标名称 / 标识",
    de: "Markenname / Kennung",
    fr: "Nom de la marque / Identifiant",
    hi: "चिह्न नाम / पहचानकर्ता",
    pt: "Nome da Marca / Identificador",
    ja: "商標名 / 識別子",
  },
  labelMarkType: {
    en: "Mark Type",
    es: "Tipo de Marca",
    zh: "商标类型",
    de: "Markentyp",
    fr: "Type de marque",
    hi: "चिह्न प्रकार",
    pt: "Tipo de Marca",
    ja: "商標の種類",
  },
  labelClasses: {
    en: "Classes Filed",
    es: "Clases Solicitadas",
    zh: "申请类别",
    de: "Angemeldete Klassen",
    fr: "Classes déposées",
    hi: "दाखिल कक्षाएं",
    pt: "Classes Protocoladas",
    ja: "出願区分",
  },
  labelFilingDate: {
    en: "Filing Date",
    es: "Fecha de Presentación",
    zh: "申请日期",
    de: "Anmeldedatum",
    fr: "Date de dépôt",
    hi: "दाखिल तिथि",
    pt: "Data de Protocolo",
    ja: "出願日",
  },
  sectionClasses: {
    en: "International Classes",
    es: "Clases Internacionales",
    zh: "国际分类",
    de: "Internationale Klassen",
    fr: "Classes internationales",
    hi: "अंतर्राष्ट्रीय वर्ग",
    pt: "Classes Internacionais",
    ja: "国際分類",
  },
  classLabel: {
    en: "Class",
    es: "Clase",
    zh: "第",
    de: "Klasse",
    fr: "Classe",
    hi: "वर्ग",
    pt: "Classe",
    ja: "第",
  },
  classLabelSuffix: {
    en: "",
    es: "",
    zh: "类",
    de: "",
    fr: "",
    hi: "",
    pt: "",
    ja: "類",
  },
  sectionPayment: {
    en: "Payment Summary",
    es: "Resumen de Pago",
    zh: "付款摘要",
    de: "Zahlungsübersicht",
    fr: "Récapitulatif du paiement",
    hi: "भुगतान सारांश",
    pt: "Resumo do Pagamento",
    ja: "お支払い概要",
  },
  labelServiceFee: {
    en: "Professional Service Fee",
    es: "Honorarios Profesionales",
    zh: "专业服务费",
    de: "Professionelles Honorar",
    fr: "Honoraires professionnels",
    hi: "पेशेवर सेवा शुल्क",
    pt: "Honorários Profissionais",
    ja: "専門サービス料",
  },
  labelGovFee: {
    en: "Government Filing Fee",
    es: "Derechos de Tramitación Gubernamental",
    zh: "政府申请费",
    de: "Staatliche Anmeldegebühr",
    fr: "Frais officiels de dépôt",
    hi: "सरकारी दाखिल शुल्क",
    pt: "Taxa Governamental de Protocolo",
    ja: "政府出願費",
  },
  labelTotal: {
    en: "Total Paid",
    es: "Total Pagado",
    zh: "实付总额",
    de: "Gesamtbetrag",
    fr: "Total payé",
    hi: "कुल भुगतान",
    pt: "Total Pago",
    ja: "合計支払額",
  },
  sectionTrack: {
    en: "Track Your Application",
    es: "Seguimiento de Tu Solicitud",
    zh: "跟踪您的申请",
    de: "Ihre Anmeldung verfolgen",
    fr: "Suivre votre demande",
    hi: "अपने आवेदन को ट्रैक करें",
    pt: "Acompanhe Sua Solicitação",
    ja: "出願状況の確認",
  },
  trackBody: {
    en: "Monitor every stage of your trademark prosecution through your secure client portal — from filing receipt to registration certificate.",
    es: "Monitorea cada etapa del proceso de tu marca a través de tu portal seguro de cliente, desde el recibo de presentación hasta el certificado de registro.",
    zh: "通过您的安全客户门户，从申请收据到注册证书，全程跟踪您的商标审查进度。",
    de: "Verfolgen Sie jeden Schritt Ihres Markenverfahrens über Ihr sicheres Kundenportal — vom Einreichungsbeleg bis zur Registrierungsurkunde.",
    fr: "Suivez chaque étape de la procédure de votre marque via votre portail client sécurisé — du récépissé de dépôt au certificat d'enregistrement.",
    hi: "अपने सुरक्षित क्लाइंट पोर्टल के माध्यम से अपने ट्रेडमार्क अभियोजन के हर चरण की निगरानी करें — दाखिल रसीद से पंजीकरण प्रमाणपत्र तक।",
    pt: "Acompanhe cada etapa do processo de sua marca pelo seu portal seguro do cliente — do recibo de protocolo ao certificado de registro.",
    ja: "セキュアなクライアントポータルから出願受領書から登録証まで、商標審査のすべての段階を追跡できます。",
  },
  ctaBtn: {
    en: "Access Your Client Portal",
    es: "Acceder a Tu Portal de Cliente",
    zh: "访问您的客户门户",
    de: "Auf Ihr Kundenportal zugreifen",
    fr: "Accéder à votre portail client",
    hi: "अपने क्लाइंट पोर्टल तक पहुंचें",
    pt: "Acessar Seu Portal do Cliente",
    ja: "クライアントポータルへアクセス",
  },
  questions: {
    en: "Questions? Contact us at",
    es: "¿Preguntas? Contáctanos en",
    zh: "有问题？请联系我们：",
    de: "Fragen? Kontaktieren Sie uns unter",
    fr: "Des questions ? Contactez-nous à",
    hi: "प्रश्न? हमसे संपर्क करें:",
    pt: "Dúvidas? Fale conosco em",
    ja: "ご質問は：",
  },
  footer: {
    en: "This email confirms your paid filing instruction. Please retain it for your records.",
    es: "Este correo confirma tu instrucción de presentación pagada. Por favor, consérvalo para tus registros.",
    zh: "此电子邮件确认您已付费的申请指令。请保留以备记录。",
    de: "Diese E-Mail bestätigt Ihren bezahlten Anmeldeauftrag. Bitte bewahren Sie sie für Ihre Unterlagen auf.",
    fr: "Cet e-mail confirme votre instruction de dépôt payée. Veuillez le conserver pour vos dossiers.",
    hi: "यह ईमेल आपके भुगतान किए गए दाखिल निर्देश की पुष्टि करता है। कृपया इसे अपने रिकॉर्ड के लिए रखें।",
    pt: "Este e-mail confirma sua instrução de protocolo paga. Por favor, guarde-o para seus registros.",
    ja: "このメールは支払い済みの出願指示を確認するものです。記録として保管してください。",
  },
};

function ce(key: string, lang: string): string {
  const map = CLIENT_EMAIL_COPY[key];
  if (!map) return "";
  return map[lang] ?? map["en"] ?? "";
}

function buildClientEmail(
  app: Record<string, unknown>,
  client: Record<string, unknown>,
  trademark: Record<string, unknown>,
  classes: Record<string, unknown>[],
  totalPaid: number,
  language: string
) {
  const lang = CLIENT_EMAIL_COPY["subject"][language] ? language : "en";
  const classCount = classes.length;
  const govFeePerClass = 170;
  const govFeeTotal = classCount * govFeePerClass;
  const serviceFee = totalPaid - govFeeTotal;

  const dateLocale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : lang === "es" ? "es-MX" : lang === "pt" ? "pt-BR" : lang === "hi" ? "hi-IN" : "en-US";
  const filingDate = new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });

  const classSuffix = ce("classLabelSuffix", lang);
  const classLabel = ce("classLabel", lang);
  const classList = classes
    .map((c) => {
      const classTitle = String(c.class_title_en ?? c.goods_services_en ?? "");
      const classNum = String(c.class_number);
      const label = lang === "zh" || lang === "ja"
        ? `${classLabel}${classNum}${classSuffix} — ${classTitle}`
        : `${classLabel} ${classNum} — ${classTitle}`;
      return `<li>${label}</li>`;
    })
    .join("");

  const clientName = String(client.legal_name ?? client.contact_person ?? (lang === "zh" ? "尊敬的客户" : lang === "ja" ? "お客様" : lang === "es" ? "Estimado/a cliente/a" : lang === "de" ? "Geehrter Kunde" : lang === "fr" ? "Client estimé" : lang === "hi" ? "प्रिय ग्राहक" : lang === "pt" ? "Prezado cliente" : "Valued Client"));

  const classCountLabel = lang === "zh"
    ? `${classCount}个类别`
    : lang === "ja"
    ? `${classCount}区分`
    : lang === "es"
    ? `${classCount} clase${classCount !== 1 ? "s" : ""}`
    : lang === "de"
    ? `${classCount} Klasse${classCount !== 1 ? "n" : ""}`
    : lang === "fr"
    ? `${classCount} classe${classCount !== 1 ? "s" : ""}`
    : lang === "hi"
    ? `${classCount} वर्ग`
    : lang === "pt"
    ? `${classCount} classe${classCount !== 1 ? "s" : ""}`
    : `${classCount} class${classCount !== 1 ? "es" : ""}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
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
</style></head>
<body>
<div class="wrapper">
  <div class="header" style="text-align:center">
    <div style="margin-bottom:10px"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:6px;font-weight:bold">Mexico Trademark Center</div>
    <h1 style="margin:0;font-size:19px;font-weight:bold;font-family:Georgia,serif;color:#fff;">${ce("heading", lang)}</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;">${ce("greeting", lang)} ${clientName},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">${ce("intro", lang)}</p>

    <div class="case-banner">
      <div class="label">${ce("refLabel", lang)}</div>
      <div class="value">${String(app.case_number)}</div>
    </div>

    <div class="section-title">${ce("sectionTrademark", lang)}</div>
    <table class="data">
      <tr><td>${ce("labelMarkName", lang)}</td><td>${String(trademark.mark_name ?? "—")}</td></tr>
      <tr><td>${ce("labelMarkType", lang)}</td><td>${String(trademark.mark_type ?? "—")}</td></tr>
      <tr><td>${ce("labelClasses", lang)}</td><td>${classCountLabel}</td></tr>
      <tr><td>${ce("labelFilingDate", lang)}</td><td>${filingDate}</td></tr>
    </table>

    <div class="section-title">${ce("sectionClasses", lang)}</div>
    <ul class="classes">${classList}</ul>

    <div class="section-title">${ce("sectionPayment", lang)}</div>
    <div class="inv-row"><span>${ce("labelServiceFee", lang)}</span><span>USD ${formatCurrency(serviceFee)}</span></div>
    <div class="inv-row"><span>${ce("labelGovFee", lang)} (${classCountLabel} × USD ${govFeePerClass})</span><span>USD ${formatCurrency(govFeeTotal)}</span></div>
    <div class="inv-total"><span>${ce("labelTotal", lang)}</span><span>USD ${formatCurrency(totalPaid)}</span></div>

    <div class="section-title">${ce("sectionTrack", lang)}</div>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">${ce("trackBody", lang)}</p>

    <div class="cta">
      <a href="https://mexicotrademarkcenter.com/login">${ce("ctaBtn", lang)}</a>
    </div>

    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">${ce("questions", lang)} <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a></p>
  </div>
  <div style="background:#1a2e1a;padding:18px 40px;text-align:center">
    <p style="font-size:11px;color:#9db89d;margin:0 0 4px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:1px">MEXICO TRADEMARK CENTER</p>
    <p style="font-size:11px;color:#6a8a6a;margin:0;font-family:Arial,sans-serif">mexicotrademarkcenter.com &nbsp;·&nbsp; tm@mexicotrademarkcenter.com</p>
    <p style="font-size:11px;color:#4a6a4a;margin:6px 0 0;font-family:Arial,sans-serif">${ce("footer", lang)}</p>
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

    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { data: goodsServices } = await supabase
      .from("goods_services")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    const { data: payment } = await supabase
      .from("payments")
      .select("amount_usd")
      .eq("application_id", application_id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const totalPaid = payment?.amount_usd ?? app.total_amount_usd ?? 0;
    const safeClasses = (classes ?? []) as Record<string, unknown>[];
    const safeTrademark = (trademark ?? {}) as Record<string, unknown>;
    const safeClient = (client ?? {}) as Record<string, unknown>;
    const searchLanguage = String(app.search_language ?? app.language ?? "en");

    let logoUrl: string | null = null;
    if (safeTrademark.logo_file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("trademark-assets")
        .createSignedUrl(String(safeTrademark.logo_file_path), 60 * 60 * 24 * 7);
      logoUrl = signedUrl?.signedUrl ?? (safeTrademark.logo_preview_url as string) ?? null;
    }

    const formHtml = buildInstructionFormHtml(
      app,
      safeClient,
      safeTrademark,
      safeClasses,
      goodsServices as Record<string, unknown> | null,
      logoUrl
    );

    const results: Record<string, unknown> = {};

    // 1. Client confirmation email
    if (safeClient.email) {
      const clientHtml = buildClientEmail(
        app,
        safeClient,
        safeTrademark,
        safeClasses,
        Number(totalPaid),
        searchLanguage
      );
      const clientSubject = `${ce("subject", searchLanguage)} — ${app.case_number}`;
      const clientResult = await sendEmail(
        String(safeClient.email),
        clientSubject,
        clientHtml
      );
      results.client_email = clientResult;

      await supabase.from("email_log").insert({
        application_id,
        recipient_email: safeClient.email,
        template_key: "client_confirmation",
        subject: clientSubject,
        status: clientResult.ok ? "sent" : "failed",
        resend_message_id: clientResult.data?.id,
        error_message: clientResult.ok ? null : JSON.stringify(clientResult.data),
      });
    }

    // 2. Staff instruction form email
    const staffResult = await sendEmail(
      FILING_TO_EMAIL,
      `NEW FILING INSTRUCTION — ${app.case_number} — ${safeTrademark.mark_name ?? "Trademark"}`,
      formHtml,
      [FILING_CC_EMAIL]
    );
    results.staff_email = staffResult;

    const sentAt = new Date().toISOString();

    await supabase.from("email_log").insert({
      application_id,
      recipient_email: FILING_TO_EMAIL,
      template_key: "filing_instruction_form",
      subject: `NEW FILING INSTRUCTION — ${app.case_number}`,
      status: staffResult.ok ? "sent" : "failed",
      resend_message_id: staffResult.data?.id,
      error_message: staffResult.ok ? null : JSON.stringify(staffResult.data),
    });

    // 3. Persist form record for admin dashboard
    await supabase.from("filing_instruction_forms").insert({
      application_id,
      html_content: formHtml,
      sent_at: staffResult.ok ? sentAt : null,
      sent_to_email: FILING_TO_EMAIL,
      status: staffResult.ok ? "sent" : "generated",
    });

    // 4. Timeline event
    await supabase.from("timeline_events").insert({
      application_id,
      event_type: "payment_confirmed",
      title: "Payment confirmed — filing instructions sent",
      description: `Payment of USD ${Number(totalPaid).toFixed(2)} confirmed. Instruction form dispatched to ${FILING_TO_EMAIL}. Application is now in queue for processing.`,
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
