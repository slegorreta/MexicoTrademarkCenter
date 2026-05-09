import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { couponCode } = body as { couponCode: string };

    if (!couponCode || !couponCode.trim()) {
      return new Response(
        JSON.stringify({ error: "couponCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    return new Response(
      JSON.stringify({ valid: true, discountPercent: coupon.discount_percent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("validate-coupon error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
