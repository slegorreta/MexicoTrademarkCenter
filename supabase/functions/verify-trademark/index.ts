import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DISCLAIMERS: Record<string, string> = {
  en: "This is an automated preliminary screening only. It does not constitute legal advice or a formal clearance opinion. Always consult a qualified trademark attorney before filing.",
  zh: "这仅是自动初步筛查，不构成法律建议或正式检索意见。在提交申请前，请务必咨询有资质的商标代理人。",
  es: "Esta es únicamente una verificación preliminar automatizada. No constituye asesoría legal ni una opinión formal de disponibilidad. Consulte a un especialista en marcas antes de presentar su solicitud.",
  de: "Dies ist eine automatisierte Vorprüfung. Sie stellt keine Rechtsberatung oder formelle Freistellungsgutachten dar. Konsultieren Sie vor der Anmeldung immer einen qualifizierten Markenanwalt.",
  fr: "Il s'agit d'un dépistage préliminaire automatisé uniquement. Il ne constitue pas un avis juridique ni une opinion formelle de disponibilité. Consultez toujours un avocat spécialisé en marques avant de déposer.",
  hi: "यह केवल एक स्वचालित प्रारंभिक जांच है। यह कानूनी सलाह या औपचारिक क्लीयरेंस राय नहीं है। दाखिल करने से पहले हमेशा एक योग्य ट्रेडमार्क वकील से परामर्श करें।",
  pt: "Esta é apenas uma triagem preliminar automatizada. Não constitui aconselhamento jurídico nem uma opinião formal de disponibilidade. Consulte sempre um advogado especializado em marcas antes de protocolar.",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese (中文)",
  es: "Spanish (Español)",
  de: "German (Deutsch)",
  fr: "French (Français)",
  hi: "Hindi (हिन्दी)",
  pt: "Portuguese (Português)",
  ja: "Japanese (日本語)",
};

// All 8 site languages for translation analysis
const ALL_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "hi", name: "Hindi" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
];

const RELATED_CLASSES: Record<number, number[]> = {
  3: [5, 44], 5: [3, 44], 9: [42, 38], 25: [18, 24, 26], 18: [25],
  24: [25], 26: [25], 35: [42, 36], 36: [35], 38: [9, 42],
  39: [40], 40: [39], 41: [42, 35], 42: [9, 35, 38, 41],
  // Food & beverage cluster — packaged foods, staples, produce, drinks, food service
  29: [30, 31, 32, 43],
  30: [29, 31, 32, 43],
  31: [29, 30],
  32: [29, 30, 43],
  33: [32, 43],
  43: [29, 30, 32, 33], 44: [3, 5],
};

// "component" = a word-part of the applicant's mark conflicts (lower severity than same/related)
type ClassOverlap = "same" | "related" | "component" | "unrelated";

function classifyOverlap(applicantClasses: number[], conflictClassNums: string): ClassOverlap {
  if (!conflictClassNums.trim()) return "unrelated";
  const conflictClasses = conflictClassNums.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (conflictClasses.some(c => applicantClasses.includes(c))) return "same";
  const allRelated = applicantClasses.flatMap(c => RELATED_CLASSES[c] ?? []);
  if (conflictClasses.some(c => allRelated.includes(c))) return "related";
  return "unrelated";
}

function getRelatedClasses(classes: number[]): number[] {
  const related = new Set<number>();
  for (const c of classes) {
    for (const r of RELATED_CLASSES[c] || []) {
      if (!classes.includes(r)) related.add(r);
    }
  }
  return Array.from(related);
}

// Normalize a mark name for fuzzy comparison: lowercase, strip accents, spaces, hyphens, punctuation
function normalizeMark(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s_'".]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Levenshtein distance (capped at maxDist+1 for performance)
function levenshtein(a: string, b: string, maxDist = 3): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? dp[j - 1] : Math.min(dp[j - 1], dp[j], prev) + 1;
      dp[j - 1] = prev;
      prev = val;
    }
    dp[b.length] = prev;
  }
  return dp[b.length];
}

// Returns true when two mark names are likely the same or confusingly similar
function isSimilarName(a: string, b: string): boolean {
  const na = normalizeMark(a);
  const nb = normalizeMark(b);
  if (!na || !nb) return false;
  // Exact normalized match (catches "Wild Roots" == "WildRoots")
  if (na === nb) return true;
  // One is a substring of the other (for compound marks like "WildRootsOrganic" ⊃ "WildRoots")
  if (na.length >= 5 && nb.length >= 5 && (na.includes(nb) || nb.includes(na))) return true;
  // Fuzzy: edit distance ≤ 2 on normalized forms (typos, single-char differences)
  const shorter = Math.min(na.length, nb.length);
  const maxDist = shorter <= 6 ? 1 : 2;
  if (levenshtein(na, nb, maxDist) <= maxDist) return true;
  return false;
}

// Generic filler words that should not be treated as meaningful trademark tokens
const FILLER_WORDS = new Set([
  "de", "la", "el", "los", "las", "del", "un", "una", "the", "and", "for",
  "van", "von", "of", "in", "at", "by", "to", "or", "co", "ltd", "inc", "sa",
]);

// Splits a compound mark into its meaningful word-components.
// "WildRoots"        → ["Wild", "Roots"]
// "Wild Roots"       → ["Wild", "Roots"]
// "Wild-Roots"       → ["Wild", "Roots"]
// "BioTechPro"       → ["Bio", "Tech", "Pro"]
// "Wild Roots Organic 100" → ["Wild", "Roots", "Organic"]
function getMarkTokens(markName: string): string[] {
  // 1. Split on whitespace and hyphens/underscores
  let parts = markName.split(/[\s\-_]+/);
  // 2. Within each part, split CamelCase (e.g. "WildRoots" → ["Wild","Roots"])
  parts = parts.flatMap(p => p.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/));
  // 3. Strip punctuation, accents, digits from each token
  const tokens = parts
    .map(t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").toLowerCase())
    .filter(t => t.length >= 3 && !FILLER_WORDS.has(t));
  // 4. Deduplicate while preserving order
  return Array.from(new Set(tokens));
}

// Returns true when a registry finding name shares a meaningful word-component
// with the applicant's mark (or vice-versa).
// This catches: "WildRoots" applicant vs. "Wild Organic" or "Roots Natural Foods" registrant.
function isComponentConflict(markName: string, findingName: string): boolean {
  const applicantTokens = getMarkTokens(markName);
  const findingTokens = getMarkTokens(findingName);
  if (applicantTokens.length === 0 || findingTokens.length === 0) return false;
  // Only flag when the applicant mark has >1 token (single-word marks handled by isSimilarName)
  if (applicantTokens.length < 2 && findingTokens.length < 2) return false;
  for (const at of applicantTokens) {
    for (const ft of findingTokens) {
      // Exact token match (e.g. "wild" == "wild")
      if (at === ft && at.length >= 4) return true;
      // Near-identical token (edit distance ≤ 1 for tokens ≥ 5 chars)
      if (at.length >= 5 && ft.length >= 5 && levenshtein(at, ft, 1) <= 1) return true;
    }
  }
  return false;
}

function toDomainSlug(name: string): string {
  return normalizeMark(name);
}

interface DomainResult {
  domain: string;
  available: boolean | null;
  status: "available" | "taken" | "unknown";
}

