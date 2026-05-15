import type { Language } from '../context/LanguageContext';

const SUPPORTED_LANGS: Language[] = ['en', 'zh', 'es', 'de', 'fr', 'hi', 'pt', 'ja'];

const COUNTRY_TO_LANG: Record<string, Language> = {
  // Spanish
  MX: 'es', CO: 'es', AR: 'es', CL: 'es', ES: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', SG: 'zh',
  // German
  DE: 'de', AT: 'de',
  // French
  FR: 'fr', BE: 'fr', MC: 'fr', LU: 'fr', CI: 'fr', SN: 'fr',
  // Hindi
  IN: 'hi',
  // Portuguese
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
  // Japanese
  JP: 'ja',
};

export async function detectLanguageFromIp(): Promise<Language> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return 'en';
    const data = await res.json() as { country_code?: string };
    const code = data.country_code?.toUpperCase() ?? '';
    return COUNTRY_TO_LANG[code] ?? 'en';
  } catch {
    return 'en';
  }
}

export { SUPPORTED_LANGS };
