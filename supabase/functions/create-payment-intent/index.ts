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
    const { applicationId, amountUsd, markName, totalClasses, couponCode } = body as {
      applicationId: string;
      amountUsd: number;
      markName: string;
      totalClasses: number;
      couponCode?: string;
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

    // Validate coupon if provided
    let discountPercent = 0;
    let couponId: string | null = null;

    if (couponCode && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("id, discount_percent, max_uses, uses_count, active, expires_at")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (!coupon || !coupon.active) {
        return new Response(
          JSON.stringify({ error: "Invalid or inactive coupon code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Coupon has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ error: "Coupon has reached its maximum uses" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      discountPercent = coupon.discount_percent;
      couponId = coupon.id;
    }

    // Apply discount
    const discountedAmount = discountPercent > 0
      ? Math.max(0.50, amountUsd * (1 - discountPercent / 100)) // Stripe minimum $0.50
      : amountUsd;

    const finalAmountCents = Math.round(discountedAmount * 100);

    // Create the Stripe PaymentIntent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents,
      currency: "usd",
      metadata: {
        application_id: applicationId,
        case_number: app.case_number,
        client_id: app.client_id,
        mark_name: markName || "",
        total_classes: String(totalClasses || 1),
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : "",
        discount_percent: String(discountPercent),
        original_amount_usd: String(amountUsd),
      },
      description: `Mexico Trademark Filing — ${markName} (${totalClasses} class${totalClasses !== 1 ? "es" : ""}) — Case ${app.case_number}${discountPercent > 0 ? ` — ${discountPercent}% discount applied` : ""}`,
      automatic_payment_methods: { enabled: true },
    });

    // Create a pending payment record in the database
    await supabase.from("payments").insert({
      application_id: applicationId,
      client_id: app.client_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_usd: discountedAmount,
      currency: "usd",
      status: "pending",
    });

    // Increment coupon usage counter atomically (service role bypasses RLS)
    if (couponId) {
      const { data: current } = await supabase
        .from("coupons")
        .select("uses_count")
        .eq("id", couponId)
        .maybeSingle();
      if (current) {
        await supabase
          .from("coupons")
          .update({ uses_count: current.uses_count + 1 })
          .eq("id", couponId);
      }
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        discountPercent,
        finalAmountUsd: discountedAmount,
        originalAmountUsd: amountUsd,
      }),
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
