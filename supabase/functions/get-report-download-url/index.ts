import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Track in-flight generation attempts to avoid duplicate triggers within the same
// function instance (across polling calls that arrive before the PDF is ready).
const inFlight = new Set<string>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reportOrderId } = await req.json() as { reportOrderId: string };

    if (!reportOrderId) {
      return new Response(JSON.stringify({ error: "reportOrderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase
      .from("clearance_report_orders")
      .select("id, status, pdf_storage_path, created_at")
      .eq("id", reportOrderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Order is paid but PDF is missing — self-heal by triggering generation.
    // Only fire once per instance to avoid stampede; give up after 10 minutes (order too old).
    if (order.status === "paid" && !order.pdf_storage_path) {
      const ageMs = Date.now() - new Date(order.created_at).getTime();
      const tooOld = ageMs > 10 * 60 * 1000; // 10 minutes

      if (!tooOld && !inFlight.has(reportOrderId)) {
        inFlight.add(reportOrderId);
        EdgeRuntime.waitUntil(
          (async () => {
            try {
              const res = await fetch(`${supabaseUrl}/functions/v1/generate-clearance-pdf`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ reportOrderId }),
              });
              if (!res.ok) {
                console.error("get-report-download-url: self-heal PDF failed:", await res.text());
              }
            } catch (e) {
              console.error("get-report-download-url: self-heal PDF error:", e);
            } finally {
              inFlight.delete(reportOrderId);
            }
          })()
        );
      }

      return new Response(JSON.stringify({ url: null, generating: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "paid" || !order.pdf_storage_path) {
      return new Response(JSON.stringify({ url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed } = await supabase.storage
      .from("clearance-reports")
      .createSignedUrl(order.pdf_storage_path, 60 * 60 * 24 * 7);

    return new Response(JSON.stringify({ url: signed?.signedUrl ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-report-download-url error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
