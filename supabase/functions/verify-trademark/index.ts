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

// Related-class mapping for DuPont "relatedness of goods" analysis
const RELATED_CLASSES: Record<number, number[]> = {
  3: [5, 44], 5: [3, 44], 9: [42, 38], 25: [18, 24, 26], 18: [25],
  24: [25], 26: [25], 35: [42, 36], 36: [35], 38: [9, 42],
  39: [40], 40: [39], 41: [42, 35], 42: [9, 35, 38, 41],
  43: [30, 29, 32, 33], 44: [3, 5],
};

// "possible_same" = no class data returned by MARCia → conservative: treat as potentially same-class
type ClassOverlap = "same" | "related" | "unrelated" | "possible_same";

// ─── FIX 1: conservative class overlap — missing class data is NOT "unrelated" ─

function normalizeClassNums(raw: string): number[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(",")
    .map(s => parseInt(s.trim().replace(/^0+/, ""), 10))   // handles "043" → 43
    .filter(n => !isNaN(n) && n > 0);
}

function classifyOverlap(applicantClasses: number[], conflictClassNums: string): ClassOverlap {
  // Empty class data from MARCia = unknown → treat conservatively
  if (!conflictClassNums || !conflictClassNums.trim()) return "possible_same";

  const conflictClasses = normalizeClassNums(conflictClassNums);
  if (conflictClasses.length === 0) return "possible_same";   // still conservative if parse fails

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

// Normalise a mark name for comparison: lowercase, collapse whitespace, strip punctuation
function normalizeName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

// ─── FIX 5: extract individual search terms from a multi-word mark ────────────

function getSearchVariants(markName: string): string[] {
  const base = markName.trim();
  const words = base.split(/\s+/).filter(w => w.length > 2);  // words longer than 2 chars
  const variants = new Set<string>([base]);
  // Individual significant words (avoids searching stop-words like "The", "El", "de")
  const stopWords = new Set(["the", "el", "la", "los", "las", "de", "del", "and", "y", "of", "en"]);
  for (const w of words) {
    if (!stopWords.has(w.toLowerCase())) variants.add(w);
  }
  // Compact slug (no spaces): catches "BlindTiger" style marks
  const slug = base.replace(/\s+/g, "");
  if (slug !== base) variants.add(slug);
  return Array.from(variants);
}

interface DomainResult {
  domain: string;
  available: boolean | null;
  status: "available" | "taken" | "unknown";
}

async function checkDomains(markName: string): Promise<DomainResult[]> {
  const slug = markName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
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
        } else {
          results.push({ domain, available: !hasAnswers, status: hasAnswers ? "taken" : "taken" });
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

// ─── FIX 4 + FIX 5: multi-query MARCia search ────────────────────────────────

interface MarciaFinding {
  name: string;
  status: string;
  classNum: string;
  holder: string;
  classOverlap: ClassOverlap;
}

async function querySingleMarcia(
  searchTerm: string,
  classes: number[],
  apiHeaders: Record<string, string>,
  BASE: string,
  marciaUrl: string,
): Promise<{ findings: MarciaFinding[]; totalCount: number }> {
  try {
    const recordRes = await fetch(`${BASE}/search/internal/record`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ _type: "Search$Quick", query: searchTerm.trim(), images: [] }),
      signal: AbortSignal.timeout(12000),
    });
    if (!recordRes.ok) return { findings: [], totalCount: 0 };

    const record = await recordRes.json();
    const searchId: string = record.id;
    const totalCount: number = record.count ?? 0;
    if (!searchId) return { findings: [], totalCount: 0 };

    const allClasses = classes.length > 0 ? [...classes, ...getRelatedClasses(classes)] : [];

    const resultRes = await fetch(`${BASE}/search/internal/result`, {
      method: "POST",
      headers: apiHeaders,
      // ─── FIX 4: larger page size to capture more potential conflicts ───────
      body: JSON.stringify({
        searchId,
        pageSize: 50,
        pageNumber: 0,
        statusFilter: [],
        viennaCodeFilter: [],
        niceClassFilter: allClasses.length > 0 ? allClasses : [],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resultRes.ok) return { findings: [], totalCount };

    const resultData = await resultRes.json();
    const items: Record<string, unknown>[] = resultData.resultPage ?? [];

    const findings: MarciaFinding[] = items.map((item) => {
      const classNums: number[] = Array.isArray(item.classes) ? (item.classes as number[]) : [];
      const classNum = classNums.length > 0 ? classNums.join(", ") : "";
      console.log(`[MARCia] item="${item.title}" classes=${JSON.stringify(classNums)} classNum="${classNum}"`);
      return {
        name: String(item.title ?? ""),
        status: String(item.status ?? ""),
        classNum,
        holder: Array.isArray(item.owners)
          ? (item.owners as string[]).join(", ")
          : String(item.owners ?? ""),
        classOverlap: classifyOverlap(classes, classNum),
      };
    }).filter(f => f.name);

    return { findings, totalCount };
  } catch (err) {
    console.error(`[MARCia] query error for "${searchTerm}":`, err);
    return { findings: [], totalCount: 0 };
  }
}

async function searchMarcia(markName: string, classes: number[]): Promise<{
  findings: MarciaFinding[];
  marciaUrl: string;
  totalCount: number;      // raw MARCia count for primary query (displayed in full report footnote)
  filteredCount: number;   // FIX 4: actual class-filtered match count shown prominently in UI
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

    if (!initRes.ok) return { findings: [], marciaUrl, totalCount: 0, filteredCount: 0 };

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

    // ─── FIX 5: run multiple search variants in parallel ──────────────────────
    const variants = getSearchVariants(markName);
    console.log(`[MARCia] searching variants: ${variants.join(", ")}`);

    const variantResults = await Promise.all(
      variants.map(v => querySingleMarcia(v, classes, apiHeaders, BASE, marciaUrl))
    );

    const primaryTotalCount = variantResults[0]?.totalCount ?? 0;

    // Merge and deduplicate findings across all variant searches
    // Priority: same > possible_same > related > unrelated
    const overlapPriority: Record<ClassOverlap, number> = {
      same: 4, possible_same: 3, related: 2, unrelated: 1,
    };
    const mergedMap = new Map<string, MarciaFinding>();
    for (const r of variantResults) {
      for (const f of r.findings) {
        const key = normalizeName(f.name);
        const existing = mergedMap.get(key);
        if (!existing || overlapPriority[f.classOverlap] > overlapPriority[existing.classOverlap]) {
          mergedMap.set(key, f);
        }
      }
    }

    const findings = Array.from(mergedMap.values())
      .sort((a, b) => overlapPriority[b.classOverlap] - overlapPriority[a.classOverlap]);

    const filteredCount = findings.filter(
      f => f.classOverlap === "same" || f.classOverlap === "possible_same" || f.classOverlap === "related"
    ).length;

    return { findings, marciaUrl, totalCount: primaryTotalCount, filteredCount };
  } catch (err) {
    console.error("MARCia fetch error:", err);
    return { findings: [], marciaUrl, totalCount: 0, filteredCount: 0 };
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

export interface TranslationFlag {
  languageCode: string;
  languageName: string;
  translatedForm: string;
  risk: "none" | "low" | "medium" | "high";
  issueCategory: string | null;
  details: string;
  details_en: string;
}

// ─── FIX 2 + FIX 3 + FIX 6: improved registrability analysis ─────────────────

async function analyzeRegistrability(
  apiKey: string,
  markName: string,
  classes: number[],
  goodsServices: string,
  language: string,
  // ─── FIX 3: now receives categorised conflict data instead of a flat list ───
  sameClassConflicts: MarciaFinding[],
  relatedClassConflicts: MarciaFinding[],
  possibleSameConflicts: MarciaFinding[],
): Promise<{
  flags: RegistrabilityFlag[];
  risk: "low" | "medium" | "high";
  dupont: DupontFactor[];
  distinctiveness: DistinctivenessAssessment;
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

  // ─── FIX 3: build a rich, categorised conflict context for the AI ──────────
  let conflictClassContext = "";
  const hasExactSame = sameClassConflicts.length > 0 || possibleSameConflicts.length > 0;

  if (sameClassConflicts.length > 0) {
    const list = sameClassConflicts.map(f => `"${f.name}" (clase ${f.classNum}, titular: ${f.holder || "desconocido"}, estado: ${f.status})`).join("; ");
    conflictClassContext += `\n\nCONFLICTOS CRÍTICOS — MISMA CLASE (classOverlap=SAME_CLASS):
Se encontraron ${sameClassConflicts.length} marca(s) IDÉNTICA(S) o SIMILAR(ES) al signo "${markName}" registrada(s) en la(s) MISMA(S) clase(s) Niza que el solicitante (clase(s) ${classes.join(", ")}):
${list}
INSTRUCCIÓN OBLIGATORIA: Esto es el obstáculo más grave posible para el registro. Los factores DuPont "similarity_of_marks" y "strength_of_cited_mark" DEBEN marcarse como "against_registration". El riskSummary DEBE mencionar explícitamente estas marcas y sus clases. NO es posible un resultado favorable cuando existe una marca idéntica en la misma clase.`;
  }

  if (possibleSameConflicts.length > 0) {
    const list = possibleSameConflicts.map(f => `"${f.name}" (titular: ${f.holder || "desconocido"}, estado: ${f.status})`).join("; ");
    conflictClassContext += `\n\nCONFLICTOS POTENCIALES — CLASE NO CONFIRMADA (classOverlap=POSSIBLE_SAME):
Se encontraron ${possibleSameConflicts.length} marca(s) cuya clase Niza no fue devuelta por la base de datos (probablemente por un error técnico de MARCia). Estas marcas existen en el registro IMPI pero su clase exacta es desconocida:
${list}
INSTRUCCIÓN: Tratar como potencial conflicto en la misma clase. Los factores DuPont correspondientes deben reflejar esta incertidumbre.`;
  }

  if (relatedClassConflicts.length > 0 && !hasExactSame) {
    const list = relatedClassConflicts.map(f => `"${f.name}" (clase ${f.classNum})`).join("; ");
    conflictClassContext += `\n\nCONFLICTOS EN CLASES RELACIONADAS:
Se encontraron marcas en clases Niza relacionadas con la del solicitante (clase(s) ${classes.join(", ")}): ${list}
Evalúa si los canales de comercio o los consumidores se superponen. Refleja esto en los factores DuPont "relatedness_of_goods" y "channels_of_trade".`;
  }

  if (!conflictClassContext && classes.length > 0) {
    conflictClassContext = `\n\nSin conflictos directos identificados en la clase del solicitante (clase(s) ${classes.join(", ")}) ni en clases relacionadas. Evalúa el registro principalmente en función de los motivos absolutos y la distintividad.`;
  }

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
→ Si SÍ: tier="generic", score=1, flag category="generic", severity="high"
→ Si NO: continúa al Nivel B

NIVEL B — DESCRIPTIVO (Art. 173 Fr. II LFPPI) — PRUEBA DE INMEDIATEZ
Pregunta: ¿Cuando el consumidor típico de la clase encuentra la marca, le comunica DIRECTA e INMEDIATAMENTE (sin esfuerzo mental ni paso intermedio) una característica, calidad, cantidad, finalidad, valor u origen geográfico de los productos concretos de la clase?
CRITERIO CLAVE: Si se requiere imaginación, razonamiento o percepción adicional para conectar la marca con los productos, NO es descriptiva.
EJEMPLO CORRECTO: "CREMOSO" para quesos de la clase 29 → descriptivo.
EJEMPLO INCORRECTO como descriptivo: "GALLO AZUL" para productos químicos de la clase 1 → es ARBITRARIA.
→ Si SÍ (inmediato y directo): tier="descriptive", score=2, flag category="descriptive", severity="medium"
→ Si NO: continúa al Nivel C

NIVEL C — SUGESTIVO
Pregunta: ¿Requiere la marca imaginación, reflexión o percepción para evocar una cualidad de los productos, sin describirla directamente?
→ Si SÍ: tier="suggestive", score=3, sin flag de motivo absoluto
→ Si NO: continúa al Nivel D

NIVEL D — ARBITRARIO
Pregunta: ¿Es la marca una palabra o combinación de palabras con significado conocido en algún idioma, aplicada a productos de la clase solicitada con los que NO guarda relación semántica alguna?
→ Si SÍ: tier="arbitrary", score=4, sin flag de motivo absoluto
→ Si NO: continúa al Nivel E

NIVEL E — FANTASÍA/FANCIFUL
Pregunta: ¿Es la marca un término inventado sin significado en ningún idioma?
→ Si SÍ: tier="fanciful", score=5, sin flag de motivo absoluto

PARTE 2 — MOTIVOS ABSOLUTOS APLICABLES (LFPPI Art. 173)
Solo incluye flags que genuinamente apliquen. Categorías disponibles:
"generic" (Fr. I), "descriptive" (Fr. II), "functional_shape" (Fr. IV), "deceptive" (Fr. V),
"official_emblems" (Fr. VI), "personal_identity" (Fr. VII), "confusingly_similar" (Fr. VIII),
"famous_mark" (Fr. IX), "protected_characters" (Fr. X), "geographic_indication" (Fr. XI),
"immoral_offensive" (Fr. XII), "isolated_color" (Fr. XIII), "non_distinctive_nontrad" (Fr. XIV), "bad_faith" (Fr. XV)
NOTA: "generic" y "descriptive" son categorías independientes; nunca las combines.

PARTE 3 — PERFIL DEL CONSUMIDOR Y CAMPO SATURADO
- Identifica el perfil del consumidor típico para la clase solicitada y su nivel de atención (alto=comprador industrial/profesional; medio=consumidor general; bajo=compra impulsiva).
- Si hay múltiples marcas similares en la misma clase (campo saturado), la protección de cada marca individual es más estrecha. Refleja esto en el factor DuPont "number_of_similar_marks".

PARTE 4 — LOS 13 FACTORES DUPONT
Nombres de factores (usar exactamente):
"similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
"strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
"variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors"
Veredicto por factor: "favors_registration" | "neutral" | "against_registration"
IMPORTANTE: "purchasing_conditions" debe reflejar el nivel de atención del consumidor típico identificado en la Parte 3.
RECORDATORIO CRÍTICO: Si se indicaron CONFLICTOS CRÍTICOS — MISMA CLASE arriba, los factores "similarity_of_marks" y "strength_of_cited_mark" DEBEN ser "against_registration".

Devuelve exactamente:
{
  "flags": [{"category": "...", "severity": "low"|"medium"|"high", "explanation": "...(en español)"${isUserLang ? ', "explanation_en": "...", "explanation_user": "..."' : isEnglish ? ', "explanation_en": "..."' : ""}}],
  "risk": "low"|"medium"|"high",
  "distinctiveness": {"tier": "...", "score": 1-5, "explanation": "...(en español)"${isUserLang ? ', "explanation_en": "...", "explanation_user": "..."' : isEnglish ? ', "explanation_en": "..."' : ""}},
  "dupont": [{"factor": "...", "verdict": "...", "reasoning": "...(en español)"${isUserLang ? ', "reasoning_en": "...", "reasoning_user": "..."' : isEnglish ? ', "reasoning_en": "..."' : ""}}],
  "riskSummary": "...(en español)"${isUserLang ? ',\n  "riskSummary_en": "...",\n  "riskSummary_user": "..."' : isEnglish ? ',\n  "riskSummary_en": "..."' : ""}
}`;

  const defaultDistinctiveness: DistinctivenessAssessment = {
    tier: "arbitrary", score: 4, explanation: "", explanation_en: "", explanation_user: "",
  };
  const defaultDupont: DupontFactor[] = [
    "similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
    "strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
    "variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors",
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
        max_tokens: isUserLang ? 6000 : 4500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return { flags: [], risk: "low", dupont: defaultDupont, distinctiveness: defaultDistinctiveness, riskSummary: "", riskSummary_en: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { flags: [], risk: "low", dupont: defaultDupont, distinctiveness: defaultDistinctiveness, riskSummary: "", riskSummary_en: "" };

    const parsed = JSON.parse(content);
    const flags: RegistrabilityFlag[] = (parsed.flags ?? []).filter(
      (f: Record<string, unknown>) => f.category && f.severity && f.explanation
    );
    const risk: "low" | "medium" | "high" = parsed.risk ?? (flags.length > 0 ? "medium" : "low");

    let dupont: DupontFactor[] = (parsed.dupont ?? defaultDupont).filter(
      (f: Record<string, unknown>) => f.factor && f.verdict && f.reasoning
    );

    // ─── FIX 6: post-processing override — AI must not contradict hard facts ──
    if (hasExactSame) {
      const OVERRIDE_FACTORS = new Set(["similarity_of_marks", "strength_of_cited_mark"]);
      dupont = dupont.map(f => {
        if (OVERRIDE_FACTORS.has(f.factor) && f.verdict !== "against_registration") {
          return {
            ...f,
            verdict: "against_registration" as const,
            reasoning: `(Corregido automáticamente) ${f.reasoning} — Se encontró una marca idéntica en la misma clase Niza en el registro IMPI, lo que constituye un conflicto directo.`,
            reasoning_en: `(Auto-corrected) ${f.reasoning_en ?? f.reasoning} — An identical mark was found in the same Nice class in the IMPI registry, representing a direct conflict.`,
            reasoning_user: `(Auto-corrected) ${f.reasoning_user ?? f.reasoning_en ?? f.reasoning}`,
          };
        }
        return f;
      });
    }

    const rawD = parsed.distinctiveness ?? {};
    const distinctiveness: DistinctivenessAssessment = {
      tier: rawD.tier ?? "arbitrary",
      score: typeof rawD.score === "number" ? rawD.score : 4,
      explanation: rawD.explanation ?? "",
      explanation_en: rawD.explanation_en ?? rawD.explanation ?? "",
      explanation_user: rawD.explanation_user ?? rawD.explanation_en ?? rawD.explanation ?? "",
    };

    return {
      flags,
      risk,
      dupont,
      distinctiveness,
      riskSummary: parsed.riskSummary ?? "",
      riskSummary_en: parsed.riskSummary_en ?? parsed.riskSummary ?? "",
    };
  } catch (err) {
    console.error("Registrability analysis error:", err);
    return { flags: [], risk: "low", dupont: defaultDupont, distinctiveness: defaultDistinctiveness, riskSummary: "", riskSummary_en: "" };
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
    "risk": "none"|"low"|"medium"|"high",
    "issueCategory": null or one of: "confusingly_similar"|"generic_descriptive"|"deceptive"|"immoral_offensive"|"famous_mark"|"phonetic_conflict"|"geographic_indication",
    "details": "Explanation in ${LANGUAGE_NAMES[searchLanguage] ?? "English"} of what the translation means and what risk was found (2-3 sentences)",
    "details_en": "Same explanation always in English (2-3 sentences)"
  },
  ...
]

Be thorough and specific. Return exactly 8 entries, one per language.`;

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
    const arr: unknown[] = Array.isArray(parsed) ? parsed : (parsed.translations ?? parsed.results ?? []);
    return arr.filter((e): e is TranslationFlag =>
      typeof e === "object" && e !== null &&
      "languageCode" in e && "translatedForm" in e && "risk" in e && "details" in e
    );
  } catch (err) {
    console.error("Translation analysis error:", err);
    return [];
  }
}

async function searchWeb(
  apiKey: string,
  markName: string,
  classes: number[],
  goodsServices: string,
  language: string,
): Promise<{ findings: string[]; risk: "low" | "medium" | "high" }> {
  const classContext = classes.length > 0 ? ` in Nice Classification class(es) ${classes.join(", ")}` : "";
  const goodsContext = goodsServices ? ` for: ${goodsServices}` : "";
  const langName = LANGUAGE_NAMES[language] ?? "English";
  const langInstruction = language !== "en" ? ` Write all findings strings in ${langName}.` : "";

  const prompt = `Search the web for existing trademark registrations, brand names, or companies named "${markName}"${classContext}${goodsContext}.${langInstruction}

Focus on: registered trademarks with this exact/similar name, well-known brands, IMPI registered marks, international registrations (USPTO, EUIPO, WIPO).

Return JSON: { "risk": "low"|"medium"|"high", "findings": ["finding 1", ...], "reasoning": "..." }
Risk: "high"=exact match in same/related class, "medium"=similar names or different class, "low"=no significant existing marks.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-search-preview", messages: [{ role: "user", content: prompt }], max_tokens: 800 }),
    });

    if (!response.ok) {
      const fallback = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a trademark clearance assistant. Return JSON only." },
            { role: "user", content: `Assess trademark "${markName}"${classContext}${goodsContext}: { "risk": "low"|"medium"|"high", "findings": [...], "reasoning": "..." }` },
          ],
          temperature: 0.1, max_tokens: 600, response_format: { type: "json_object" },
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

async function classifyNiceClasses(
  apiKey: string,
  markName: string,
  goodsServices: string,
  language: string,
): Promise<unknown[]> {
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
2. Provide the short class heading
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

Return ONLY JSON array, no markdown.`;

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
      .filter((e): e is Record<string, unknown> =>
        typeof e === "object" && e !== null &&
        "classNumber" in e && "relevantItems" in e
      )
      .map((e) => ({
        classNumber: Number(e.classNumber),
        className: String(e.className ?? ""),
        className_en: String(e.className_en ?? e.className ?? ""),
        officialHeading: String(e.officialHeading ?? ""),
        officialHeading_en: String(e.officialHeading_en ?? e.officialHeading ?? ""),
        relevantItems: Array.isArray(e.relevantItems) ? e.relevantItems : [],
        relevantItems_en: Array.isArray(e.relevantItems_en) ? e.relevantItems_en : (Array.isArray(e.relevantItems) ? e.relevantItems : []),
      }))
      .sort((a, b) => (a as { classNumber: number }).classNumber - (b as { classNumber: number }).classNumber);
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
  // ─── FIX 2: riskColor is now deterministic, not from AI ───────────────────
  finalRiskColor: "VERDE" | "AMARILLO" | "NARANJA" | "ROJO",
  exactSameClass: boolean,
  exactPossibleSame: boolean,
  exactRelatedClass: boolean,
  exactUnrelatedOnly: boolean,
  relevantFindingsCount: number,
  marciaTotalCount: number,
  marciaFindings: MarciaFinding[],
  registrabilityFlags: { category: string; severity: string; explanation: string }[],
  dupontAgainst: number,
  language: string,
): Promise<{ riskSummary: string; riskSummary_en: string; riskSummary_user?: string }> {
  const langName = LANGUAGE_NAMES[language] ?? "English";
  const isUserLang = language !== "es";
  const isEnglish = language === "en";

  const riskLabelEs = finalRisk === "high"
    ? "Pocas Probabilidades de registro"
    : finalRisk === "medium"
    ? "Probabilidades Medias de registro"
    : "Altas Probabilidades de registro";

  let marciaContext: string;
  if (exactSameClass) {
    const conflictNames = marciaFindings
      .filter(f => normalizeName(f.name) === normalizeName(markName) && f.classOverlap === "same")
      .map(f => `"${f.name}" (clase ${f.classNum})`)
      .join(", ");
    marciaContext = `Se encontró una coincidencia EXACTA en el registro IMPI MARCia para "${markName}" en la MISMA clase Niza que el solicitante (clase(s) ${applicantClasses.join(", ")}): ${conflictNames}. Este es el obstáculo más importante y definitivo para el registro.`;
  } else if (exactPossibleSame) {
    const conflictNames = marciaFindings
      .filter(f => normalizeName(f.name) === normalizeName(markName) && f.classOverlap === "possible_same")
      .map(f => `"${f.name}"`)
      .join(", ");
    marciaContext = `Se encontró una marca idéntica "${markName}" en el registro IMPI MARCia, pero la clase Niza de ese registro no pudo ser confirmada técnicamente. Esto debe tratarse como un posible conflicto directo que requiere verificación manual en marcia.impi.gob.mx.`;
    void conflictNames;
  } else if (exactRelatedClass) {
    marciaContext = `Se encontró una coincidencia exacta de nombre en el registro IMPI MARCia, pero únicamente en una clase RELACIONADA, no en la(s) clase(s) del solicitante (${applicantClasses.join(", ")}). Esto representa un riesgo moderado que debe evaluarse.`;
  } else if (exactUnrelatedOnly) {
    const unrelatedFindings = marciaFindings.filter(f => normalizeName(f.name) === normalizeName(markName));
    marciaContext = `Existe una marca idéntica "${markName}" en el registro IMPI MARCia, pero registrada únicamente en clases completamente no relacionadas (${unrelatedFindings.map(f => `clase ${f.classNum}`).join(", ")}). Esto NO obstruye el registro en la(s) clase(s) del solicitante (${applicantClasses.join(", ")}), ya que los productos/servicios operan en mercados totalmente distintos.`;
  } else if (relevantFindingsCount > 0) {
    marciaContext = `Se encontraron ${relevantFindingsCount} marca(s) potencialmente conflictivas en IMPI MARCia en la misma clase o clases relacionadas a la del solicitante (clase(s) ${applicantClasses.join(", ")}).`;
  } else if (marciaTotalCount > 0) {
    marciaContext = `Se realizaron búsquedas en IMPI MARCia y no se encontraron marcas conflictivas en la(s) clase(s) del solicitante (${applicantClasses.join(", ")}) ni en clases relacionadas. Las marcas encontradas en otras clases no relacionadas no representan un obstáculo.`;
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
Evaluación final de registrabilidad: ${riskLabelEs} (indicador: ${finalRiskColor})

Hallazgos clave que DEBEN reflejarse con precisión en el resumen:
- ${marciaContext}
- ${flagContext}
- ${dupontContext}

Redacta 3–4 oraciones: (1) estado de la registrabilidad conforme a la evaluación anterior, (2) obstáculos primarios específicos basados en los hallazgos, (3) pasos prácticos recomendados.
CRÍTICO: El resumen DEBE ser consistente con la evaluación final de "${riskLabelEs}". No la contradigas.
CRÍTICO: Si hay conflictos en la misma clase, el resumen DEBE mencionarlos explícitamente y ser claro sobre el riesgo real. NO puede concluir con "altas probabilidades" cuando hay conflictos exactos.

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
        max_tokens: isUserLang ? 1200 : 700,
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

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { markName, classes = [], language = "en", goodsServices = "" } = body as {
      markName: string; classes?: number[]; language?: string; goodsServices?: string;
    };

    if (!markName?.trim()) {
      return new Response(
        JSON.stringify({ error: "markName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lang = DISCLAIMERS[language] ? language : "en";

    // Run MARCia, web search, domains, and translations in parallel
    const [marciaResult, webResult, domainResults, translationAnalysis, niceClassification] = await Promise.all([
      searchMarcia(markName.trim(), classes),
      searchWeb(apiKey, markName.trim(), classes, goodsServices, lang),
      checkDomains(markName.trim()),
      analyzeTranslations(apiKey, markName.trim(), classes, goodsServices, lang),
      classifyNiceClasses(apiKey, markName.trim(), goodsServices, lang),
    ]);

    // ─── FIX 1 + FIX 7: categorise MARCia findings by overlap type ───────────
    const normalizedMark = normalizeName(markName.trim());

    const exactSameClass = marciaResult.findings.some(
      f => normalizeName(f.name) === normalizedMark && f.classOverlap === "same"
    );
    const exactPossibleSame = !exactSameClass && marciaResult.findings.some(
      f => normalizeName(f.name) === normalizedMark && f.classOverlap === "possible_same"
    );
    const exactRelatedClass = !exactSameClass && !exactPossibleSame && marciaResult.findings.some(
      f => normalizeName(f.name) === normalizedMark && f.classOverlap === "related"
    );
    const exactUnrelatedOnly =
      marciaResult.findings.some(f => normalizeName(f.name) === normalizedMark) &&
      !exactSameClass && !exactPossibleSame && !exactRelatedClass;

    const sameClassConflicts = marciaResult.findings.filter(
      f => normalizeName(f.name) === normalizedMark && f.classOverlap === "same"
    );
    const possibleSameConflicts = marciaResult.findings.filter(
      f => normalizeName(f.name) === normalizedMark && f.classOverlap === "possible_same"
    );
    const relatedClassConflicts = marciaResult.findings.filter(
      f => f.classOverlap === "related"
    );

    // ─── FIX 3: pass categorised conflict data to AI ─────────────────────────
    const registrabilityResult = await analyzeRegistrability(
      apiKey,
      markName.trim(),
      classes,
      goodsServices,
      lang,
      sameClassConflicts,
      relatedClassConflicts,
      possibleSameConflicts,
    );

    // ─── FIX 7: hard-block deterministic risk — no AI override possible ───────
    let risk: "low" | "medium" | "high" = webResult.risk;
    const relevantFindings = marciaResult.findings.filter(
      f => f.classOverlap === "same" || f.classOverlap === "possible_same" || f.classOverlap === "related"
    );

    if (exactSameClass || exactPossibleSame) {
      // Identical mark in same (or unconfirmed) class → always HIGH
      risk = "high";
    } else if (exactRelatedClass) {
      if (risk === "low") risk = "medium";
    } else if (exactUnrelatedOnly) {
      // Identical mark only in completely unrelated classes → do not escalate
    } else if (relevantFindings.length >= 5) {
      risk = "high";
    } else if (relevantFindings.length > 0 && risk === "low") {
      risk = "medium";
    }

    if (registrabilityResult.risk === "high") risk = "high";
    else if (registrabilityResult.risk === "medium" && risk === "low") risk = "medium";

    const dupontAgainst = registrabilityResult.dupont.filter(f => f.verdict === "against_registration").length;
    if (dupontAgainst >= 5 && risk !== "high") risk = "high";
    else if (dupontAgainst >= 3 && risk === "low") risk = "medium";

    const translationHighRisk = translationAnalysis.some(t => t.risk === "high");
    const translationMedRisk = translationAnalysis.some(t => t.risk === "medium");
    if (translationHighRisk && risk !== "high") risk = "high";
    else if (translationMedRisk && risk === "low") risk = "medium";

    // ─── FIX 2: riskColor is FULLY DETERMINISTIC — AI cannot override it ──────
    let riskColor: "VERDE" | "AMARILLO" | "NARANJA" | "ROJO";
    if (exactSameClass || exactPossibleSame || risk === "high") {
      riskColor = "ROJO";
    } else if (exactRelatedClass || risk === "medium") {
      // Further refine: NARANJA when multiple DuPont factors against, AMARILLO otherwise
      riskColor = dupontAgainst >= 3 ? "NARANJA" : "AMARILLO";
    } else {
      // low risk
      riskColor = "VERDE";
    }

    // Generate a consistent risk summary anchored to the deterministic outcome
    const consistentSummary = await generateConsistentRiskSummary(
      apiKey,
      markName.trim(),
      goodsServices,
      classes,
      risk,
      riskColor,
      exactSameClass,
      exactPossibleSame,
      exactRelatedClass,
      exactUnrelatedOnly,
      relevantFindings.length,
      marciaResult.totalCount,
      marciaResult.findings,
      registrabilityResult.flags,
      dupontAgainst,
      lang,
    );

    return new Response(
      JSON.stringify({
        risk,
        riskColor,
        webFindings: webResult.findings,
        marciaFindings: marciaResult.findings,
        marciaTotalCount: marciaResult.totalCount,        // raw DB count — shown in footnote only
        marciaFilteredCount: marciaResult.filteredCount,  // FIX 4/5: class-filtered count for UI
        marciaUrl: marciaResult.marciaUrl,
        domainResults,
        registrabilityFlags: registrabilityResult.flags,
        registrabilityRisk: registrabilityResult.risk,
        dupont: registrabilityResult.dupont,
        distinctiveness: registrabilityResult.distinctiveness,
        riskSummary: consistentSummary.riskSummary,
        riskSummary_en: consistentSummary.riskSummary_en,
        riskSummary_user: consistentSummary.riskSummary_user,
        translationAnalysis,
        niceClassification,
        searchLanguage: lang,
        disclaimer: DISCLAIMERS[lang],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-trademark error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
