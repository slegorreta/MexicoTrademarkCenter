import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2024-12-18.acacia",
    });

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
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!["super_admin", "admin", "docketing_staff", "filing_staff"].includes(profile?.role ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch application + client + trademark
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*, clients(*), trademarks(*)")
      .eq("id", application_id)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    const amountUsd = Number(app.total_amount_usd ?? 0);
    if (amountUsd <= 0) throw new Error("Application has no amount set");

    const markName = (app.trademarks as Record<string, unknown>[] | null)?.[0]?.mark_name
      ?? (app.trademarks as Record<string, unknown> | null)?.mark_name
      ?? "Trademark";

    // Create Stripe Price ad-hoc then Payment Link
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: Math.round(amountUsd * 100),
      product_data: {
        name: `Mexico Trademark Application — ${String(markName)} (${String(app.case_number)})`,
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        application_id,
        case_number: String(app.case_number),
        type: "staff_payment_link",
      },
      after_completion: {
        type: "redirect",
        redirect: { url: "https://mexicotrademarkcenter.com/login?paid=1" },
      },
    });

    // Store in DB
    await supabase.from("staff_payment_links").insert({
      application_id,
      created_by: user.id,
      stripe_payment_link_url: paymentLink.url,
      stripe_payment_link_id: paymentLink.id,
      amount_usd: amountUsd,
    });

    return new Response(
      JSON.stringify({ success: true, payment_link_url: paymentLink.url, payment_link_id: paymentLink.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-staff-payment-link error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
