import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      return new Response("Stripe not configured", { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const paymentType = intent.metadata?.payment_type;

      // ── Clearance report payment ──────────────────────────────────────────
      if (paymentType === "clearance_report") {
        const reportOrderId = intent.metadata?.report_order_id;
        if (!reportOrderId) {
          console.error("No report_order_id in metadata for intent:", intent.id);
          return new Response("OK", { status: 200 });
        }

        // Check if already paid (idempotency)
        const { data: order } = await supabase
          .from("clearance_report_orders")
          .select("status")
          .eq("id", reportOrderId)
          .maybeSingle();

        if (order?.status === "paid") {
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Mark as paid
        await supabase
          .from("clearance_report_orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: intent.id,
          })
          .eq("id", reportOrderId);

        // Generate PDF and send email as failsafe (client-side confirm-report-payment does this first)
        EdgeRuntime.waitUntil(
          fetch(`${supabaseUrl}/functions/v1/generate-clearance-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ reportOrderId }),
          }).catch((e) => console.error("generate-clearance-pdf (webhook failsafe) failed:", e))
        );

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Application filing payment (existing flow) ────────────────────────
      const applicationId = intent.metadata?.application_id;

      if (!applicationId) {
        console.error("No application_id or payment_type in metadata for intent:", intent.id);
        return new Response("OK", { status: 200 });
      }

      await supabase
        .from("payments")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", intent.id);

      await supabase
        .from("applications")
        .update({ payment_status: "paid", filing_status: "pending_review" })
        .eq("id", applicationId);

      const { data: app } = await supabase
        .from("applications")
        .select("user_id, client_id, clients(email, legal_name, contact_person)")
        .eq("id", applicationId)
        .maybeSingle();

      EdgeRuntime.waitUntil(
        fetch(`${supabaseUrl}/functions/v1/send-filing-emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ application_id: applicationId, language: intent.metadata?.language || "en" }),
        }).catch((e) => console.error("send-filing-emails failed:", e))
      );

      if (!app?.user_id) {
        const clientData = app?.clients as Record<string, unknown> | null;
        const email = clientData?.email as string | undefined;
        const fullName = (clientData?.legal_name ?? clientData?.contact_person) as string | undefined;
        if (email) {
          EdgeRuntime.waitUntil(
            fetch(`${supabaseUrl}/functions/v1/create-client-account`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
              body: JSON.stringify({ application_id: applicationId, email, full_name: fullName }),
            }).catch((e) => console.error("create-client-account failed:", e))
          );
        }
      }

    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;

      if (intent.metadata?.payment_type === "clearance_report") {
        const reportOrderId = intent.metadata?.report_order_id;
        if (reportOrderId) {
          await supabase
            .from("clearance_report_orders")
            .update({ status: "failed" })
            .eq("id", reportOrderId);
        }
      } else {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", intent.id);

        if (intent.metadata?.application_id) {
          await supabase
            .from("applications")
            .update({ payment_status: "failed" })
            .eq("id", intent.metadata.application_id);
        }
      }

    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        const intentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent.id;

        const isFullRefund = charge.refunded;
        const refundAmountUsd = charge.amount_refunded / 100;

        await supabase
          .from("payments")
          .update({
            status: isFullRefund ? "refunded" : "partially_refunded",
            refund_amount_usd: refundAmountUsd,
            refunded_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", intentId);

        if (isFullRefund) {
          const { data: payment } = await supabase
            .from("payments")
            .select("application_id")
            .eq("stripe_payment_intent_id", intentId)
            .maybeSingle();

          if (payment?.application_id) {
            await supabase
              .from("applications")
              .update({ payment_status: "refunded" })
              .eq("id", payment.application_id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