async function checkDomains(markName: string): Promise<DomainResult[]> {
  const slug = toDomainSlug(markName);
  if (!slug) return [];

  const tlds = [".com", ".com.mx", ".mx", ".net", ".org", ".org.mx", ".ai", ".io", ".xyz", ".shop", ".store", ".app", ".dev"];
  const results: DomainResult[] = [];

  await Promise.all(
    tlds.map(async (tld) => {
      const domain = `${slug}${tld}`;
      try {
        const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`;
        const res = await fetch(url, {
          headers: { Accept: "application/dns-json" },
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) { results.push({ domain, available: null, status: "unknown" }); return; }
        const data = await res.json();
        const nxdomain = data.Status === 3;
        const hasAnswers = Array.isArray(data.Answer) && data.Answer.length > 0;
        if (nxdomain) {
          results.push({ domain, available: true, status: "available" });
        } else if (hasAnswers) {
          results.push({ domain, available: false, status: "taken" });
        } else {
          results.push({ domain, available: false, status: "taken" });
        }
      } catch {
        results.push({ domain, available: null, status: "unknown" });
      }
    })
  );

  const order = tlds.map(t => `${slug}${t}`);
  results.sort((a, b) => order.indexOf(a.domain) - order.indexOf(b.domain));
  return results;
}

// Executes a single MARCia quick search and returns raw result items
async function runMarciaQuery(
  BASE: string,
  apiHeaders: Record<string, string>,
  query: string,
  allClasses: number[],
): Promise<{ items: Record<string, unknown>[]; totalCount: number }> {
  const recordRes = await fetch(`${BASE}/search/internal/record`, {
    method: "POST",
    headers: apiHeaders,
    body: JSON.stringify({ _type: "Search$Quick", query: query.trim(), images: [] }),
    signal: AbortSignal.timeout(12000),
  });
  if (!recordRes.ok) return { items: [], totalCount: 0 };

  const record = await recordRes.json();
  const searchId: string = record.id;
  const totalCount: number = record.count ?? 0;
  if (!searchId) return { items: [], totalCount: 0 };

  const resultRes = await fetch(`${BASE}/search/internal/result`, {
    method: "POST",
    headers: apiHeaders,
    body: JSON.stringify({ searchId, pageSize: 20, pageNumber: 0, statusFilter: [], viennaCodeFilter: [], niceClassFilter: allClasses.length > 0 ? allClasses : [] }),
    signal: AbortSignal.timeout(12000),
  });
  if (!resultRes.ok) return { items: [], totalCount };

  const resultData = await resultRes.json();
  return { items: resultData.resultPage ?? [], totalCount };
}

async function searchMarcia(markName: string, classes: number[]): Promise<{
  findings: Array<{ name: string; status: string; classNum: string; holder: string; classOverlap: ClassOverlap; imageUrl?: string; goodsServices?: string; expediente?: string; registrationNumber?: string; filingDate?: string; registrationDate?: string; expiryDate?: string }>;
  marciaUrl: string;
  totalCount: number;
}> {
  const BASE = "https://marcia.impi.gob.mx/marcas";
  const encoded = encodeURIComponent(markName);
  const marciaUrl = `${BASE}/search/quick?query=${encoded}`;

  try {
    const initRes = await fetch(`${BASE}/search/quick`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!initRes.ok) { return { findings: [], marciaUrl, totalCount: 0 }; }

    const setCookieHeaders: string[] = [];
    initRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") setCookieHeaders.push(value);
    });

    const cookieMap: Record<string, string> = {};
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      const eqIdx = pair.indexOf("=");
      if (eqIdx > -1) {
        cookieMap[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim();
      }
    }

    const html = await initRes.text();
    const metaCsrf = html.match(/name=["']_csrf["'][^>]*content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/content=["']([^"']+)["'][^>]*name=["']_csrf["']/i)?.[1]
      ?? "";
    const xsrfToken = cookieMap["XSRF-TOKEN"] ?? metaCsrf;
    const cookieString = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join("; ");

    const apiHeaders: Record<string, string> = {
      "Content-Type": "application/json;charset=UTF-8",
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": `${BASE}/search/quick`,
      "Origin": "https://marcia.impi.gob.mx",
    };
    if (cookieString) apiHeaders["Cookie"] = cookieString;
    if (xsrfToken) apiHeaders["X-XSRF-TOKEN"] = xsrfToken;

    const allClasses = classes.length > 0 ? [...classes, ...getRelatedClasses(classes)] : [];

    // Build a deduplicated set of query strings:
    // 1. Original mark name (e.g. "Wild Roots")
    // 2. Normalized no-space slug (e.g. "wildroots") — catches different spacing conventions
    // 3. Individual meaningful tokens (e.g. "wild", "roots") — catches partial-word conflicts
    const normalized = normalizeMark(markName);
    const queries = [markName.trim()];
    if (normalized && !queries.map(normalizeMark).includes(normalized)) {
      queries.push(normalized);
    }
    // Add per-token queries for compound marks (tokens ≥ 4 chars to avoid noise)
    const tokens = getMarkTokens(markName).filter(t => t.length >= 4);
    for (const token of tokens) {
      if (!queries.map(normalizeMark).includes(normalizeMark(token))) {
        queries.push(token);
      }
    }

    // Run all queries sequentially (session/cookies are shared)
    const allItems: Record<string, unknown>[] = [];
    let maxTotal = 0;
    for (const q of queries) {
      const { items, totalCount } = await runMarciaQuery(BASE, apiHeaders, q, allClasses);
      maxTotal = Math.max(maxTotal, totalCount);
      for (const item of items) {
        // Deduplicate by title
        const title = String(item.title ?? "");
        if (title && !allItems.some(x => String(x.title ?? "") === title)) {
          allItems.push(item);
        }
      }
    }

    const findings = allItems.slice(0, 25).map((item) => {
      const classNums: number[] = Array.isArray(item.classes) ? (item.classes as number[]) : [];
      const classNum = classNums.length > 0 ? classNums.join(", ") : "";
      const name = String(item.title ?? "");
      const baseOverlap = classifyOverlap(classes, classNum);
      // Component conflicts are only meaningful when the finding is in the same or related class.
      // "unrelated" class + component token match = too weak to flag.
      const classOverlap: ClassOverlap =
        baseOverlap === "unrelated" && isComponentConflict(markName, name)
          ? "component"
          : baseOverlap;

      // imageUrl: MARCia returns a relative path like "/marcas/image/..." or a full URL
      const rawImageUrl = typeof item.imageUrl === "string" ? item.imageUrl
        : typeof item.image === "string" ? item.image
        : typeof item.logo === "string" ? item.logo
        : "";
      const imageUrl = rawImageUrl
        ? (rawImageUrl.startsWith("http") ? rawImageUrl : `https://marcia.impi.gob.mx${rawImageUrl.startsWith("/") ? "" : "/"}${rawImageUrl}`)
        : undefined;

      // goods/services description — MARCia may return as products, goodsServices, description, or productos
      const goodsServices = typeof item.products === "string" ? item.products
        : typeof item.goodsServices === "string" ? item.goodsServices
        : typeof item.description === "string" ? item.description
        : typeof item.productos === "string" ? item.productos
        : undefined;

      // Expediente (application number) — MARCia may use expediente, applicationNumber, folio, solicitud
      const expediente = typeof item.expediente === "string" ? item.expediente
        : typeof item.applicationNumber === "string" ? item.applicationNumber
        : typeof item.folio === "string" ? item.folio
        : typeof item.solicitud === "string" ? item.solicitud
        : typeof item.id === "string" ? item.id
        : undefined;

      // Registration number
      const registrationNumber = typeof item.registrationNumber === "string" ? item.registrationNumber
        : typeof item.registro === "string" ? item.registro
        : typeof item.certificado === "string" ? item.certificado
        : undefined;

      // Dates — MARCia may use various field names
      const filingDate = typeof item.filingDate === "string" ? item.filingDate
        : typeof item.applicationDate === "string" ? item.applicationDate
        : typeof item.fechaSolicitud === "string" ? item.fechaSolicitud
        : typeof item.presentacion === "string" ? item.presentacion
        : undefined;

      const registrationDate = typeof item.registrationDate === "string" ? item.registrationDate
        : typeof item.fechaRegistro === "string" ? item.fechaRegistro
        : typeof item.registro_fecha === "string" ? item.registro_fecha
        : undefined;

      const expiryDate = typeof item.expiryDate === "string" ? item.expiryDate
        : typeof item.expirationDate === "string" ? item.expirationDate
        : typeof item.fechaVencimiento === "string" ? item.fechaVencimiento
        : typeof item.vigencia === "string" ? item.vigencia
        : undefined;

      return {
        name,
        status: String(item.status ?? ""),
        classNum,
        holder: Array.isArray(item.owners) ? (item.owners as string[]).join(", ") : String(item.owners ?? ""),
        classOverlap,
        imageUrl,
        goodsServices,
        expediente,
        registrationNumber,
        filingDate,
        registrationDate,
        expiryDate,
      };
    }).filter(f => f.name);

    return { findings, marciaUrl, totalCount: maxTotal };
  } catch (err) {
    console.error("MARCia fetch error:", err);
    return { findings: [], marciaUrl, totalCount: 0 };
  }
}

interface RegistrabilityFlag {
  category: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  explanation_en?: string;
  explanation_user?: string;
}

interface DupontFactor {
  factor: string;
  verdict: "favors_registration" | "neutral" | "against_registration";
  reasoning: string;
  reasoning_en?: string;
  reasoning_user?: string;
}

interface DistinctivenessAssessment {
  tier: "generic" | "descriptive" | "suggestive" | "arbitrary" | "fanciful";
  score: number;
  explanation: string;
  explanation_en?: string;
  explanation_user?: string;
}

interface ElementDecomposition {
  element: string;
  distinctivenessTier: "generic" | "descriptive" | "suggestive" | "arbitrary" | "fanciful";
  role: "dominant" | "secondary" | "descriptive_modifier" | "filler";
  note?: string;
}

export interface TranslationFlag {
  languageCode: string;
  languageName: string;
  translatedForm: string;
  romanization?: string;
  risk: "none" | "low" | "medium" | "high";
  issueCategory: string | null;
  details: string;
  details_en: string;
}

async function analyzeRegistrability(
  apiKey: string,
  markName: string,
  classes: number[],
  goodsServices: string,
  language: string,
  conflictingClassNums: string[],
  similarConflictNames: Array<{ name: string; classNum: string; classOverlap: ClassOverlap }>,
  componentConflicts: Array<{ name: string; classNum: string; classOverlap: ClassOverlap }>,
): Promise<{
  flags: RegistrabilityFlag[];
  risk: "low" | "medium" | "high";
  riskColor: "VERDE" | "AMARILLO" | "NARANJA" | "ROJO";
  dupont: DupontFactor[];
  distinctiveness: DistinctivenessAssessment;
  elementDecomposition: ElementDecomposition[];
  riskSummary: string;
  riskSummary_en: string;
}> {
  const classContext = classes.length > 0
    ? ` solicitada para productos/servicios en la(s) clase(s) ${classes.join(", ")} de la Clasificación Niza`
    : "";
  const goodsContext = goodsServices
    ? ` que comprende los siguientes productos/servicios: "${goodsServices}"`
    : "";

  const langName = LANGUAGE_NAMES[language] ?? "English";
  const isUserLang = language !== "es";
  const isEnglish = language === "en";

  const similarNamesContext = (() => {
    const parts: string[] = [];
    if (similarConflictNames.length > 0) {
      const sameClass = similarConflictNames.filter(f => f.classOverlap === "same");
      const relatedClass = similarConflictNames.filter(f => f.classOverlap === "related");
      if (sameClass.length > 0) {
        parts.push(`MARCAS CONFUSAMENTE SIMILARES EN LA MISMA CLASE: Se encontraron ${sameClass.length} marca(s) con nombre visualmente/fonéticamente similar a "${markName}" registradas en la MISMA clase Niza (${classes.join(", ")}): ${sameClass.map(f => `"${f.name}" (clase ${f.classNum})`).join(", ")}. INSTRUCCIÓN CRÍTICA: Esto constituye un conflicto directo bajo LFPPI Art. 173 Fr. VIII. El factor DuPont "similarity_of_marks" DEBE calificarse como "against_registration" y el riskColor DEBE ser "ROJO".`);
      }
      if (relatedClass.length > 0) {
        parts.push(`MARCAS SIMILARES EN CLASES RELACIONADAS: ${relatedClass.map(f => `"${f.name}" (clase ${f.classNum})`).join(", ")}. Evalúa el riesgo de confusión teniendo en cuenta la proximidad comercial entre estas clases y la del solicitante (${classes.join(", ")}).`);
      }
    }
    if (componentConflicts.length > 0) {
      const tokens = getMarkTokens(markName);
      parts.push(
        `CONFLICTOS POR PALABRAS COMPONENTES: La marca "${markName}" está formada por las palabras: [${tokens.join(", ")}]. ` +
        `Se encontraron ${componentConflicts.length} marca(s) en el registro IMPI que coinciden con una o más de estas palabras individuales en clases iguales o relacionadas: ` +
        componentConflicts.map(f => `"${f.name}" (clase ${f.classNum})`).join(", ") +
        `. INSTRUCCIÓN CRÍTICA: Bajo la doctrina de marcas compuestas (LFPPI Art. 173 Fr. VIII y jurisprudencia IMPI), el registro de un componente dominante de la marca solicitada puede generar riesgo de confusión aunque la marca completa no coincida exactamente. ` +
        `Evalúa: (1) si alguna de estas palabras es el elemento dominante o más distintivo de "${markName}"; ` +
        `(2) si los consumidores podrían abreviar la marca a esa palabra (p.ej. llamar "WildRoots" simplemente "Wild" o "Roots"); ` +
        `(3) refleja este análisis en los factores DuPont "similarity_of_marks" y "number_of_similar_marks".`
      );
    }
    return parts.length > 0 ? `\n\n${parts.join("\n")}` : "";
  })();

  const conflictClassContext = conflictingClassNums.length > 0
    ? `\n\nCONTEXTO DE CLASES EN CONFLICTO: Se encontraron marcas existentes en el registro IMPI con las siguientes clases Niza: ${conflictingClassNums.join("; ")}. El solicitante busca registro en la(s) clase(s) ${classes.join(", ")}. INSTRUCCIÓN CRÍTICA: Al evaluar el factor DuPont "relatedness_of_goods", DEBES comparar explícitamente estos números de clase. Si las marcas en conflicto están en clases completamente diferentes sin superposición económica o comercial con la(s) clase(s) del solicitante, DEBES calificar "relatedness_of_goods" como "favors_registration" y explicar claramente la distinción de clases. NO asumas relación solo porque las marcas comparten un nombre — la separación de clases es una protección legal clave bajo la LFPPI.${similarNamesContext}`
    : similarNamesContext ? `\n\n${similarNamesContext.trim()}` : "";

  const userLangInstruction = isUserLang
    ? `\n\nREQUISITO DE TRADUCCIÓN: Para cada campo de texto libre, proporciona TRES versiones:
- El campo principal (p.ej. "explanation", "reasoning") en ESPAÑOL — idioma canónico del análisis legal mexicano.
- Un campo "_en" (p.ej. "explanation_en", "reasoning_en") con la misma información traducida al inglés.
- Un campo "_user" (p.ej. "explanation_user", "reasoning_user") con la misma información traducida al ${langName}. Cuando uses terminología legal española que no tenga traducción directa (p.ej. "distintividad adquirida", "signos genéricos", "LFPPI"), mantenla en español dentro del texto del idioma ${langName} seguida de una breve aclaración entre paréntesis.
Los tres campos son obligatorios.`
    : isEnglish
    ? `\n\nREQUISITO DE TRADUCCIÓN: Para cada campo de texto libre, proporciona DOS versiones:
- El campo principal (p.ej. "explanation", "reasoning") en ESPAÑOL.
- Un campo "_en" (p.ej. "explanation_en", "reasoning_en") en inglés.`
    : "";

  const prompt = `Eres un abogado experto en marcas mexicanas. Analiza la marca propuesta "${markName}"${classContext}${goodsContext}.${conflictClassContext}${userLangInstruction}

INSTRUCCIÓN FUNDAMENTAL: Todo tu razonamiento jurídico debe realizarse en español, ya que el registro se tramitará ante el IMPI bajo la Ley Federal de Protección a la Propiedad Industrial (LFPPI). Devuelve ÚNICAMENTE JSON válido, sin markdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO OBLIGATORIO PREVIO — ANÁLISIS SEMÁNTICO
Antes de clasificar nada, responde internamente:
1. ¿Qué significa literalmente la marca "${markName}" en español? Si está en otro idioma, ¿cuál es su traducción al español y qué connota?
2. ¿Qué relación semántica tiene ese significado con los productos/servicios solicitados en la clase indicada?
3. ¿Quién es el consumidor típico de esos productos/servicios? (p.ej. consumidor general, comprador industrial especializado, profesional de salud)
Este análisis semántico informará directamente la clasificación de distintividad y los motivos absolutos.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTE 1 — ÁRBOL DE DECISIÓN DE DISTINTIVIDAD (LFPPI Art. 173)
Aplica este árbol en orden secuencial y detente en el primer nivel que aplique:

NIVEL A — GENÉRICO (Art. 173 Fr. I LFPPI)
Pregunta: ¿Constituye la marca el nombre común o usual del propio producto o servicio en la clase solicitada? ¿Lo usaría cualquier competidor para denominar su producto sin apellido adicional?
→ Si SÍ: tier="generic", score=1, flag category="generic", severity="high", riskColor="ROJO"
→ Si NO: continúa al Nivel B

NIVEL B — DESCRIPTIVO (Art. 173 Fr. II LFPPI) — PRUEBA DE INMEDIATEZ
Pregunta: ¿Cuando el consumidor típico de la clase encuentra la marca, le comunica DIRECTA e INMEDIATAMENTE (sin esfuerzo mental ni paso intermedio) una característica, calidad, cantidad, finalidad, valor u origen geográfico de los productos concretos de la clase?
CRITERIO CLAVE: Si se requiere imaginación, razonamiento o percepción adicional para conectar la marca con los productos, NO es descriptiva.
EJEMPLO CORRECTO: "CREMOSO" para quesos de la clase 29 → descriptivo (comunica inmediatamente la textura).
EJEMPLO INCORRECTO como descriptivo: "GALLO AZUL" para productos químicos de la clase 1 → NO describe ningún atributo de los químicos; es una combinación de palabras ordinarias sin conexión semántica con la clase → es ARBITRARIA.
→ Si SÍ (inmediato y directo): tier="descriptive", score=2, flag category="descriptive", severity="medium", riskColor="NARANJA"
→ Si NO: continúa al Nivel C

NIVEL C — SUGESTIVO
Pregunta: ¿Requiere la marca imaginación, reflexión o percepción para evocar una cualidad de los productos, sin describirla directamente?
→ Si SÍ: tier="suggestive", score=3, sin flag de motivo absoluto, riskColor="AMARILLO"
→ Si NO: continúa al Nivel D

NIVEL D — ARBITRARIO
Pregunta: ¿Es la marca una palabra o combinación de palabras con significado conocido en algún idioma, aplicada a productos de la clase solicitada con los que NO guarda relación semántica alguna (como APPLE para computadoras, o GALLO AZUL para productos químicos)?
→ Si SÍ: tier="arbitrary", score=4, sin flag de motivo absoluto, riskColor="VERDE"
→ Si NO: continúa al Nivel E

NIVEL E — FANTASÍA/FANCIFUL
Pregunta: ¿Es la marca un término inventado sin significado en ningún idioma?
→ Si SÍ: tier="fanciful", score=5, sin flag de motivo absoluto, riskColor="VERDE"

PARTE 2 — MOTIVOS ABSOLUTOS APLICABLES (LFPPI Art. 173)
Solo incluye flags que genuinamente apliquen. Categorías disponibles:
"generic" (Fr. I), "descriptive" (Fr. II), "functional_shape" (Fr. IV), "deceptive" (Fr. V),
"official_emblems" (Fr. VI), "personal_identity" (Fr. VII), "confusingly_similar" (Fr. VIII),
"famous_mark" (Fr. IX), "protected_characters" (Fr. X), "geographic_indication" (Fr. XI),
"immoral_offensive" (Fr. XII), "isolated_color" (Fr. XIII), "non_distinctive_nontrad" (Fr. XIV), "bad_faith" (Fr. XV)
NOTA: "generic" y "descriptive" son categorías independientes; nunca las combines.

PARTE 3 — PERFIL DEL CONSUMIDOR Y CAMPO SATURADO
- Identifica el perfil del consumidor típico para la clase solicitada y su nivel de atención (alto=comprador industrial/profesional; medio=consumidor general; bajo=compra impulsiva).
- Si hay múltiples marcas similares en la misma clase (campo saturado), la protección de cada marca individual es más estrecha (doctrina del campo saturado, LFPPI Art. 173 Fr. VIII interpretado sistemáticamente). Refléjalo en el factor DuPont "number_of_similar_marks".

PARTE 4 — LOS 13 FACTORES DUPONT
Nombres de factores (usar exactamente):
"similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
"strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
"variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors"
Veredicto por factor: "favors_registration" | "neutral" | "against_registration"
IMPORTANTE: "purchasing_conditions" debe reflejar el nivel de atención del consumidor típico identificado en la Parte 3.

PARTE 5 — COLOR DE RIESGO PLAYBOOK
Asigna riskColor según la combinación de distintividad + conflictos encontrados:
- "VERDE": marca arbitraria o de fantasía, sin conflictos directos en la misma clase
- "AMARILLO": marca sugestiva, o arbitraria/fantasía con conflictos en clases relacionadas
- "NARANJA": marca descriptiva sin distintividad adquirida demostrada, o sugestiva con conflictos directos
- "ROJO": marca genérica, o cualquier marca con conflicto exacto en la misma clase
Si hay conflictos graves (marcas idénticas en la misma clase), escala el riskColor a "ROJO" independientemente de la distintividad.

PARTE 6 — DESCOMPOSICIÓN DE ELEMENTOS DE LA MARCA
Descompone la marca "${markName}" en sus elementos constitutivos (palabras, prefijos, sufijos, términos):
- Para cada elemento indica: su rol ("dominant" = elemento más recordado/protegible, "secondary" = elemento de apoyo, "descriptive_modifier" = describe productos, "filler" = partícula sin valor distintivo).
- Indica el tier de distintividad de ese elemento individual (puede diferir del tier global).
- Proporciona una nota breve (máximo 1 oración) explicando el rol del elemento.
Si la marca es una sola palabra sin partes discernibles, devuelve un solo elemento con la marca completa.

Devuelve exactamente:
{
  "flags": [{"category": "...", "severity": "low"|"medium"|"high", "explanation": "...(en español)"${isUserLang ? ', "explanation_en": "...", "explanation_user": "..."' : isEnglish ? ', "explanation_en": "..."' : ""}}],
  "risk": "low"|"medium"|"high",
  "riskColor": "VERDE"|"AMARILLO"|"NARANJA"|"ROJO",
  "distinctiveness": {"tier": "...", "score": 1-5, "explanation": "...(en español)"${isUserLang ? ', "explanation_en": "...", "explanation_user": "..."' : isEnglish ? ', "explanation_en": "..."' : ""}},
  "dupont": [{"factor": "...", "verdict": "...", "reasoning": "...(en español)"${isUserLang ? ', "reasoning_en": "...", "reasoning_user": "..."' : isEnglish ? ', "reasoning_en": "..."' : ""}}],
  "elementDecomposition": [{"element": "...", "distinctivenessTier": "generic"|"descriptive"|"suggestive"|"arbitrary"|"fanciful", "role": "dominant"|"secondary"|"descriptive_modifier"|"filler", "note": "..."}],
  "riskSummary": "...(en español)"${isUserLang ? ',\n  "riskSummary_en": "...",\n  "riskSummary_user": "..."' : isEnglish ? ',\n  "riskSummary_en": "..."' : ""}
}`;

  const defaultDistinctiveness: DistinctivenessAssessment = { tier: "arbitrary", score: 4, explanation: "", explanation_en: "", explanation_user: "" };
  const defaultDupont: DupontFactor[] = [
    "similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
    "strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
    "variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors"
  ].map(factor => ({ factor, verdict: "neutral" as const, reasoning: "", reasoning_en: "", reasoning_user: "" }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Eres un experto en derecho de marcas mexicano. Devuelve únicamente JSON válido sin markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: isUserLang ? 7000 : 5000,
        response_format: { type: "json_object" },
      }),
    });

    const defaultReturn = { flags: [] as RegistrabilityFlag[], risk: "low" as const, riskColor: "VERDE" as const, dupont: defaultDupont, distinctiveness: defaultDistinctiveness, elementDecomposition: [] as ElementDecomposition[], riskSummary: "", riskSummary_en: "" };

    if (!response.ok) return defaultReturn;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return defaultReturn;

    const parsed = JSON.parse(content);
    const flags: RegistrabilityFlag[] = (parsed.flags ?? []).filter(
      (f: Record<string, unknown>) => f.category && f.severity && f.explanation
    );
    const risk: "low" | "medium" | "high" = parsed.risk ?? (flags.length > 0 ? "medium" : "low");
    const riskColor: "VERDE" | "AMARILLO" | "NARANJA" | "ROJO" = (
      ["VERDE", "AMARILLO", "NARANJA", "ROJO"].includes(parsed.riskColor) ? parsed.riskColor : "VERDE"
    ) as "VERDE" | "AMARILLO" | "NARANJA" | "ROJO";
    const dupont: DupontFactor[] = (parsed.dupont ?? defaultDupont).filter(
      (f: Record<string, unknown>) => f.factor && f.verdict && f.reasoning
    );
    const rawD = parsed.distinctiveness ?? {};
    const distinctiveness: DistinctivenessAssessment = {
      tier: rawD.tier ?? "arbitrary",
      score: typeof rawD.score === "number" ? rawD.score : 4,
      explanation: rawD.explanation ?? "",
      explanation_en: rawD.explanation_en ?? rawD.explanation ?? "",
      explanation_user: rawD.explanation_user ?? rawD.explanation_en ?? rawD.explanation ?? "",
    };
    const validRoles = new Set(["dominant", "secondary", "descriptive_modifier", "filler"]);
    const validTiers = new Set(["generic", "descriptive", "suggestive", "arbitrary", "fanciful"]);
    const elementDecomposition: ElementDecomposition[] = (parsed.elementDecomposition ?? [])
      .filter((e: Record<string, unknown>) => e.element && validRoles.has(e.role as string) && validTiers.has(e.distinctivenessTier as string))
      .map((e: Record<string, unknown>) => ({
        element: String(e.element),
        distinctivenessTier: e.distinctivenessTier as ElementDecomposition["distinctivenessTier"],
        role: e.role as ElementDecomposition["role"],
        note: typeof e.note === "string" ? e.note : undefined,
      }));
    return {
      flags,
      risk,
      riskColor,
      dupont,
      distinctiveness,
      elementDecomposition,
      riskSummary: parsed.riskSummary ?? "",
      riskSummary_en: parsed.riskSummary_en ?? parsed.riskSummary ?? "",
    };
  } catch (err) {
    console.error("Registrability analysis error:", err);
    return { flags: [] as RegistrabilityFlag[], risk: "low" as const, riskColor: "VERDE" as const, dupont: defaultDupont, distinctiveness: defaultDistinctiveness, elementDecomposition: [] as ElementDecomposition[], riskSummary: "", riskSummary_en: "" };
  }
}

