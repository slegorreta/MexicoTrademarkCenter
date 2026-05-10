import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_PRICE_USD = 4.99;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { markName, goodsServices, language, clearanceResult, email, couponCode } = body as {
      markName: string;
      goodsServices: string;
      language: string;
      clearanceResult: Record<string, unknown>;
      email: string;
      couponCode?: string;
    };

    if (!markName || !email || !clearanceResult) {
      return new Response(JSON.stringify({ error: "markName, email, and clearanceResult are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate coupon if provided
    let discountPercent = 0;
    let couponId: string | null = null;
    const normalizedCoupon = couponCode?.trim().toUpperCase() ?? "";

    if (normalizedCoupon) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("id, discount_percent, active, expires_at, max_uses, uses_count")
        .eq("code", normalizedCoupon)
        .maybeSingle();

      if (!coupon || !coupon.active) {
        return new Response(JSON.stringify({ error: "invalid_coupon", message: "Coupon code is invalid or inactive." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "expired_coupon", message: "This coupon has expired." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return new Response(JSON.stringify({ error: "coupon_exhausted", message: "This coupon has reached its usage limit." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      discountPercent = coupon.discount_percent;
      couponId = coupon.id;
    }

    const finalAmountUsd = discountPercent > 0
      ? Math.max(0.50, BASE_PRICE_USD * (1 - discountPercent / 100))
      : BASE_PRICE_USD;
    const amountCents = Math.round(finalAmountUsd * 100);

    // Insert report order (pending)
    const { data: order, error: insertError } = await supabase
      .from("clearance_report_orders")
      .insert({
        mark_name: markName.trim(),
        goods_services: goodsServices ?? "",
        language: language ?? "en",
        clearance_result: clearanceResult,
        email: email.trim().toLowerCase(),
        amount_usd: BASE_PRICE_USD,
        coupon_code: normalizedCoupon || null,
        discount_percent: discountPercent,
        final_amount_usd: finalAmountUsd,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !order) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create report order" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Increment coupon uses atomically
    if (couponId) {
      await supabase.rpc("increment_coupon_uses", { coupon_id: couponId });
    }

    // Create Stripe PaymentIntent
    const piBody = new URLSearchParams({
      amount: String(amountCents),
      currency: "usd",
      "metadata[payment_type]": "clearance_report",
      "metadata[report_order_id]": order.id,
      "metadata[mark_name]": markName.trim().slice(0, 200),
      "metadata[email]": email.trim().toLowerCase().slice(0, 200),
    });

    const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: piBody.toString(),
    });

    if (!piRes.ok) {
      const piErr = await piRes.json();
      console.error("Stripe PI error:", piErr);
      return new Response(JSON.stringify({ error: "Payment setup failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pi = await piRes.json();

    // Store the PaymentIntent ID on the order
    await supabase
      .from("clearance_report_orders")
      .update({ stripe_payment_intent_id: pi.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      reportOrderId: order.id,
      discountPercent,
      finalAmountUsd,
      originalAmountUsd: BASE_PRICE_USD,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-report-payment-intent error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
