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

async function sendWelcomeEmail(toEmail: string, clientName: string, resetLink: string) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.body { padding: 40px; }
.cta { text-align: center; margin: 36px 0; }
.cta a { background: #1a2e1a; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; line-height: 1.6; }
</style></head>
<body>
<div class="wrapper">
  <div class="header" style="text-align:center">
    <div style="margin-bottom:10px"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;font-weight:bold;margin-bottom:4px">Mexico Trademark Center</div>
    <h1 style="color:#fff;font-size:18px;margin:0;font-weight:bold;font-family:Georgia,serif">Welcome to Your Client Portal</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;">Dear ${clientName},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">A client portal account has been created for you at Mexico Trademark Center. Through your portal you can:</p>
    <ul style="font-size:14px;color:#4a4a4a;line-height:2;">
      <li>Track the status of all your trademark filings in real time</li>
      <li>Download official documents and filing receipts</li>
      <li>Communicate directly with our team</li>
      <li>View the complete prosecution timeline for each mark</li>
    </ul>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Click the button below to set your password and access your account:</p>
    <div class="cta"><a href="${resetLink}">Set My Password &amp; Sign In</a></div>
    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">This link expires in 24 hours. If you did not expect this email, please contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a>.</p>
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
    body: JSON.stringify({ from: FROM_EMAIL, to: [toEmail], subject: "Welcome to Mexico Trademark Center — Set Up Your Portal Access", html }),
  });
  return { ok: res.ok, data: await res.json() };
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

    const { application_id, email, full_name } = await req.json();

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
      // User already has an account — just link it
      userId = existingUser.id;

      // Update application and client with user_id if missing
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

    // Upsert profile
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name: full_name ?? email.split("@")[0],
      role: "client",
      password_change_required: true,
      staff_created: false,
      is_active: true,
    }, { onConflict: "id" });

    // Link application and client
    if (application_id) {
      await supabase.from("applications").update({ user_id: userId }).eq("id", application_id);
      const { data: app } = await supabase.from("applications").select("client_id").eq("id", application_id).maybeSingle();
      if (app?.client_id) {
        await supabase.from("clients").update({ user_id: userId }).eq("id", app.client_id);
      }
    }

    // Generate password reset link so user sets their own password
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/login?set_password=1` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("Failed to generate reset link:", linkErr);
    }

    const resetLink = linkData?.properties?.action_link ?? `${SITE_URL}/login`;

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email, full_name ?? email.split("@")[0], resetLink);

    // Log email
    if (application_id) {
      await supabase.from("email_log").insert({
        application_id,
        recipient_email: email,
        template_key: "client_welcome",
        subject: "Welcome to Mexico Trademark Center — Set Up Your Portal Access",
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