async function analyzeTranslations(
  apiKey: string,
  markName: string,
  classes: number[],
  goodsServices: string,
  searchLanguage: string,
): Promise<TranslationFlag[]> {
  const classContext = classes.length > 0
    ? ` for goods/services in Nice Classification class(es) ${classes.join(", ")}`
    : "";
  const goodsContext = goodsServices ? ` covering: "${goodsServices}"` : "";
  const langList = ALL_LANGUAGES.map(l => `${l.name} (${l.code})`).join(", ");

  const prompt = `You are an expert Mexican trademark attorney and linguistics specialist.

The proposed trademark is: "${markName}"${classContext}${goodsContext}.
The user's search language is: ${LANGUAGE_NAMES[searchLanguage] ?? "English"}.

TASK: Analyze the trademark name for cross-language trademark risks by checking its translations and transliterations.

For EACH of these 8 languages: ${langList}

1. Determine the translation or transliteration of "${markName}" into that language.
   - For languages that use non-Latin scripts (Chinese, Hindi, Japanese), provide the script form AND a Latin romanization.
   - If the mark is already in a non-Latin script, provide transliteration to Latin and to other non-Latin scripts.
   - If the mark is a proper noun or invented word with no direct translation, note what it means or evokes phonetically in that language.

2. For each translation/transliteration, assess:
   a. Does this translated/transliterated form conflict with any known trademark (registered or famous) in any jurisdiction?
   b. Does this form trigger any LFPPI absolute grounds in that language context? (e.g. is it generic, descriptive, deceptive, immoral, or offensive in that language?)
   c. Could the phonetic sound of the mark, when heard by a ${LANGUAGE_NAMES[searchLanguage] ?? "English"}-speaker, be confused with a word that has problematic trademark implications?

3. Assign risk:
   - "none": No trademark issues in this language
   - "low": Minor phonetic similarity or very weak risk
   - "medium": Meaningful similarity to existing mark or LFPPI concern
   - "high": Direct conflict with a known trademark or clear LFPPI violation in this language

Return a JSON array. For each language, include an entry even if risk is "none":
[
  {
    "languageCode": "es",
    "languageName": "Spanish",
    "translatedForm": "translated or transliterated form here",
    "romanization": "Latin-script romanization (only for non-Latin script languages like Chinese, Hindi, Japanese; omit or set null for Latin-script languages)",
    "risk": "none"|"low"|"medium"|"high",
    "issueCategory": null or one of: "confusingly_similar"|"generic_descriptive"|"deceptive"|"immoral_offensive"|"famous_mark"|"phonetic_conflict"|"geographic_indication",
    "details": "Explanation in ${LANGUAGE_NAMES[searchLanguage] ?? "English"} of what the translation means and what risk was found (2-3 sentences)",
    "details_en": "Same explanation always in English (2-3 sentences)"
  },
  ...
]

Be thorough and specific. If "${markName}" is already in English and has no meaningful translation (e.g. a made-up word), still check what it sounds like or evokes in each language. Return exactly 8 entries, one per language.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a trademark law and linguistics expert. Return only a valid JSON array, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    // Model may return { translations: [...] } or just [...]
    const arr: unknown[] = Array.isArray(parsed) ? parsed : (parsed.translations ?? parsed.results ?? []);
    return arr
      .filter((e): e is TranslationFlag =>
        typeof e === "object" && e !== null &&
        "languageCode" in e && "translatedForm" in e && "risk" in e && "details" in e
      )
      .map((e) => ({
        ...e,
        romanization: (e as Record<string, unknown>).romanization
          ? String((e as Record<string, unknown>).romanization)
          : undefined,
      }));
  } catch (err) {
    console.error("Translation analysis error:", err);
    return [];
  }
}

async function searchWeb(apiKey: string, markName: string, classes: number[], goodsServices: string, language: string): Promise<{
  findings: string[];
  risk: "low" | "medium" | "high";
}> {
  const classContext = classes.length > 0 ? ` in Nice Classification class(es) ${classes.join(", ")}` : "";
  const goodsContext = goodsServices ? ` for: ${goodsServices}` : "";
  const langName = LANGUAGE_NAMES[language] ?? "English";
  const langInstruction = language !== "en" ? ` Write all findings strings in ${langName}.` : "";

  // Build a list of spelling/spacing variants to explicitly probe
  const normalized = normalizeMark(markName);
  const variants = [markName];
  if (normalized !== markName.toLowerCase()) variants.push(normalized);
  // Also add a spaced version if the original appears to be CamelCase or concatenated
  const spacedFromCamel = markName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  if (spacedFromCamel !== markName && !variants.includes(spacedFromCamel)) variants.push(spacedFromCamel);
  const variantNote = variants.length > 1
    ? ` Also check these spelling/spacing variants of the same mark: ${variants.slice(1).map(v => `"${v}"`).join(", ")}.`
    : "";

  // Component tokens for partial-word conflict check
  const tokens = getMarkTokens(markName).filter(t => t.length >= 4);
  const tokenNote = tokens.length > 1
    ? ` Additionally, check whether any of the individual component words — ${tokens.map(t => `"${t}"`).join(", ")} — are independently registered as trademarks in the same or related Nice classes. Under Mexican trademark law (LFPPI Art. 173 Fr. VIII), a registered mark that matches a dominant word-component of the applied mark can block registration of the compound mark.`
    : "";

  const prompt = `Search the web for existing trademark registrations, brand names, or companies named "${markName}"${classContext}${goodsContext}.${variantNote}${tokenNote}${langInstruction}

IMPORTANT: Consider ALL of the following when assessing conflicts:
1. Exact name matches (e.g. "WildRoots" and "Wild Roots" are the same mark — spacing/hyphens do NOT distinguish trademarks).
2. Phonetically identical or near-identical marks (e.g. "WildRoots" vs "Wild Roots" vs "Wild-Roots").
3. Component-word conflicts: if the mark is compound (e.g. "WildRoots"), flag any existing marks that consist of just one of its words (e.g. "Wild" or "Roots") in the same or commercially related classes.
4. Marks registered in the SAME Nice class AND in commercially related classes (e.g. if applying in class 29, also flag conflicts in classes 30, 31, 32, 43).
5. International registrations at IMPI (Mexico), USPTO (US), EUIPO (EU), and WIPO that cover Mexico.

Return JSON: { "risk": "low"|"medium"|"high", "findings": ["finding 1", ...], "reasoning": "..." }
Risk levels:
- "high": exact or near-identical match in the same or a commercially related Nice class, OR a dominant component word is already registered
- "medium": similar names (different spelling or spacing), component-word conflicts in related classes
- "low": no significant existing marks found`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-search-preview", messages: [{ role: "user", content: prompt }], max_tokens: 800 }),
    });

    if (!response.ok) {
      const fallbackPrompt = `You are a trademark clearance expert with deep knowledge of IMPI (Mexico), USPTO, EUIPO, and WIPO registrations.

Assess whether the trademark "${markName}"${classContext}${goodsContext} can be registered without conflict.${variantNote}

CRITICAL INSTRUCTIONS:
1. Treat "${markName}" and any spacing/hyphen variants (e.g. "${normalized}") as the SAME mark — spacing never distinguishes trademarks.
2. Search your training knowledge for any brands, companies, or registered trademarks with this name or a confusingly similar one.
3. If the mark is compound (e.g. formed of multiple words like ${tokens.length > 0 ? tokens.map(t => `"${t}"`).join(" + ") : `"${markName}"`}), also check whether any of those individual words are independently registered in the same or related classes. A registered mark matching a dominant component can block the compound mark.
4. Consider conflicts in the SAME Nice class AND in commercially related classes (for class 29: also check 30, 31, 32, 43; for class 25: also check 18, 24, 26).
5. If you know of any registration under this name, a variant, or a component word, set risk to "high" and list it.

Return JSON only: { "risk": "low"|"medium"|"high", "findings": ["specific finding..."], "reasoning": "..." }`;

      const fallback = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a trademark clearance expert. Return JSON only, no markdown." },
            { role: "user", content: fallbackPrompt },
          ],
          temperature: 0.1, max_tokens: 800, response_format: { type: "json_object" },
        }),
      });
      if (!fallback.ok) return { findings: [], risk: "medium" };
      const d = await fallback.json();
      const c = d.choices?.[0]?.message?.content;
      if (!c) return { findings: [], risk: "low" };
      const p = JSON.parse(c);
      return { findings: p.findings || [], risk: p.risk || "medium" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { findings: [], risk: "low" };
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { findings: [], risk: "low" };
    const parsed = JSON.parse(jsonMatch[0]);
    return { findings: parsed.findings || [], risk: parsed.risk || "low" };
  } catch (err) {
    console.error("Web search error:", err);
    return { findings: [], risk: "medium" };
  }
}

interface NiceClass {
  classNumber: number;
  className: string;
  className_en: string;
  officialHeading: string;
  officialHeading_en: string;
  relevantItems: string[];
  relevantItems_en: string[];
}

async function classifyNiceClasses(
  apiKey: string,
  markName: string,
  goodsServices: string,
  language: string,
): Promise<NiceClass[]> {
  if (!goodsServices.trim()) return [];

  const isBilingual = language !== "en";
  const langName = LANGUAGE_NAMES[language] ?? "English";

  const bilingualNote = isBilingual
    ? `\nFor every text field, provide TWO versions: the main field in ${langName}, and a "_en" field in English.`
    : "";

  const prompt = `You are an expert in the Nice Classification system (11th edition) for trademarks.

The proposed trademark "${markName}" covers the following goods/services:
"${goodsServices}"
${bilingualNote}

Identify ALL applicable Nice Classification classes (1–45) that cover these goods/services. For each class:
1. Provide the class number
2. Provide the short class heading (e.g. "Chemicals", "Clothing", "Software services")
3. Provide the official WIPO class heading for that class number
4. List only the specific goods/services items from the user's description that fall within this class (3–8 bullet points maximum, concise)

Return JSON array:
[
  {
    "classNumber": 25,
    "className": "Clothing and footwear",${isBilingual ? `\n    "className_en": "Clothing and footwear",` : ""}
    "officialHeading": "Clothing, footwear, headgear",${isBilingual ? `\n    "officialHeading_en": "Clothing, footwear, headgear",` : ""}
    "relevantItems": ["item 1", "item 2", ...]${isBilingual ? `,\n    "relevantItems_en": ["item 1 in English", ...]` : ""}
  }
]

Return ONLY JSON array, no markdown. Be precise — only include classes where the user's declared goods/services genuinely fall. Do not include speculative or tangential classes.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Nice Classification expert. Return only valid JSON array, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const arr: unknown[] = Array.isArray(parsed) ? parsed : (parsed.classes ?? parsed.niceClasses ?? parsed.classifications ?? []);
    return arr
      .filter((e): e is NiceClass =>
        typeof e === "object" && e !== null &&
        "classNumber" in e && "relevantItems" in e
      )
      .map((e) => ({
        classNumber: Number((e as NiceClass).classNumber),
        className: String((e as NiceClass).className ?? ""),
        className_en: String((e as NiceClass).className_en ?? (e as NiceClass).className ?? ""),
        officialHeading: String((e as NiceClass).officialHeading ?? ""),
        officialHeading_en: String((e as NiceClass).officialHeading_en ?? (e as NiceClass).officialHeading ?? ""),
        relevantItems: Array.isArray((e as NiceClass).relevantItems) ? (e as NiceClass).relevantItems : [],
        relevantItems_en: Array.isArray((e as NiceClass).relevantItems_en) ? (e as NiceClass).relevantItems_en : (Array.isArray((e as NiceClass).relevantItems) ? (e as NiceClass).relevantItems : []),
      }))
      .sort((a, b) => a.classNumber - b.classNumber);
  } catch (err) {
    console.error("Nice class classification error:", err);
    return [];
  }
}

