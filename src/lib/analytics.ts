import { supabase } from './supabase';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface GeoInfo {
  ip: string | null;
  city: string | null;
  country: string | null;
}

export interface DeviceInfo {
  device_type: DeviceType;
  os: string;
  browser: string;
}

// Detects device type from screen width
export function getDeviceType(): DeviceType {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

// Extracts OS and browser from userAgent
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  let os = 'Unknown';
  if (/Windows NT 10/.test(ua)) os = 'Windows 10';
  else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6\.1/.test(ua)) os = 'Windows 7';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X 10_15|Mac OS X 10\.15/.test(ua)) os = 'macOS Catalina+';
  else if (/Macintosh/.test(ua)) os = 'macOS';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';

  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer';

  return { device_type: getDeviceType(), os, browser };
}

// Fetches geo info from ipapi.co (free, no key required)
let geoCache: GeoInfo | null = null;
export async function getGeoInfo(): Promise<GeoInfo> {
  if (geoCache) return geoCache;
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('geo failed');
    const data = await res.json();
    geoCache = {
      ip: data.ip ?? null,
      city: data.city ?? null,
      country: data.country_name ?? null,
    };
  } catch {
    geoCache = { ip: null, city: null, country: null };
  }
  return geoCache!;
}

// Retrieves or creates a session_id scoped to this browser tab
export function getSessionId(): string {
  let sid = sessionStorage.getItem('_mtc_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('_mtc_sid', sid);
  }
  return sid;
}

// Logs a website session row (called once per page view)
export async function logSession(language: string, pagePath: string): Promise<void> {
  try {
    const [geo, device] = await Promise.all([getGeoInfo(), Promise.resolve(getDeviceInfo())]);
    await supabase.from('website_sessions').insert({
      session_id: getSessionId(),
      ip_address: geo.ip,
      city: geo.city,
      country: geo.country,
      device_type: device.device_type,
      os: device.os,
      browser: device.browser,
      page_path: pagePath,
      language,
      referrer: document.referrer || null,
    });
  } catch {
    // Never block the UI
  }
}

// Logs a trademark clearance search
export async function logClearanceSearch(opts: {
  language: string;
  markSearched: string;
  classesSearched: number[];
  resultRisk?: string | null;
}): Promise<void> {
  try {
    const [geo, device] = await Promise.all([getGeoInfo(), Promise.resolve(getDeviceInfo())]);
    await supabase.from('clearance_searches').insert({
      session_id: getSessionId(),
      ip_address: geo.ip,
      city: geo.city,
      country: geo.country,
      device_type: device.device_type,
      os: device.os,
      mark_searched: opts.markSearched,
      classes_searched: opts.classesSearched,
      language: opts.language,
      result_risk: opts.resultRisk ?? null,
    });
  } catch {
    // Never block the UI
  }
}

// Logs a filing event (process_started or payment_completed)
export async function logFilingEvent(opts: {
  event_type: 'process_started' | 'payment_completed';
  language: string;
  application_id?: string | null;
  amount_usd?: number | null;
}): Promise<void> {
  try {
    const [geo, device] = await Promise.all([getGeoInfo(), Promise.resolve(getDeviceInfo())]);
    await supabase.from('filing_events').insert({
      session_id: getSessionId(),
      application_id: opts.application_id ?? null,
      event_type: opts.event_type,
      ip_address: geo.ip,
      city: geo.city,
      country: geo.country,
      device_type: device.device_type,
      os: device.os,
      language: opts.language,
      amount_usd: opts.amount_usd ?? null,
    });
  } catch {
    // Never block the UI
  }
}
