import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { paymentIntentId, applicationId, language } = await req.json() as {
      paymentIntentId: string;
      applicationId: string;
      language?: string;
    };

    if (!paymentIntentId || !applicationId) {
      return new Response(
        JSON.stringify({ error: "paymentIntentId and applicationId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the payment intent with Stripe to confirm it actually succeeded
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    if (intent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: `Payment not succeeded — status: ${intent.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Guard: only process if application_id in metadata matches
    if (intent.metadata?.application_id && intent.metadata.application_id !== applicationId) {
      return new Response(
        JSON.stringify({ error: "applicationId mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve language: prefer value sent by client (live site language at payment time),
    // fall back to what was stored in Stripe metadata, then default to 'en'
    const resolvedLanguage = language || intent.metadata?.language || "en";

    // Get receipt URL from the latest charge
    let receiptUrl: string | null = null;
    const charge = intent.latest_charge as Stripe.Charge | null;
    if (charge && typeof charge === "object") {
      receiptUrl = charge.receipt_url ?? null;
    }

    // Update payments record
    await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
      })
      .eq("stripe_payment_intent_id", paymentIntentId);

    // Update application payment + filing status (idempotent), persist language
    await supabase
      .from("applications")
      .update({
        payment_status: "paid",
        filing_status: "pending_review",
        language: resolvedLanguage,
      })
      .eq("id", applicationId);

    // Fetch application to check if we need to auto-create client account
    const { data: app } = await supabase
      .from("applications")
      .select("user_id, client_id, clients(email, legal_name, contact_person)")
      .eq("id", applicationId)
      .maybeSingle();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Fire send-filing-emails (confirmation to client + instruction sheet to staff)
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/send-filing-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ application_id: applicationId, language: resolvedLanguage }),
      }).catch((e) => console.error("send-filing-emails failed:", e))
    );

    // Auto-create client portal account if user was not logged in when they filed
    if (!app?.user_id) {
      const clientData = app?.clients as Record<string, unknown> | null;
      const email = clientData?.email as string | undefined;
      const fullName = (clientData?.legal_name ?? clientData?.contact_person) as string | undefined;
      if (email) {
        EdgeRuntime.waitUntil(
          fetch(`${supabaseUrl}/functions/v1/create-client-account`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ application_id: applicationId, email, full_name: fullName }),
          }).catch((e) => console.error("create-client-account failed:", e))
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, receiptUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("confirm-payment-client error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
