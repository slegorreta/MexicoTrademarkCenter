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
  ja: "これは自動化された予備的スクリーニングに過ぎません。法的助言や正式なクリアランス意見を構成するものではありません。出願前に必ず資格のある商標弁護士に相談してください。",
};

// Related Nice Classes for cross-class searching
const RELATED_CLASSES: Record<number, number[]> = {
  3: [5, 44], 5: [3, 44], 9: [42, 38], 25: [18, 24, 26], 18: [25],
  24: [25], 26: [25], 35: [42, 36], 36: [35], 38: [9, 42],
  39: [40], 40: [39], 41: [42, 35], 42: [9, 35, 38, 41],
  29: [30, 31, 32, 43], 30: [29, 31, 32, 43], 31: [29, 30],
  32: [29, 30, 43], 33: [32, 43], 43: [29, 30, 32, 33], 44: [3, 5],
};

function getRelatedClasses(classes: number[]): number[] {
  const related = new Set<number>();
  for (const c of classes) {
    for (const r of (RELATED_CLASSES[c] ?? [])) {
      if (!classes.includes(r)) related.add(r);
    }
  }
  return Array.from(related);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ViennaCodeResult {
  code: string;
  description: string;
  confidence: "high" | "medium" | "low";
}

export interface FigurativeFinding {
  name: string;
  status: string;
  classNum: string;
  holder: string;
  imageUrl?: string;
}

export interface PlaybookScores {
  distinctivenessScore: number;       // 0–100 (§3)
  similarityRiskScore: number;        // 0–100 (§12)
  registrabilityProbability: number;  // 0–100 (§12)
  impiObjectionProbability: number;   // 0–100 (§12)
  riskLevel: "Low" | "Moderate" | "High" | "Severe"; // §12 tiers
  dominantElements: string[];         // §5
  visualStyle: string;                // §6
  silhouetteDescription: string;      // §4
  industrySaturation: "low" | "medium" | "high"; // §9
  isDecorativeRisk: boolean;          // §8
  riskFactors: string[];              // §14
  escalationRequired: boolean;        // §14
  recommendation: string;
  riskSummary: string;
  riskSummary_en: string;
}

export interface FigurativeResult {
  markType: "image-only" | "mixed" | "text-only";
  viennaCodes: ViennaCodeResult[];
  designDescription: string;
  designDescription_en: string;
  scores: PlaybookScores;
  marciaFindings: FigurativeFinding[];
  marciaTotalCount: number;
  marciaUrl: string;
  disclaimer: string;
  textMarkName?: string;
}

// ── Step 1: GPT-5.4 Vision — design profile extraction ────────────────────────
// Performs ALL design-side analysis in a single call (§3, §4, §5, §6, §8, §9, §10)
async function extractDesignProfile(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  classes: number[],
  goodsServices: string,
  language: string,
): Promise<{
  viennaCodes: ViennaCodeResult[];
  designDescription: string;
  designDescription_en: string;
  dominantElements: string[];
  visualStyle: string;
  silhouetteDescription: string;
  distinctivenessScore: number;
  industrySaturation: "low" | "medium" | "high";
  isDecorativeRisk: boolean;
  colorProfile: string;
}> {
  const classCtx = classes.length > 0 ? `Applied-for Nice classes: ${classes.join(", ")}.` : "";
  const goodsCtx = goodsServices ? `Goods/services: ${goodsServices}.` : "";

  const systemPrompt = `You are a senior Mexican trademark attorney and visual identity specialist trained in the IMPI design marks registrability framework.

Analyze the uploaded logo/design image and return a comprehensive JSON profile covering ALL of the following dimensions:

1. VIENNA CLASSIFICATION CODES (international figurative mark system):
   - Identify 3–8 codes covering all significant visual elements
   - Format: "XX.YY.ZZ" or "XX.YY" — include subcategory when confident
   - Common categories: 02.xx (human figures), 03.xx (animals), 04.xx (fantastical beings), 05.xx (plants/flowers), 07.xx (structures/buildings), 08.xx (food/beverages), 16.xx (objects/items), 17.xx (symbols/emblems/crowns/shields), 18.xx (geometric shapes), 19.xx (abstract/stylized), 26.xx (letters/numerals/text), 29.xx (colors/backgrounds)

2. DISTINCTIVENESS SCORE (0–100) per IMPI criteria:
   - Evaluate: originality, complexity, memorability, industry commonality, decorative vs trademark function
   - Penalize heavily: simple geometric shapes, generic swooshes, arrows, neutral patterns, common startup/AI aesthetics
   - Reward: unique compound designs, distinctive character marks, memorable silhouettes
   - Score 0–30 = generic/decorative, 31–60 = moderate, 61–80 = good, 81–100 = highly distinctive

3. SILHOUETTE ANALYSIS (most important factor under Mexican trademark practice):
   - Describe the outer contour, shape geometry, proportions, orientation, symmetry, visual rhythm
   - Be specific: "circular badge with a stylized eagle silhouette facing right, asymmetric wingspan"

4. DOMINANT VISUAL ELEMENTS (list all that apply):
   - Animals (specify species), Wings, Crown, Shield, Monogram/Letter, Star/Sun, Abstract geometric core, Face/Portrait, Plant/Leaf, etc.
   - These receive heightened risk weighting in IMPI analysis

5. VISUAL STYLE CATEGORY (one primary, one secondary if applicable):
   - Minimalist, Futuristic, Luxury, Cyberpunk, Tribal, Monoline, Low-poly, AI-tech, Classic/Traditional, Handcrafted, Bold/Geometric, Organic, Heraldic, Vintage

6. INDUSTRY SATURATION (low / medium / high):
   - "high" for: hexagons, circuit graphics, orbit patterns, neural structures, gradient spheres, minimalist swooshes, AI-wave graphics, generic tech logos
   - "medium" for moderately common styles in the applied industry
   - "low" for unusual or distinctive design approaches

7. DECORATIVE RISK (true/false):
   - true if the design appears primarily ornamental/decorative rather than functioning as a source identifier
   - true if template-generated or stock iconography style

8. COLOR PROFILE (brief, noting that color has lower weight than structure under Mexican practice)

9. DESIGN DESCRIPTION in the user's language and in English

Return ONLY a valid JSON object:
{
  "viennaCodes": [{"code": "XX.YY", "description": "...", "confidence": "high"|"medium"|"low"}],
  "designDescription": "...",
  "designDescription_en": "...",
  "dominantElements": ["..."],
  "visualStyle": "...",
  "silhouetteDescription": "...",
  "distinctivenessScore": 0-100,
  "industrySaturation": "low"|"medium"|"high",
  "isDecorativeRisk": true|false,
  "colorProfile": "..."
}`;

  const langLabel = { en: "English", es: "Spanish", zh: "Simplified Chinese", de: "German", fr: "French", hi: "Hindi", pt: "Portuguese", ja: "Japanese" }[language] ?? "English";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-5.4",
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this trademark design/logo image comprehensively. ${classCtx} ${goodsCtx} Provide the "designDescription" in ${langLabel} and "designDescription_en" always in English.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(35000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI vision error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  try {
    const p = JSON.parse(cleaned);
    return {
      viennaCodes: p.viennaCodes ?? [],
      designDescription: p.designDescription ?? "",
      designDescription_en: p.designDescription_en ?? p.designDescription ?? "",
      dominantElements: p.dominantElements ?? [],
      visualStyle: p.visualStyle ?? "Unknown",
      silhouetteDescription: p.silhouetteDescription ?? "",
      distinctivenessScore: Math.min(100, Math.max(0, Number(p.distinctivenessScore) || 0)),
      industrySaturation: p.industrySaturation ?? "medium",
      isDecorativeRisk: Boolean(p.isDecorativeRisk),
      colorProfile: p.colorProfile ?? "",
    };
  } catch {
    return {
      viennaCodes: [], designDescription: "", designDescription_en: "",
      dominantElements: [], visualStyle: "Unknown", silhouetteDescription: "",
      distinctivenessScore: 50, industrySaturation: "medium", isDecorativeRisk: false, colorProfile: "",
    };
  }
}

// ── Step 2: GPT-5.4 — consumer perception + full scoring (§7, §11, §12, §14) ─
async function analyzeRiskAndScores(
  apiKey: string,
  markType: "image-only" | "mixed" | "text-only",
  designProfile: {
    designDescription_en: string;
    dominantElements: string[];
    visualStyle: string;
    silhouetteDescription: string;
    distinctivenessScore: number;
    industrySaturation: "low" | "medium" | "high";
    isDecorativeRisk: boolean;
  } | null,
  textMarkName: string | undefined,
  classes: number[],
  goodsServices: string,
  findings: FigurativeFinding[],
  language: string,
): Promise<PlaybookScores> {
  const langLabel = { en: "English", es: "Spanish", zh: "Simplified Chinese", de: "German", fr: "French", hi: "Hindi", pt: "Portuguese", ja: "Japanese" }[language] ?? "English";

  const findingsText = findings.length > 0
    ? findings.slice(0, 8).map(f =>
        `"${f.name}" (Class ${f.classNum}, status: ${f.status}, holder: ${f.holder})`
      ).join("; ")
    : "No similar marks found in the IMPI MARCia database for the searched classes.";

  const classCtx = classes.length > 0
    ? `Applied-for Nice Classification classes: ${classes.join(", ")}.`
    : "No Nice classes specified.";

  let designContext = "";
  if (markType !== "text-only" && designProfile) {
    designContext = `
DESIGN PROFILE (from image analysis):
- Description: ${designProfile.designDescription_en}
- Dominant visual elements: ${designProfile.dominantElements.join(", ") || "none identified"}
- Visual style: ${designProfile.visualStyle}
- Silhouette: ${designProfile.silhouetteDescription}
- Preliminary distinctiveness score: ${designProfile.distinctivenessScore}/100
- Industry saturation: ${designProfile.industrySaturation}
- Decorative/ornamental risk: ${designProfile.isDecorativeRisk ? "YES — appears decorative rather than source-identifying" : "No significant concern"}`;
  } else if (markType === "text-only" && textMarkName) {
    designContext = `\nMARK NAME (text-only search): "${textMarkName}"`;
  }

  const mixedNote = markType === "mixed" && textMarkName
    ? `\nThis is a MIXED MARK combining a design element with the text "${textMarkName}". Evaluate both dimensions.`
    : "";

  const prompt = `You are a senior Mexican trademark attorney conducting a IMPI design mark registrability analysis using the playbook framework.

${designContext}${mixedNote}

${classCtx}
Goods/services: ${goodsServices || "not specified"}

IMPI MARCia database findings for searched classes:
${findingsText}

ANALYSIS FRAMEWORK — evaluate each dimension carefully:

§3 DISTINCTIVENESS: Is the design original, complex, memorable, industry-specific, or primarily decorative?
§4 SILHOUETTE: Would the overall silhouette create a likelihood of confusion with any finding above?
§5 DOMINANT ELEMENTS: Do dominant elements (animals, wings, crowns, shields, monograms, stars) overlap with findings?
§6 STYLE: Do the marks share the same visual language and commercial impression even if technically different?
§7 CONSUMER PERCEPTION: Simulate imperfect consumer recollection — would an ordinary Mexican consumer confuse these marks in the marketplace?
§9 INDUSTRY SATURATION: Is this design style overused in the relevant industry, reducing effective distinctiveness?
§10 COLOR: Deprioritize color differences — focus on shape, structure, composition, silhouette.
§11 NICE CLASSIFICATION: Evaluate commercial proximity between applied-for classes and classes of conflicting marks.
§14 ESCALATION: Flag for mandatory attorney review if: similarity risk > 50, famous mark resemblance, substantial silhouette overlap, highly saturated startup/AI aesthetics, luxury branding resemblance.

SCORING SYSTEM (from the playbook, §12):
- distinctivenessScore (0–100): ability to function as source identifier
- similarityRiskScore (0–100): likelihood of confusion with found marks; 0–25 Low, 26–50 Moderate, 51–75 High, 76–100 Severe
- registrabilityProbability (0–100): probability of successful registration at IMPI
- impiObjectionProbability (0–100): probability IMPI raises an objection

Risk tiers from similarityRiskScore: 0–25 = "Low", 26–50 = "Moderate", 51–75 = "High", 76–100 = "Severe"

Return ONLY valid JSON:
{
  "distinctivenessScore": 0-100,
  "similarityRiskScore": 0-100,
  "registrabilityProbability": 0-100,
  "impiObjectionProbability": 0-100,
  "riskLevel": "Low"|"Moderate"|"High"|"Severe",
  "dominantElements": ["..."],
  "visualStyle": "...",
  "silhouetteDescription": "...",
  "industrySaturation": "low"|"medium"|"high",
  "isDecorativeRisk": true|false,
  "riskFactors": ["..."],
  "escalationRequired": true|false,
  "recommendation": "one sentence recommendation",
  "riskSummary": "2-3 sentence summary in ${langLabel}",
  "riskSummary_en": "same summary in English"
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-5.4",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    return fallbackScores();
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  try {
    const p = JSON.parse(cleaned);
    const simRisk = Math.min(100, Math.max(0, Number(p.similarityRiskScore) || 0));
    const riskLevel: PlaybookScores["riskLevel"] =
      simRisk <= 25 ? "Low" : simRisk <= 50 ? "Moderate" : simRisk <= 75 ? "High" : "Severe";
    return {
      distinctivenessScore: Math.min(100, Math.max(0, Number(p.distinctivenessScore) || 50)),
      similarityRiskScore: simRisk,
      registrabilityProbability: Math.min(100, Math.max(0, Number(p.registrabilityProbability) || 50)),
      impiObjectionProbability: Math.min(100, Math.max(0, Number(p.impiObjectionProbability) || 50)),
      riskLevel,
      dominantElements: Array.isArray(p.dominantElements) ? p.dominantElements : [],
      visualStyle: p.visualStyle ?? "Unknown",
      silhouetteDescription: p.silhouetteDescription ?? "",
      industrySaturation: p.industrySaturation ?? "medium",
      isDecorativeRisk: Boolean(p.isDecorativeRisk),
      riskFactors: Array.isArray(p.riskFactors) ? p.riskFactors : [],
      escalationRequired: Boolean(p.escalationRequired),
      recommendation: p.recommendation ?? "",
      riskSummary: p.riskSummary ?? "",
      riskSummary_en: p.riskSummary_en ?? p.riskSummary ?? "",
    };
  } catch {
    return fallbackScores();
  }
}

function fallbackScores(): PlaybookScores {
  return {
    distinctivenessScore: 50, similarityRiskScore: 50,
    registrabilityProbability: 50, impiObjectionProbability: 50,
    riskLevel: "Moderate", dominantElements: [], visualStyle: "Unknown",
    silhouetteDescription: "", industrySaturation: "medium", isDecorativeRisk: false,
    riskFactors: [], escalationRequired: false, recommendation: "",
    riskSummary: "", riskSummary_en: "",
  };
}

// ── MARCia session bootstrap ─────────────────────────────────────────────────
async function getMarciaSession(): Promise<{ headers: Record<string, string>; ok: boolean }> {
  const BASE = "https://marcia.impi.gob.mx/marcas";
  try {
    const initRes = await fetch(`${BASE}/search/quick`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!initRes.ok) return { headers: {}, ok: false };

    const setCookieHeaders: string[] = [];
    initRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") setCookieHeaders.push(value);
    });
    const cookieMap: Record<string, string> = {};
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      const eqIdx = pair.indexOf("=");
      if (eqIdx > -1) cookieMap[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim();
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
    return { headers: apiHeaders, ok: true };
  } catch {
    return { headers: {}, ok: false };
  }
}

// ── MARCia search (Vienna codes or text query) ───────────────────────────────
async function searchMarciaQuery(
  apiHeaders: Record<string, string>,
  textQuery: string,
  viennaCodes: string[],
  allClasses: number[],
): Promise<{ findings: FigurativeFinding[]; totalCount: number }> {
  const BASE = "https://marcia.impi.gob.mx/marcas";
  try {
    const recordRes = await fetch(`${BASE}/search/internal/record`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        _type: "Search$Quick",
        query: textQuery.trim(),
        images: [],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!recordRes.ok) return { findings: [], totalCount: 0 };

    const record = await recordRes.json();
    const searchId: string = record.id;
    const totalCount: number = record.count ?? 0;
    if (!searchId) return { findings: [], totalCount: 0 };

    const resultRes = await fetch(`${BASE}/search/internal/result`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        searchId,
        pageSize: 25,
        pageNumber: 0,
        statusFilter: [],
        viennaCodeFilter: viennaCodes,
        niceClassFilter: allClasses.length > 0 ? allClasses : [],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resultRes.ok) return { findings: [], totalCount };

    const resultData = await resultRes.json();
    const items: Record<string, unknown>[] = resultData.resultPage ?? [];
    const findings: FigurativeFinding[] = items.slice(0, 25).map(item => ({
      name: String(item.title ?? ""),
      status: String(item.status ?? ""),
      classNum: Array.isArray(item.classes) ? (item.classes as number[]).join(", ") : "",
      holder: Array.isArray(item.owners) ? (item.owners as string[]).join(", ") : String(item.owners ?? ""),
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
    })).filter(f => f.name);

    return { findings, totalCount };
  } catch {
    return { findings: [], totalCount: 0 };
  }
}

// ── Merge and deduplicate findings ───────────────────────────────────────────
function mergeFindings(a: FigurativeFinding[], b: FigurativeFinding[]): FigurativeFinding[] {
  const seen = new Set<string>();
  const out: FigurativeFinding[] = [];
  for (const f of [...a, ...b]) {
    if (f.name && !seen.has(f.name)) { seen.add(f.name); out.push(f); }
  }
  return out;
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      imageBase64 = "",
      mimeType = "image/png",
      classes = [],
      language = "en",
      goodsServices = "",
      textMarkName = "",
    } = body as {
      imageBase64?: string;
      mimeType?: string;
      classes?: number[];
      language?: string;
      goodsServices?: string;
      textMarkName?: string;
    };

    const hasImage = imageBase64?.trim().length > 0;
    const hasText = textMarkName?.trim().length > 0;

    if (!hasImage && !hasText) {
      return new Response(JSON.stringify({ error: "Provide imageBase64, textMarkName, or both" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine mark type
    const markType: "image-only" | "mixed" | "text-only" =
      hasImage && hasText ? "mixed" : hasImage ? "image-only" : "text-only";

    const lang = DISCLAIMERS[language] ? language : "en";
    const allClasses = classes.length > 0 ? [...classes, ...getRelatedClasses(classes)] : [];

    const BASE = "https://marcia.impi.gob.mx/marcas";
    const textForUrl = textMarkName?.trim() ?? "";
    const marciaUrl = `${BASE}/search/quick${textForUrl ? `?query=${encodeURIComponent(textForUrl)}` : ""}`;

    // ── Run Vision (if image present) + MARCia session in parallel ──────────
    const [designProfile, marciaSession] = await Promise.all([
      hasImage
        ? extractDesignProfile(apiKey, imageBase64, mimeType, classes, goodsServices, lang)
        : Promise.resolve(null),
      getMarciaSession(),
    ]);

    // ── MARCia searches ──────────────────────────────────────────────────────
    let marciaFindings: FigurativeFinding[] = [];
    let marciaTotalCount = 0;

    if (marciaSession.ok) {
      const highConfidenceCodes = designProfile
        ? designProfile.viennaCodes
            .filter(c => c.confidence === "high" || c.confidence === "medium")
            .map(c => c.code)
        : [];

      if (markType === "image-only") {
        // Vienna codes only — no text query
        const r = await searchMarciaQuery(marciaSession.headers, "", highConfidenceCodes, allClasses);
        marciaFindings = r.findings;
        marciaTotalCount = r.totalCount;
      } else if (markType === "text-only") {
        // Text query only — no Vienna codes
        const r = await searchMarciaQuery(marciaSession.headers, textMarkName.trim(), [], allClasses);
        marciaFindings = r.findings;
        marciaTotalCount = r.totalCount;
      } else {
        // Mixed — run both in parallel, merge results
        const [viennaResult, textResult] = await Promise.all([
          searchMarciaQuery(marciaSession.headers, "", highConfidenceCodes, allClasses),
          searchMarciaQuery(marciaSession.headers, textMarkName.trim(), [], allClasses),
        ]);
        marciaFindings = mergeFindings(viennaResult.findings, textResult.findings);
        marciaTotalCount = Math.max(viennaResult.totalCount, textResult.totalCount);
      }
    }

    // ── Scoring + risk analysis (uses MARCia results + design profile) ───────
    const scores = await analyzeRiskAndScores(
      apiKey,
      markType,
      designProfile,
      textMarkName?.trim() || undefined,
      classes,
      goodsServices,
      marciaFindings,
      lang,
    );

    // Merge design profile fields into scores when available
    if (designProfile && markType !== "text-only") {
      if (!scores.dominantElements.length) scores.dominantElements = designProfile.dominantElements;
      if (scores.visualStyle === "Unknown") scores.visualStyle = designProfile.visualStyle;
      if (!scores.silhouetteDescription) scores.silhouetteDescription = designProfile.silhouetteDescription;
      if (scores.industrySaturation === "medium") scores.industrySaturation = designProfile.industrySaturation;
      if (!scores.isDecorativeRisk) scores.isDecorativeRisk = designProfile.isDecorativeRisk;
      // Blend distinctiveness: average vision score with scoring model score
      scores.distinctivenessScore = Math.round(
        (scores.distinctivenessScore + designProfile.distinctivenessScore) / 2
      );
    }

    const result: FigurativeResult = {
      markType,
      viennaCodes: designProfile?.viennaCodes ?? [],
      designDescription: designProfile?.designDescription ?? "",
      designDescription_en: designProfile?.designDescription_en ?? "",
      scores,
      marciaFindings,
      marciaTotalCount,
      marciaUrl,
      disclaimer: DISCLAIMERS[lang],
      textMarkName: textMarkName?.trim() || undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-figurative error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