async function generateConsistentRiskSummary(
  apiKey: string,
  markName: string,
  goodsServices: string,
  applicantClasses: number[],
  finalRisk: "low" | "medium" | "high",
  finalRiskColor: "VERDE" | "AMARILLO" | "NARANJA" | "ROJO",
  exactSameClass: boolean,
  exactRelatedClass: boolean,
  exactUnrelatedOnly: boolean,
  relevantFindingsCount: number,
  marciaTotalCount: number,
  marciaFindings: Array<{ name: string; classNum: string; classOverlap: ClassOverlap }>,
  registrabilityFlags: { category: string; severity: string; explanation: string }[],
  dupontAgainst: number,
  language: string,
): Promise<{ riskSummary: string; riskSummary_en: string; riskSummary_user?: string }> {
  const langName = LANGUAGE_NAMES[language] ?? "English";
  const isUserLang = language !== "es";
  const isEnglish = language === "en";

  const riskLabelEs = finalRisk === "high" ? "Pocas Probabilidades de registro" : finalRisk === "medium" ? "Probabilidades Medias de registro" : "Altas Probabilidades de registro";

  let marciaContext: string;
  if (exactSameClass) {
    marciaContext = `Se encontró una coincidencia EXACTA en el registro IMPI MARCia para "${markName}" en la MISMA clase Niza que el solicitante (clase(s) ${applicantClasses.join(", ")}). Este es el obstáculo más importante para el registro.`;
  } else if (exactRelatedClass) {
    const unrelatedNames = marciaFindings.filter(f => f.name.toLowerCase().trim() === markName.toLowerCase().trim() && f.classOverlap === "unrelated").map(f => `"${f.name}" (clase ${f.classNum})`);
    marciaContext = `Se encontró una coincidencia exacta de nombre en el registro IMPI MARCia, pero únicamente en una clase RELACIONADA, no en la(s) clase(s) del solicitante (${applicantClasses.join(", ")}). Esto representa un riesgo moderado.${unrelatedNames.length ? ` Nota: también existe una marca idéntica en una clase no relacionada (${unrelatedNames.join(", ")}), lo cual no afecta la registrabilidad en la clase del solicitante.` : ""}`;
  } else if (exactUnrelatedOnly) {
    const unrelatedFindings = marciaFindings.filter(f => f.name.toLowerCase().trim() === markName.toLowerCase().trim());
    marciaContext = `Existe una marca idéntica "${markName}" en el registro IMPI MARCia, pero registrada únicamente en clases completamente NO RELACIONADAS (${unrelatedFindings.map(f => `clase ${f.classNum}`).join(", ")}). Esto NO obstruye el registro en la(s) clase(s) del solicitante (${applicantClasses.join(", ")}), ya que los productos/servicios operan en mercados totalmente distintos.`;
  } else if (relevantFindingsCount > 0) {
    marciaContext = `Se encontraron ${relevantFindingsCount} marca(s) potencialmente conflictivas en IMPI MARCia en la misma clase o clases relacionadas a la del solicitante (clase(s) ${applicantClasses.join(", ")}).`;
  } else if (marciaTotalCount > 0) {
    marciaContext = `Se encontraron ${marciaTotalCount} marca(s) con nombre similar en IMPI MARCia, pero TODAS están registradas en clases no relacionadas con la(s) clase(s) del solicitante (${applicantClasses.join(", ")}). La diferencia de clases reduce significativamente el riesgo de confusión.`;
  } else {
    marciaContext = `No se encontraron marcas conflictivas en el registro IMPI MARCia.`;
  }

  const flagContext = registrabilityFlags.length > 0
    ? `Motivos absolutos identificados: ${registrabilityFlags.map(f => f.category).join(", ")}.`
    : "No se identificaron motivos absolutos de rechazo.";

  const dupontContext = dupontAgainst > 0
    ? `${dupontAgainst} de los 13 factores DuPont pesan en contra del registro.`
    : "Ningún factor DuPont pesa en contra del registro.";

  const translationInstruction = isUserLang
    ? `Escribe el resumen principal ("riskSummary") en ESPAÑOL. Proporciona también "riskSummary_en" en inglés y "riskSummary_user" en ${langName}. En la versión ${langName}, cuando uses terminología legal española sin equivalente directo (p.ej. "marcas notorias", "LFPPI", "clases Niza"), mantenla en español entre paréntesis con una breve aclaración.`
    : isEnglish
    ? `Escribe el resumen principal ("riskSummary") en ESPAÑOL. Proporciona también "riskSummary_en" en inglés.`
    : `Escribe el resumen en ESPAÑOL únicamente. El campo "riskSummary_en" debe ser idéntico a "riskSummary".`;

  const prompt = `Eres un abogado experto en marcas mexicanas redactando un resumen de riesgo en lenguaje claro para un empresario.

Marca: "${markName}"
Productos/Servicios: "${goodsServices}"
Evaluación final de registrabilidad: ${riskLabelEs} (color Playbook: ${finalRiskColor})

Hallazgos clave que DEBEN reflejarse con precisión en el resumen:
- ${marciaContext}
- ${flagContext}
- ${dupontContext}

Redacta 3–4 oraciones: (1) estado de la registrabilidad conforme a la evaluación anterior, (2) obstáculos primarios específicos basados en los hallazgos, (3) pasos prácticos recomendados.
CRÍTICO: El resumen DEBE ser consistente con la evaluación final de "${riskLabelEs}". No la contradigas.
CRÍTICO: Menciona explícitamente el nivel de distintividad de la marca (genérica/descriptiva/sugestiva/arbitraria/de fantasía) y lo que significa para el registro.

${translationInstruction}

Devuelve únicamente JSON: {"riskSummary": "...", "riskSummary_en": "..."${isUserLang ? ', "riskSummary_user": "..."' : ""}}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Eres un abogado de marcas mexicano. Devuelve únicamente JSON válido, sin markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: isUserLang ? 1200 : 600,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) return { riskSummary: "", riskSummary_en: "" };
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { riskSummary: "", riskSummary_en: "" };
    const parsed = JSON.parse(content);
    return {
      riskSummary: parsed.riskSummary ?? "",
      riskSummary_en: parsed.riskSummary_en ?? parsed.riskSummary ?? "",
      riskSummary_user: parsed.riskSummary_user ?? undefined,
    };
  } catch {
    return { riskSummary: "", riskSummary_en: "" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { markName: rawMarkName = "", classes = [], language = "en", goodsServices = "", imageBase64 = "", imageMimeType = "image/png" } = body as {
      markName?: string; classes?: number[]; language?: string; goodsServices?: string; imageBase64?: string; imageMimeType?: string;
    };

    const isDesignOnly = !!imageBase64 && !rawMarkName.trim();

    if (!rawMarkName?.trim() && !imageBase64) {
      return new Response(JSON.stringify({ error: "markName or imageBase64 is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = DISCLAIMERS[language] ? language : "en";

    // For design marks: use GPT-4o Vision to describe the design and extract any word elements
    let markName = rawMarkName.trim();
    let designDescription = "";
    if (imageBase64) {
      try {
        const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a trademark specialist. Analyze this design/logo trademark image.\n\n1. Identify any word or letter elements present (return exactly as shown).\n2. Describe the design elements (shapes, colors, figurative elements, style) in 2-3 sentences.\n3. Identify the overall concept or theme the design evokes.\n\nRespond in JSON: { "wordElements": "exact word text or empty string", "designDescription": "visual description", "concept": "evoked concept/theme" }`,
                },
                { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBase64}`, detail: "low" } },
              ],
            }],
            max_tokens: 400,
            response_format: { type: "json_object" },
          }),
        });
        if (visionRes.ok) {
          const visionData = await visionRes.json();
          const parsed = JSON.parse(visionData.choices?.[0]?.message?.content ?? "{}");
          if (!markName && parsed.wordElements) markName = parsed.wordElements;
          designDescription = [parsed.designDescription, parsed.concept ? `Concept: ${parsed.concept}` : ""].filter(Boolean).join(" ");
        }
      } catch (err) {
        console.error("Vision analysis error:", err);
      }
    }

    // For pure design marks with no word element at all, use a placeholder for text-based searches
    const searchName = markName || "[design mark]";
    const enhancedGoodsServices = designDescription
      ? [goodsServices, `Design description: ${designDescription}`].filter(Boolean).join(". ")
      : goodsServices;

    // Run MARCia first so conflicting class numbers can inform the registrability analysis
    // Skip text-based searches when pure design with no word element extracted
    const [webResult, marciaResult, domainResults, translationAnalysis, niceClassification] = await Promise.all([
      markName ? searchWeb(apiKey, searchName, classes, enhancedGoodsServices, lang) : Promise.resolve({ findings: [], risk: "low" as const }),
      markName ? searchMarcia(searchName, classes) : Promise.resolve({ findings: [], marciaUrl: "https://marcia.impi.gob.mx/marcas/search/quick", totalCount: 0 }),
      markName ? checkDomains(searchName) : Promise.resolve([]),
      markName ? analyzeTranslations(apiKey, searchName, classes, enhancedGoodsServices, lang) : Promise.resolve([]),
      classifyNiceClasses(apiKey, searchName, enhancedGoodsServices || (isDesignOnly ? "design mark" : ""), lang),
    ]);

    const conflictingClassNums = marciaResult.findings.map(f => f.classNum).filter(Boolean);

    // Full-name fuzzy conflicts (same/related class)
    const similarConflictNames = marciaResult.findings.filter(f =>
      isSimilarName(f.name, searchName) && (f.classOverlap === "same" || f.classOverlap === "related")
    );
    // Component-word conflicts in same/related class
    const componentConflicts = marciaResult.findings.filter(
      f => f.classOverlap === "component" && !isSimilarName(f.name, searchName)
    );

    const registrabilityResult = await analyzeRegistrability(
      apiKey,
      isDesignOnly ? `[design mark]${designDescription ? ` — ${designDescription}` : ""}` : searchName,
      classes, enhancedGoodsServices, lang,
      conflictingClassNums, similarConflictNames, componentConflicts,
    );

    let risk: "low" | "medium" | "high" = webResult.risk;

    // Full-name fuzzy matches (only meaningful when there's a word element)
    const exactSameClass = !!markName && marciaResult.findings.some(
      f => isSimilarName(f.name, searchName) && f.classOverlap === "same"
    );
    const exactRelatedClass = !!markName && marciaResult.findings.some(
      f => isSimilarName(f.name, searchName) && f.classOverlap === "related"
    );
    const exactUnrelatedOnly =
      !!markName &&
      marciaResult.findings.some(f => isSimilarName(f.name, searchName)) &&
      !exactSameClass && !exactRelatedClass;

    const relevantFindings = marciaResult.findings.filter(
      f => f.classOverlap === "same" || f.classOverlap === "related"
    );
    const componentFindingsCount = componentConflicts.length;

    // Full-name conflict escalation
    if (exactSameClass) {
      risk = "high";
    } else if (exactRelatedClass) {
      if (risk === "low") risk = "medium";
      else if (risk === "medium") risk = "high";
    } else if (exactUnrelatedOnly) {
      // Identical name only in unrelated classes — do not escalate
    } else if (relevantFindings.length >= 5) {
      risk = "high";
    } else if (relevantFindings.length > 0 && risk === "low") {
      risk = "medium";
    }

    // Component-word conflict escalation (weaker signal — partial matches only)
    if (!exactSameClass && !exactRelatedClass) {
      if (componentFindingsCount >= 3 && risk !== "high") risk = "high";
      else if (componentFindingsCount >= 1 && risk === "low") risk = "medium";
    }

    if (registrabilityResult.risk === "high") risk = "high";
    else if (registrabilityResult.risk === "medium" && risk === "low") risk = "medium";

    const dupontAgainst = registrabilityResult.dupont.filter(f => f.verdict === "against_registration").length;
    if (dupontAgainst >= 5 && risk !== "high") risk = "high";
    else if (dupontAgainst >= 3 && risk === "low") risk = "medium";

    // Escalate overall risk if any translation carries a high-risk conflict
    const translationHighRisk = translationAnalysis.some(t => t.risk === "high");
    const translationMedRisk = translationAnalysis.some(t => t.risk === "medium");
    if (translationHighRisk && risk !== "high") risk = "high";
    else if (translationMedRisk && risk === "low") risk = "medium";

    // Derive final riskColor
    let riskColor: "VERDE" | "AMARILLO" | "NARANJA" | "ROJO" = registrabilityResult.riskColor;
    if (exactSameClass) riskColor = "ROJO";
    else if (exactRelatedClass) riskColor = riskColor === "VERDE" ? "AMARILLO" : riskColor === "AMARILLO" ? "NARANJA" : riskColor;
    else if (risk === "high" && riskColor !== "ROJO") riskColor = "ROJO";
    else if (risk === "medium" && riskColor === "VERDE") riskColor = "AMARILLO";

    // Generate a risk summary that is guaranteed to match the final aggregated risk level
    const summaryMarkName = isDesignOnly
      ? `[design mark]${designDescription ? ` — ${designDescription}` : ""}`
      : searchName;
    const consistentSummary = await generateConsistentRiskSummary(
      apiKey,
      summaryMarkName,
      enhancedGoodsServices,
      classes,
      risk,
      riskColor,
      exactSameClass,
      exactRelatedClass,
      exactUnrelatedOnly,
      relevantFindings.length,
      marciaResult.totalCount,
      marciaResult.findings,
      registrabilityResult.flags,
      dupontAgainst,
      lang,
    );

    return new Response(JSON.stringify({
      risk,
      riskColor,
      webFindings: webResult.findings,
      marciaFindings: marciaResult.findings,
      marciaTotalCount: marciaResult.totalCount,
      marciaUrl: marciaResult.marciaUrl,
      domainResults,
      registrabilityFlags: registrabilityResult.flags,
      registrabilityRisk: registrabilityResult.risk,
      dupont: registrabilityResult.dupont,
      distinctiveness: registrabilityResult.distinctiveness,
      elementDecomposition: registrabilityResult.elementDecomposition,
      riskSummary: consistentSummary.riskSummary,
      riskSummary_en: consistentSummary.riskSummary_en,
      riskSummary_user: consistentSummary.riskSummary_user,
      translationAnalysis,
      niceClassification,
      searchLanguage: lang,
      disclaimer: DISCLAIMERS[lang],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("verify-trademark error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
