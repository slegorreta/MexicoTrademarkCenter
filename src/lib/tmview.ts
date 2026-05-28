const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface TMViewTrademark {
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

export interface TMViewResult {
  total: number;
  start: number;
  rows: number;
  trademarks: TMViewTrademark[];
}

export interface TMViewSearchParams {
  name: string;
  niceClasses?: number[];
  status?: 'Registered' | 'Filed' | 'Expired' | 'all';
  start?: number;
  rows?: number;
}

// 5-minute client-side cache
const cache = new Map<string, { result: TMViewResult; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(params: TMViewSearchParams): string {
  return JSON.stringify({
    name: params.name.toLowerCase().trim(),
    niceClasses: (params.niceClasses ?? []).slice().sort(),
    status: params.status ?? 'all',
    start: params.start ?? 0,
    rows: params.rows ?? 50,
  });
}

export async function searchTMView(params: TMViewSearchParams): Promise<TMViewResult> {
  const key = cacheKey(params);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.result;

  const result = await fetchWithRetry(params);
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

async function fetchWithRetry(params: TMViewSearchParams, attempt = 0): Promise<TMViewResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/search-tmview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (res.status === 429 || res.status === 503) {
      if (attempt < 2) {
        await sleep(1000 * Math.pow(2, attempt));
        return fetchWithRetry(params, attempt + 1);
      }
    }

    if (!res.ok) throw new Error(`TMView proxy error: ${res.status}`);

    const data = await res.json();
    return data as TMViewResult;
  } catch (err) {
    if (attempt < 2 && !(err instanceof DOMException && err.name === 'AbortError')) {
      await sleep(1000 * Math.pow(2, attempt));
      return fetchWithRetry(params, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function tmviewDetailUrl(st13: string): string {
  return `https://www.tmdn.org/tmview/#!detail/${st13}`;
}

export function tmviewRiskContribution(total: number): {
  label: string;
  labelEs: string;
  points: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  if (total <= 5) return { label: 'Low risk', labelEs: 'Riesgo bajo', points: 20, severity: 'low' };
  if (total <= 20) return { label: 'Medium risk', labelEs: 'Riesgo medio', points: 0, severity: 'medium' };
  if (total <= 50) return { label: 'High risk', labelEs: 'Riesgo alto', points: -15, severity: 'high' };
  return { label: 'Critical risk', labelEs: 'Riesgo crítico', points: -30, severity: 'critical' };
}
