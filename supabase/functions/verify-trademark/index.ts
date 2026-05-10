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
  24: [25], 35: [42, 36], 42: [9, 35, 38], 43: [30, 29, 32, 33], 41: [42, 35], 44: [3, 5],
};

function getRelatedClasses(classes: number[]): number[] {
  const related = new Set<number>();
  for (const c of classes) {
    for (const r of RELATED_CLASSES[c] || []) {
      if (!classes.includes(r)) related.add(r);
    }
  }
  return Array.from(related);
}

function toDomainSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
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

async function searchMarcia(markName: string, classes: number[]): Promise<{
  findings: Array<{ name: string; status: string; classNum: string; holder: string }>;
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

    const recordRes = await fetch(`${BASE}/search/internal/record`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ _type: "Search$Quick", query: markName.trim(), images: [] }),
      signal: AbortSignal.timeout(12000),
    });
    if (!recordRes.ok) { return { findings: [], marciaUrl, totalCount: 0 }; }

    const record = await recordRes.json();
    const searchId: string = record.id;
    const totalCount: number = record.count ?? 0;
    if (!searchId) { return { findings: [], marciaUrl, totalCount: 0 }; }

    const allClasses = classes.length > 0 ? [...classes, ...getRelatedClasses(classes)] : [];

    const resultRes = await fetch(`${BASE}/search/internal/result`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ searchId, pageSize: 20, pageNumber: 0, statusFilter: [], viennaCodeFilter: [], niceClassFilter: allClasses.length > 0 ? allClasses : [] }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resultRes.ok) { return { findings: [], marciaUrl, totalCount }; }

    const resultData = await resultRes.json();
    const items: Record<string, unknown>[] = resultData.resultPage ?? [];
    const findings = items.slice(0, 15).map((item) => {
      const classNums: number[] = Array.isArray(item.classes) ? (item.classes as number[]) : [];
      return {
        name: String(item.title ?? ""),
        status: String(item.status ?? ""),
        classNum: classNums.length > 0 ? classNums.join(", ") : "",
        holder: Array.isArray(item.owners) ? (item.owners as string[]).join(", ") : String(item.owners ?? ""),
      };
    }).filter(f => f.name);

    return { findings, marciaUrl, totalCount };
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
}

interface DupontFactor {
  factor: string;
  verdict: "favors_registration" | "neutral" | "against_registration";
  reasoning: string;
  reasoning_en?: string;
}

