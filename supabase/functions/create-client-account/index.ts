import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";
const SITE_URL = "https://mexicotrademarkcenter.com";

const COPY: Record<string, Record<string, string>> = {
  subject: {
    en: "Welcome to Mexico Trademark Center — Set Up Your Portal Access",
    es: "Bienvenido/a a Mexico Trademark Center — Configure su acceso al portal",
    zh: "欢迎使用Mexico Trademark Center — 设置您的门户访问权限",
    de: "Willkommen bei Mexico Trademark Center — Richten Sie Ihren Portalzugang ein",
    fr: "Bienvenue chez Mexico Trademark Center — Configurez votre accès au portail",
    hi: "Mexico Trademark Center में आपका स्वागत है — अपना पोर्टल एक्सेस सेट करें",
    pt: "Bem-vindo ao Mexico Trademark Center — Configure seu acesso ao portal",
    ja: "Mexico Trademark Center へようこそ — ポータルへのアクセスを設定してください",
  },
  heading: {
    en: "Welcome to Your Client Portal",
    es: "Bienvenido/a a Su Portal de Cliente",
    zh: "欢迎使用您的客户门户",
    de: "Willkommen in Ihrem Kundenportal",
    fr: "Bienvenue sur votre portail client",
    hi: "आपके क्लाइंट पोर्टल में आपका स्वागत है",
    pt: "Bem-vindo(a) ao seu Portal do Cliente",
    ja: "クライアントポータルへようこそ",
  },
  greeting: {
    en: "Dear", es: "Estimado/a", zh: "尊敬的", de: "Sehr geehrte/r",
    fr: "Cher/Chère", hi: "प्रिय", pt: "Caro(a)", ja: "様",
  },
  intro: {
    en: "A client portal account has been created for you at Mexico Trademark Center. Through your portal you can:",
    es: "Se ha creado una cuenta de portal de cliente para usted en Mexico Trademark Center. A través de su portal puede:",
    zh: "已为您在Mexico Trademark Center创建了客户门户账户。通过您的门户，您可以：",
    de: "Für Sie wurde ein Kundenkonto bei Mexico Trademark Center eingerichtet. Über Ihr Portal können Sie:",
    fr: "Un compte portail client a été créé pour vous chez Mexico Trademark Center. Via votre portail vous pouvez :",
    hi: "Mexico Trademark Center में आपके लिए एक क्लाइंट पोर्टल खाता बनाया गया है। आपके पोर्टल के माध्यम से आप कर सकते हैं:",
    pt: "Uma conta no portal do cliente foi criada para você no Mexico Trademark Center. Pelo seu portal você pode:",
    ja: "Mexico Trademark Centerにお客様のクライアントポータルアカウントが作成されました。ポータルでできること：",
  },
  feature1: {
    en: "Track the status of all your trademark filings in real time",
    es: "Seguir el estado de todas sus solicitudes de marca en tiempo real",
    zh: "实时跟踪所有商标申请的状态",
    de: "Den Status aller Ihrer Markenanmeldungen in Echtzeit verfolgen",
    fr: "Suivre le statut de tous vos dépôts de marque en temps réel",
    hi: "अपनी सभी ट्रेडमार्क फाइलिंग की स्थिति रियल टाइम में ट्रैक करें",
    pt: "Acompanhar o status de todos os seus registros de marca em tempo real",
    ja: "すべての商標出願の状況をリアルタイムで確認",
  },
  feature2: {
    en: "Download official documents and filing receipts",
    es: "Descargar documentos oficiales y recibos de presentación",
    zh: "下载官方文件和申请收据",
    de: "Offizielle Dokumente und Einreichungsbelege herunterladen",
    fr: "Télécharger les documents officiels et les récépissés de dépôt",
    hi: "आधिकारिक दस्तावेज़ और फाइलिंग रसीदें डाउनलोड करें",
    pt: "Baixar documentos oficiais e comprovantes de protocolo",
    ja: "公式書類や出願受領書のダウンロード",
  },
  feature3: {
    en: "Communicate directly with our team",
    es: "Comunicarse directamente con nuestro equipo",
    zh: "直接与我们的团队沟通",
    de: "Direkt mit unserem Team kommunizieren",
    fr: "Communiquer directement avec notre équipe",
    hi: "हमारी टीम से सीधे संवाद करें",
    pt: "Comunicar-se diretamente com nossa equipe",
    ja: "チームと直接コミュニケーション",
  },
  ctaBtn: {
    en: "Set My Password & Sign In",
    es: "Establecer mi contraseña e iniciar sesión",
    zh: "设置密码并登录",
    de: "Passwort festlegen und anmelden",
    fr: "Définir mon mot de passe et me connecter",
    hi: "पासवर्ड सेट करें और साइन इन करें",
    pt: "Definir senha e entrar",
    ja: "パスワードを設定してサインイン",
  },
  expiry: {
    en: "This link expires in 24 hours. If you did not expect this email, please contact us at tm@mexicotrademarkcenter.com.",
    es: "Este enlace expira en 24 horas. Si no esperaba este correo, contáctenos en tm@mexicotrademarkcenter.com.",
    zh: "此链接在24小时后过期。如果您未预期此电子邮件，请联系 tm@mexicotrademarkcenter.com。",
    de: "Dieser Link läuft nach 24 Stunden ab. Falls Sie diese E-Mail nicht erwartet haben, kontaktieren Sie uns unter tm@mexicotrademarkcenter.com.",
    fr: "Ce lien expire dans 24 heures. Si vous n'attendiez pas cet e-mail, contactez-nous à tm@mexicotrademarkcenter.com.",
    hi: "यह लिंक 24 घंटे में समाप्त हो जाता है। यदि आप इस ईमेल की उम्मीद नहीं कर रहे थे, तो tm@mexicotrademarkcenter.com से संपर्क करें।",
    pt: "Este link expira em 24 horas. Se não esperava este e-mail, contate tm@mexicotrademarkcenter.com.",
    ja: "このリンクは24時間で失効します。このメールに心当たりがない場合は tm@mexicotrademarkcenter.com までご連絡ください。",
  },
};

