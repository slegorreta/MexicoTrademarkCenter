import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TMVIEW_BASE = "https://www.tmdn.org/tmview/tmview/api/v3";

interface TMViewTrademark {
  st13: string;
  name: string;
  applicationNumber: string;
  registrationNumber?: string;
  applicationDate?: string;
  registrationDate?: string;
  expiryDate?: string;
  status: string;
  niceClasses: number[];
  applicant: string;
  type: string;
  territory: string;
  goodsAndServices?: string;
}

interface TMViewResult {
  total: number;
  start: number;
  rows: number;
  trademarks: TMViewTrademark[];
}

interface SearchParams {
  name: string;
  niceClasses?: number[];
  status?: string;
  start?: number;
  rows?: number;
}

// Server-side cache: key → { result, expiresAt }
const serverCache = new Map<string, { result: TMViewResult; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(params: SearchParams): string {
  return JSON.stringify({
    name: (params.name ?? "").toLowerCase().trim(),
    niceClasses: (params.niceClasses ?? []).slice().sort(),
    status: params.status ?? "all",
    start: params.start ?? 0,
    rows: params.rows ?? 50,
  });
}

function mapTrademark(bean: Record<string, unknown>): TMViewTrademark {
  return {
    st13: String(bean.ST13 ?? bean.st13 ?? ""),
    name: String(bean.trademarkName ?? bean.name ?? ""),
    applicationNumber: String(bean.applicationNumber ?? ""),
    registrationNumber: bean.registrationNumber ? String(bean.registrationNumber) : undefined,
    applicationDate: bean.applicationDate ? String(bean.applicationDate) : undefined,
    registrationDate: bean.registrationDate ? String(bean.registrationDate) : undefined,
    expiryDate: bean.expiryDate ? String(bean.expiryDate) : undefined,
    status: String(bean.trademarkStatus ?? bean.status ?? ""),
    niceClasses: Array.isArray(bean.niceClasses)
      ? (bean.niceClasses as unknown[]).map(Number).filter(n => !isNaN(n))
      : [],
    applicant: String(bean.applicantName ?? bean.applicant ?? ""),
    type: String(bean.trademarkType ?? bean.type ?? ""),
    territory: String(bean.territoryCode ?? bean.territory ?? "MX"),
    goodsAndServices: bean.goodsAndServices ? String(bean.goodsAndServices) : undefined,
  };
}

async function fetchTMView(params: SearchParams): Promise<TMViewResult> {
  const key = cacheKey(params);
  const cached = serverCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.result;

  const query = new URLSearchParams({
    dsids: "MX",
    name: params.name.trim(),
    start: String(params.start ?? 0),
    rows: String(Math.min(params.rows ?? 50, 100)),
    lang: "es",
  });

  if (params.niceClasses && params.niceClasses.length > 0) {
    query.set("niceClass", params.niceClasses.join(","));
  }

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const url = `${TMVIEW_BASE}/search?${query.toString()}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1000 * Math.pow(2, attempt - 1));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "MexicoTrademarkCenter/1.0",
        },
        signal: controller.signal,
      });

      if (res.status === 429 || res.status === 503) {
        lastErr = new Error(`TMView rate limited: ${res.status}`);
        continue;
      }

      if (!res.ok) {
        lastErr = new Error(`TMView error: ${res.status}`);
        break;
      }

      const data = await res.json() as Record<string, unknown>;
      const header = (data.header ?? {}) as Record<string, unknown>;
      const beans = Array.isArray(data.trademarkBeans) ? data.trademarkBeans as Record<string, unknown>[] : [];

      const result: TMViewResult = {
        total: Number(header.total ?? 0),
        start: Number(header.start ?? 0),
        rows: Number(header.rows ?? beans.length),
        trademarks: beans.map(mapTrademark),
      };

      serverCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr ?? new Error("TMView fetch failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const params = await req.json() as SearchParams;

    if (!params.name || typeof params.name !== "string" || !params.name.trim()) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await fetchTMView(params);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = message.toLowerCase().includes("abort") || message.toLowerCase().includes("timeout");
    const isRateLimit = message.includes("429");

    return new Response(
      JSON.stringify({
        error: isTimeout
          ? "timeout"
          : isRateLimit
          ? "rate_limited"
          : "fetch_failed",
        message,
        total: 0,
        start: 0,
        rows: 0,
        trademarks: [],
      }),
      {
        status: isRateLimit ? 429 : isTimeout ? 504 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
