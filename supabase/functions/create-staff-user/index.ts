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

const VALID_STAFF_ROLES = ["admin", "docketing_staff", "filing_staff", "read_only"];

async function sendStaffWelcomeEmail(toEmail: string, fullName: string, role: string, resetLink: string) {
  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    docketing_staff: "Docketing Staff",
    filing_staff: "Filing Staff",
    read_only: "Read-Only Staff",
  };

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; color: #1a1a1a; background: #f5f5f5; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #ddd; }
.header { background: #0f1f0f; padding: 28px 36px; }
.header h1 { color: #fff; font-size: 18px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.header p { color: #7aaa7a; font-size: 12px; margin: 4px 0 0; }
.body { padding: 36px; }
.role-badge { display: inline-block; background: #e8f0e8; color: #1a4a1a; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 8px 0 20px; }
.cta { text-align: center; margin: 32px 0; }
.cta a { background: #0f1f0f; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; display: inline-block; }
.footer { background: #f0f0f0; padding: 20px 36px; font-size: 12px; color: #888; text-align: center; }
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Mexico Trademark Center</h1>
    <p>Staff Portal Access</p>
  </div>
  <div class="body">
    <p style="font-size:15px;margin-bottom:4px;">Welcome, ${fullName}!</p>
    <div class="role-badge">${roleLabel[role] ?? role}</div>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">A staff account has been created for you on the Mexico Trademark Center management platform. You can access the full docketing system, client applications, and filing tools through the staff portal.</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Click below to set your password and access the portal:</p>
    <div class="cta"><a href="${resetLink}">Set Password &amp; Access Portal</a></div>
    <p style="font-size:12px;color:#888;">Staff portal: <a href="${SITE_URL}/staff" style="color:#1a4a1a;">${SITE_URL}/staff</a><br>
    This link expires in 24 hours. Contact your administrator if you need a new link.</p>
  </div>
  <div class="footer">Mexico Trademark Center &bull; Confidential Staff Communication</div>
</div>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: "Mexico Trademark Center — Your Staff Account Has Been Created",
      html,
    }),
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

    // Verify caller is super_admin
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
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (callerProfile?.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Only super_admin can create staff accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, role } = await req.json();

    if (!email || !full_name || !role) {
      return new Response(JSON.stringify({ error: "email, full_name, and role are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!VALID_STAFF_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `role must be one of: ${VALID_STAFF_ROLES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createErr || !newUser?.user) throw new Error(createErr?.message ?? "Failed to create user");

    const userId = newUser.user.id;

    // Create profile with staff role
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name,
      role,
      staff_created: true,
      password_change_required: true,
      is_active: true,
    }, { onConflict: "id" });

    // Generate password reset link pointing to staff portal
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/staff` },
    });
    if (linkErr) console.error("Failed to generate reset link:", linkErr);

    const resetLink = linkData?.properties?.action_link ?? `${SITE_URL}/staff`;

    // Send welcome email
    await sendStaffWelcomeEmail(email, full_name, role, resetLink);

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-staff-user error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