function cp(key: string, lang: string): string {
  return COPY[key]?.[lang] ?? COPY[key]?.["en"] ?? "";
}

function buildWelcomeEmail(clientName: string, resetLink: string, lang: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.body { padding: 40px; }
.cta { text-align: center; margin: 36px 0; }
.cta a { background: #1a2e1a; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
</style></head>
<body>
<div class="wrapper">
  <div style="background:#1a2e1a;padding:32px 40px;text-align:center">
    <div style="margin-bottom:10px"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;font-weight:bold;margin-bottom:4px">Mexico Trademark Center</div>
    <h1 style="color:#fff;font-size:18px;margin:0;font-weight:bold;font-family:Georgia,serif">${cp("heading", lang)}</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;">${cp("greeting", lang)} ${clientName},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">${cp("intro", lang)}</p>
    <ul style="font-size:14px;color:#4a4a4a;line-height:2;">
      <li>${cp("feature1", lang)}</li>
      <li>${cp("feature2", lang)}</li>
      <li>${cp("feature3", lang)}</li>
    </ul>
    <div class="cta"><a href="${resetLink}">${cp("ctaBtn", lang)}</a></div>
    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">${cp("expiry", lang)}</p>
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

    const { application_id, email, full_name, language } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      if (application_id) {
        await supabase.from("applications").update({ user_id: userId }).eq("id", application_id).is("user_id", null);
        const { data: app } = await supabase.from("applications").select("client_id").eq("id", application_id).maybeSingle();
        if (app?.client_id) {
          await supabase.from("clients").update({ user_id: userId }).eq("id", app.client_id).is("user_id", null);
        }
      }

      return new Response(JSON.stringify({ success: true, user_id: userId, existing: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new auth user
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? email.split("@")[0] },
    });

    if (createErr || !newUser?.user) throw new Error(createErr?.message ?? "Failed to create user");

    userId = newUser.user.id;

    // Resolve language: passed language > application language > en
    let resolvedLang = language || "en";
    if (application_id && resolvedLang === "en") {
      const { data: appRow } = await supabase
        .from("applications")
        .select("language, search_language")
        .eq("id", application_id)
        .maybeSingle();
      if (appRow) resolvedLang = appRow.search_language || appRow.language || "en";
    }

    // Upsert profile with preferred_language set to the submission language
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name: full_name ?? email.split("@")[0],
      role: "client",
      password_change_required: true,
      staff_created: false,
      is_active: true,
      preferred_language: resolvedLang,
    }, { onConflict: "id" });

    // Also update client's preferred_language
    if (application_id) {
      await supabase.from("applications").update({ user_id: userId }).eq("id", application_id);
      const { data: app } = await supabase.from("applications").select("client_id").eq("id", application_id).maybeSingle();
      if (app?.client_id) {
        await supabase.from("clients")
          .update({ user_id: userId, preferred_language: resolvedLang })
          .eq("id", app.client_id);
      }
    }

    // Generate password reset link
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/login?set_password=1` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("Failed to generate reset link:", linkErr);
    }

    const resetLink = linkData?.properties?.action_link ?? `${SITE_URL}/login`;

    // Send welcome email in the client's language
    const subject = cp("subject", resolvedLang);
    const html = buildWelcomeEmail(full_name ?? email.split("@")[0], resetLink, resolvedLang);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html }),
    });
    const emailResult = { ok: res.ok, data: await res.json() };

    if (application_id) {
      await supabase.from("email_log").insert({
        application_id,
        recipient_email: email,
        template_key: "client_welcome",
        subject,
        status: emailResult.ok ? "sent" : "failed",
        resend_message_id: emailResult.data?.id,
        error_message: emailResult.ok ? null : JSON.stringify(emailResult.data),
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, existing: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-client-account error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