interface DistinctivenessAssessment {
  tier: "generic" | "descriptive" | "suggestive" | "arbitrary" | "fanciful";
  score: number;
  explanation: string;
  explanation_en?: string;
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

async function analyzeRegistrability(
  apiKey: string,
  markName: string,
  classes: number[],
  goodsServices: string,
  language: string
): Promise<{
  flags: RegistrabilityFlag[];
  risk: "low" | "medium" | "high";
  dupont: DupontFactor[];
  distinctiveness: DistinctivenessAssessment;
  riskSummary: string;
  riskSummary_en: string;
}> {
  const classContext = classes.length > 0
    ? ` applied for goods/services in Nice Classification class(es) ${classes.join(", ")}`
    : "";
  const goodsContext = goodsServices
    ? ` covering the following goods/services: "${goodsServices}"`
    : "";

  const langName = LANGUAGE_NAMES[language] ?? "English";
  const isBilingual = language !== "en";

  const bilingualInstruction = isBilingual
    ? `\n\nIMPORTANT BILINGUAL REQUIREMENT: For every free-text field, provide TWO versions:
- The main field (e.g. "explanation", "reasoning", "riskSummary") MUST be written in ${langName}.
- An additional "_en" field (e.g. "explanation_en", "reasoning_en", "riskSummary_en") MUST contain the same content translated into English.
Both versions are required. Do not omit either.`
    : "";

  const prompt = `You are an expert Mexican trademark attorney. Analyze the proposed trademark "${markName}"${classContext}${goodsContext}.${bilingualInstruction}

Return a single JSON object with ALL of the following fields. Return ONLY JSON, no markdown.

PART 1 — ABSOLUTE GROUNDS (LFPPI)
Only include flags that genuinely apply from these 13 categories:
1. "generic_descriptive", 2. "functional_shape", 3. "deceptive", 4. "official_emblems",
5. "personal_identity", 6. "confusingly_similar", 7. "famous_mark", 8. "protected_characters",
9. "geographic_indication", 10. "immoral_offensive", 11. "isolated_color",
12. "non_distinctive_nontrad", 13. "bad_faith"

PART 2 — DISTINCTIVENESS
Tier: "generic" | "descriptive" | "suggestive" | "arbitrary" | "fanciful"
Score: 1=generic to 5=fanciful

PART 3 — ALL 13 DUPONT FACTORS
Factor names (use exactly):
"similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
"strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
"variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors"
Each factor verdict: "favors_registration" | "neutral" | "against_registration"

PART 4 — PLAIN-LANGUAGE RISK SUMMARY
3-4 sentences: (1) registrability outlook, (2) key risks, (3) recommended next steps.
Written for a business owner, not a lawyer.

Return exactly:
{
  "flags": [{"category": "...", "severity": "low"|"medium"|"high", "explanation": "..."${isBilingual ? ', "explanation_en": "..."' : ""}}],
  "risk": "low"|"medium"|"high",
  "distinctiveness": {"tier": "...", "score": 1-5, "explanation": "..."${isBilingual ? ', "explanation_en": "..."' : ""}},
  "dupont": [{"factor": "...", "verdict": "...", "reasoning": "..."${isBilingual ? ', "reasoning_en": "..."' : ""}}],
  "riskSummary": "..."${isBilingual ? ',\n  "riskSummary_en": "..."' : ""}
}`;

  const defaultDistinctiveness: DistinctivenessAssessment = { tier: "arbitrary", score: 4, explanation: "", explanation_en: "" };
  const defaultDupont: DupontFactor[] = [
    "similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
    "strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
    "variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors"
  ].map(factor => ({ factor, verdict: "neutral" as const, reasoning: "", reasoning_en: "" }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Mexican trademark law expert. Return only valid JSON with no markdown wrapping." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: isBilingual ? 5000 : 3000,
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
    const dupont: DupontFactor[] = (parsed.dupont ?? defaultDupont).filter(
      (f: Record<string, unknown>) => f.factor && f.verdict && f.reasoning
    );
    const rawD = parsed.distinctiveness ?? {};
    const distinctiveness: DistinctivenessAssessment = {
      tier: rawD.tier ?? "arbitrary",
      score: typeof rawD.score === "number" ? rawD.score : 4,
      explanation: rawD.explanation ?? "",
      explanation_en: rawD.explanation_en ?? rawD.explanation ?? "",
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
    return arr.filter((e): e is TranslationFlag =>
      typeof e === "object" && e !== null &&
      "languageCode" in e && "translatedForm" in e && "risk" in e && "details" in e
    );
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { markName, classes = [], language = "en", goodsServices = "" } = body as {
      markName: string; classes?: number[]; language?: string; goodsServices?: string;
    };

    if (!markName?.trim()) {
      return new Response(JSON.stringify({ error: "markName is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = DISCLAIMERS[language] ? language : "en";

    // Run all analyses in parallel — translation analysis runs alongside the main checks
    const [webResult, marciaResult, domainResults, registrabilityResult, translationAnalysis] = await Promise.all([
      searchWeb(apiKey, markName.trim(), classes, goodsServices, lang),
      searchMarcia(markName.trim(), classes),
      checkDomains(markName.trim()),
      analyzeRegistrability(apiKey, markName.trim(), classes, goodsServices, lang),
      analyzeTranslations(apiKey, markName.trim(), classes, goodsServices, lang),
    ]);

    let risk: "low" | "medium" | "high" = webResult.risk;
    if (marciaResult.totalCount > 0) {
      const hasExactMatch = marciaResult.findings.some(f => f.name.toLowerCase().trim() === markName.toLowerCase().trim());
      if (hasExactMatch || marciaResult.totalCount >= 5) risk = "high";
      else if (risk === "low") risk = "medium";
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

    return new Response(JSON.stringify({
      risk,
      webFindings: webResult.findings,
      marciaFindings: marciaResult.findings,
      marciaTotalCount: marciaResult.totalCount,
      marciaUrl: marciaResult.marciaUrl,
      domainResults,
      registrabilityFlags: registrabilityResult.flags,
      registrabilityRisk: registrabilityResult.risk,
      dupont: registrabilityResult.dupont,
      distinctiveness: registrabilityResult.distinctiveness,
      riskSummary: registrabilityResult.riskSummary,
      riskSummary_en: registrabilityResult.riskSummary_en,
      translationAnalysis,
      searchLanguage: lang,
      disclaimer: DISCLAIMERS[lang],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("verify-trademark error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
