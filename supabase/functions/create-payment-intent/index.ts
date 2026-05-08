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

    const body = await req.json();
    const { applicationId, amountUsd, markName, totalClasses } = body as {
      applicationId: string;
      amountUsd: number;
      markName: string;
      totalClasses: number;
    };

    if (!applicationId || !amountUsd) {
      return new Response(
        JSON.stringify({ error: "applicationId and amountUsd required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the application exists and is still pending payment
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("id, case_number, payment_status, client_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (app.payment_status === "paid") {
      return new Response(
        JSON.stringify({ error: "Application already paid" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the Stripe PaymentIntent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUsd * 100),
      currency: "usd",
      metadata: {
        application_id: applicationId,
        case_number: app.case_number,
        client_id: app.client_id,
        mark_name: markName || "",
        total_classes: String(totalClasses || 1),
      },
      description: `Mexico Trademark Filing — ${markName} (${totalClasses} class${totalClasses !== 1 ? "es" : ""}) — Case ${app.case_number}`,
      automatic_payment_methods: { enabled: true },
    });

    // Create a pending payment record in the database
    await supabase.from("payments").insert({
      application_id: applicationId,
      client_id: app.client_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_usd: amountUsd,
      currency: "usd",
      status: "pending",
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
