import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const { paymentIntentId, reportOrderId } = await req.json() as {
      paymentIntentId: string;
      reportOrderId: string;
    };

    if (!paymentIntentId || !reportOrderId) {
      return new Response(JSON.stringify({ error: "paymentIntentId and reportOrderId are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify payment with Stripe
    const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (!piRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to verify payment" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const pi = await piRes.json();
    if (pi.status !== "succeeded") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check order exists and isn't already paid
    const { data: order } = await supabase
      .from("clearance_report_orders")
      .select("id, status, email, mark_name, language")
      .eq("id", reportOrderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Report order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (order.status === "paid") {
      // Already processed — idempotent response
      return new Response(JSON.stringify({ success: true, reportOrderId, alreadyProcessed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark as paid
    await supabase
      .from("clearance_report_orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", reportOrderId);

    // Fire PDF generation and email in background
    const selfUrl = supabaseUrl;
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const pdfRes = await fetch(`${selfUrl}/functions/v1/generate-clearance-pdf`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ reportOrderId }),
          });
          if (!pdfRes.ok) {
            console.error("generate-clearance-pdf failed:", await pdfRes.text());
          }
        } catch (e) {
          console.error("Background PDF generation error:", e);
        }
      })()
    );

    return new Response(JSON.stringify({ success: true, reportOrderId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("confirm-report-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
