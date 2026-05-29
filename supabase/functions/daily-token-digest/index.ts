import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAILS = [
  "info@mexicotrademarkcenter.com",
  "tm@mexicotrademarkcenter.com",
];
const ADMIN_CC_EMAILS = [
  "sergiolegorreta@yahoo.com",
  "Sergio.Legorreta@lawtaem.com",
];

// Mexico City is UTC-6 (CST) / UTC-5 (CDT). We schedule invocation at 10pm MX.
// This function can also be called manually via POST for testing.

function fmtUsd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "long", day: "numeric",
  });
}

interface TokenRow {
  mark_name: string;
  cost_usd: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  created_at: string;
}

interface PeriodSummary {
  count: number;
  costUsd: number;
  totalTokens: number;
}

function periodSummary(rows: TokenRow[], from: Date): PeriodSummary {
  const filtered = rows.filter(r => new Date(r.created_at) >= from);
  return {
    count: filtered.length,
    costUsd: filtered.reduce((s, r) => s + Number(r.cost_usd), 0),
    totalTokens: filtered.reduce((s, r) => s + Number(r.total_tokens), 0),
  };
}

function buildDigestHtml(
  todayRows: TokenRow[],
  allRows: TokenRow[],
  nowMx: Date,
): string {
  const todayStr = fmtDate(nowMx);

  // Period boundaries (all in Mexico City time via UTC offsets)
  const startOfToday = new Date(nowMx);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
  const startOfYear  = new Date(startOfToday.getFullYear(), 0, 1);

  const day   = periodSummary(allRows, startOfToday);
  const week  = periodSummary(allRows, startOfWeek);
  const month = periodSummary(allRows, startOfMonth);
  const year  = periodSummary(allRows, startOfYear);

  const searchRows = todayRows.length === 0
    ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:#999;font-size:13px">No searches today.</td></tr>`
    : todayRows.map((r, i) => {
        const ts = new Date(r.created_at).toLocaleTimeString("es-MX", {
          timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit",
        });
        const bg = i % 2 === 0 ? "#ffffff" : "#f8f8f5";
        return `<tr style="background:${bg}">
          <td style="padding:9px 14px;font-size:12px;color:#1a2e1a;font-weight:600">${r.mark_name}</td>
          <td style="padding:9px 14px;font-size:12px;color:#555">${ts}</td>
          <td style="padding:9px 14px;font-size:12px;color:#555;text-align:right">${Number(r.total_tokens).toLocaleString()}</td>
          <td style="padding:9px 14px;font-size:12px;color:#1a2e1a;font-weight:700;text-align:right">${fmtUsd(Number(r.cost_usd))}</td>
        </tr>`;
      }).join("");

  const summaryRow = (label: string, s: PeriodSummary) => `
    <tr>
      <td style="padding:9px 16px;font-size:13px;color:#555;font-weight:600">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a2e1a;text-align:right">${s.count}</td>
      <td style="padding:9px 16px;font-size:13px;color:#555;text-align:right">${s.totalTokens.toLocaleString()}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a2e1a;font-weight:700;text-align:right">${fmtUsd(s.costUsd)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Daily Token Digest — ${todayStr}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:32px 16px">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:620px">

  <!-- Header -->
  <tr>
    <td style="background:#1a2e1a;padding:22px 32px">
      <div style="font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase;font-weight:bold;margin-bottom:4px">Mexico Trademark Center — Internal</div>
      <div style="font-size:18px;color:#fff;font-weight:bold">Daily AI Token Digest</div>
      <div style="font-size:12px;color:#9db89d;margin-top:4px">${todayStr} · 10:00 PM Mexico City</div>
    </td>
  </tr>

  <!-- Today's searches -->
  <tr>
    <td style="padding:28px 32px 0">
      <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;font-weight:bold;margin-bottom:14px">Searches Today (${todayRows.length})</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e0;border-radius:8px;overflow:hidden">
        <tr style="background:#f8f8f5">
          <th style="font-size:10px;color:#888;padding:9px 14px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Mark</th>
          <th style="font-size:10px;color:#888;padding:9px 14px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Time (MX)</th>
          <th style="font-size:10px;color:#888;padding:9px 14px;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Tokens</th>
          <th style="font-size:10px;color:#888;padding:9px 14px;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Cost USD</th>
        </tr>
        ${searchRows}
      </table>
    </td>
  </tr>

  <!-- Aggregated summary -->
  <tr>
    <td style="padding:28px 32px 0">
      <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;font-weight:bold;margin-bottom:14px">Aggregated Token Cost</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e0;border-radius:8px;overflow:hidden">
        <tr style="background:#f8f8f5">
          <th style="font-size:10px;color:#888;padding:9px 16px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Period</th>
          <th style="font-size:10px;color:#888;padding:9px 16px;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Searches</th>
          <th style="font-size:10px;color:#888;padding:9px 16px;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Tokens</th>
          <th style="font-size:10px;color:#888;padding:9px 16px;text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Total Cost</th>
        </tr>
        ${summaryRow("Today", day)}
        ${summaryRow("This Week", week)}
        ${summaryRow("This Month", month)}
        ${summaryRow("This Year", year)}
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:28px 32px;border-top:1px solid #e8e8e0;margin-top:28px">
      <p style="font-size:11px;color:#999;margin:0;line-height:1.6">
        Costs are estimated based on published OpenAI pricing (gpt-4o: $0.0025/$0.01 per 1K tokens input/output · gpt-4o-mini: $0.00015/$0.0006).<br>
        Actual billing may differ. This is an automated internal report — Mexico Trademark Center.
      </p>
    </td>
  </tr>

  <tr>
    <td style="background:#1a2e1a;padding:14px 32px;text-align:center">
      <p style="font-size:11px;color:#9db89d;margin:0;font-weight:bold;letter-spacing:1px">MEXICO TRADEMARK CENTER</p>
      <p style="font-size:11px;color:#6a8a6a;margin:4px 0 0">mexicotrademarkcenter.com</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendKey || !supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Current time in Mexico City
    const nowUtc = new Date();
    // Mexico City offset: UTC-6 standard, UTC-5 DST. Use Intl to get the offset.
    const mxDateStr = nowUtc.toLocaleString("en-US", { timeZone: "America/Mexico_City" });
    const nowMx = new Date(mxDateStr);

    // Start of today Mexico City (midnight)
    const startOfTodayMx = new Date(mxDateStr);
    startOfTodayMx.setHours(0, 0, 0, 0);
    // Convert back to UTC for DB query
    const mxOffsetMs = nowUtc.getTime() - nowMx.getTime();
    const startOfTodayUtc = new Date(startOfTodayMx.getTime() + mxOffsetMs);

    // Start of year for the broadest query needed
    const startOfYearMx = new Date(nowMx.getFullYear(), 0, 1);
    const startOfYearUtc = new Date(startOfYearMx.getTime() + mxOffsetMs);

    // Fetch all rows since start of year (covers day/week/month/year aggregation)
    const { data: allRows, error } = await sb
      .from("token_usage_log")
      .select("mark_name, cost_usd, total_tokens, prompt_tokens, completion_tokens, created_at")
      .gte("created_at", startOfYearUtc.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (allRows ?? []) as TokenRow[];

    // Today's rows only (for the per-search table)
    const todayRows = rows.filter(r => new Date(r.created_at) >= startOfTodayUtc);

    const html = buildDigestHtml(todayRows, rows, nowMx);
    const subject = `[MTC] Daily AI Token Digest — ${fmtDate(nowMx)}`;

    const emailPayload = {
      from: "Mexico Trademark Center <tm@mexicotrademarkcenter.com>",
      to: ADMIN_EMAILS,
      cc: ADMIN_CC_EMAILS,
      subject,
      html,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend failed:", resendData);
      return new Response(JSON.stringify({ error: "Email send failed", detail: resendData }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: resendData.id, todaySearches: todayRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("daily-token-digest error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
