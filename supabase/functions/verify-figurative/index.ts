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

// Vienna Classification top-level codes relevant for AI identification
const VIENNA_CODE_MAP: Record<string, string> = {
  "01": "Celestial bodies, natural phenomena, geographical maps",
  "02": "Human beings",
  "03": "Animals",
  "04": "Supernatural, fantastical, unidentifiable beings",
  "05": "Plants",
  "06": "Landscapes",
  "07": "Constructions, structures",
  "08": "Foods, beverages",
  "09": "Textiles, clothing, headgear, footwear",
  "10": "Tobacco, smokers' articles, matches",
  "11": "Household utensils",
  "12": "Furniture",
  "13": "Lighting, heating, cooling equipment",
  "14": "Machinery",
  "15": "Transport, vehicles",
  "16": "Miscellaneous objects",
  "17": "Heraldry, symbols, emblems",
  "18": "Geometric figures and solids",
  "19": "Motifs of an abstract nature",
  "20": "Plants",
  "24": "Sciences, religion, art, education",
  "25": "Buildings, structures",
  "26": "Letters, numerals, punctuation marks",
  "27": "Inscriptions in various scripts",
  "28": "Coloured backgrounds, surfaces with specific patterns",
  "29": "Colors",
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

export interface FigurativeResult {
  viennaCodes: ViennaCodeResult[];
  designDescription: string;
  designDescription_en: string;
  marciaFindings: FigurativeFinding[];
  marciaTotalCount: number;
  marciaUrl: string;
  riskLevel: "low" | "medium" | "high";
  riskSummary: string;
  riskSummary_en: string;
  markType: "figurative" | "mixed";
  disclaimer: string;
  searchedByText: boolean;
  textMarkName?: string;
}

// ── Vienna code extraction via GPT-4o Vision ────────────────────────────────
async function extractViennaCodes(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  language: string,
): Promise<{ codes: ViennaCodeResult[]; description: string; description_en: string }> {
  const systemPrompt = `You are a professional trademark classification specialist with deep expertise in the Vienna Classification system for figurative/design marks.

Your task: Analyze the provided logo/design image and identify the most relevant Vienna Classification codes.

Vienna Classification is the international system for classifying the figurative elements of trademarks. Return a JSON object with:
- "codes": array of { "code": "XX.YY.ZZ" or "XX.YY", "description": "what this element is", "confidence": "high"|"medium"|"low" }
  - Include 3-8 codes covering all significant visual elements
  - Focus on main category (first 2 digits) and subcategory (4 digits) when clear
  - Common categories: 02.xx (human figures), 03.xx (animals), 04.xx (fantastical beings), 05.xx (plants), 07.xx (structures), 08.xx (food/beverages), 16.xx (objects), 17.xx (symbols), 18.xx (geometric shapes), 19.xx (abstract), 26.xx (letters/text), 29.xx (colors/backgrounds)
- "description": a 2-3 sentence description of the design in the requested language
- "description_en": the same description in English

Respond with valid JSON only, no markdown.`;

  const langInstruction = language !== "en"
    ? `Provide the "description" field in ${language} language, and "description_en" always in English.`
    : `Provide both "description" and "description_en" in English.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this trademark design/logo image and extract Vienna Classification codes. ${langInstruction}`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(content);
    return {
      codes: parsed.codes ?? [],
      description: parsed.description ?? "",
      description_en: parsed.description_en ?? parsed.description ?? "",
    };
  } catch {
    return { codes: [], description: "", description_en: "" };
  }
}

// ── Figurative risk analysis via GPT-4o ──────────────────────────────────────
async function analyzeFigurativeRisk(
  apiKey: string,
  designDescription: string,
  viennaCodes: ViennaCodeResult[],
  classes: number[],
  goodsServices: string,
  findings: FigurativeFinding[],
  markType: "figurative" | "mixed",
  textMarkName: string | undefined,
  language: string,
): Promise<{ riskLevel: "low" | "medium" | "high"; riskSummary: string; riskSummary_en: string }> {
  const codesText = viennaCodes.map(c => `${c.code} (${c.description})`).join(", ");
  const findingsText = findings.length > 0
    ? findings.slice(0, 5).map(f => `"${f.name}" (Class ${f.classNum}, ${f.status})`).join("; ")
    : "No visually similar marks found in the MARCia database for the searched classes.";

  const langLabel = language === "es" ? "Spanish" : language === "zh" ? "Simplified Chinese" : language === "de" ? "German" : language === "fr" ? "French" : language === "hi" ? "Hindi" : language === "pt" ? "Portuguese" : language === "ja" ? "Japanese" : "English";

  const prompt = `You are a Mexican trademark attorney analyzing the registrability of a figurative (design/logo) mark.

Design description: ${designDescription}
Vienna Classification codes identified: ${codesText}
Mark type: ${markType === "mixed" ? `Mixed mark (design + text: "${textMarkName}")` : "Pure figurative/design mark"}
Applied-for classes: ${classes.length > 0 ? classes.join(", ") : "not specified"}
Goods/services: ${goodsServices || "not specified"}

MARCia database findings for these Vienna codes and classes:
${findingsText}

Assess:
1. Risk level: "low" (no similar figurative marks in same/related classes), "medium" (some similar design elements in same/related classes), or "high" (highly similar figurative marks in the same classes)
2. Key risk factors specific to figurative marks: visual similarity, dominant elements, overall commercial impression
3. Whether the design is distinctive enough to be registered

Return JSON: { "riskLevel": "low"|"medium"|"high", "riskSummary": "2-3 sentence summary in ${langLabel}", "riskSummary_en": "same summary in English" }
Respond with valid JSON only.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    return { riskLevel: "low", riskSummary: "", riskSummary_en: "" };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      riskLevel: parsed.riskLevel ?? "low",
      riskSummary: parsed.riskSummary ?? "",
      riskSummary_en: parsed.riskSummary_en ?? parsed.riskSummary ?? "",
    };
  } catch {
    return { riskLevel: "low", riskSummary: "", riskSummary_en: "" };
  }
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

// ── MARCia search by Vienna codes ────────────────────────────────────────────
async function searchMarciaByVienna(
  apiHeaders: Record<string, string>,
  viennaCodes: string[],
  allClasses: number[],
  textQuery?: string,
): Promise<{ findings: FigurativeFinding[]; totalCount: number }> {
  const BASE = "https://marcia.impi.gob.mx/marcas";

  const recordBody: Record<string, unknown> = {
    _type: "Search$Quick",
    query: textQuery ?? "",
    images: [],
  };

  try {
    const recordRes = await fetch(`${BASE}/search/internal/record`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(recordBody),
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

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      imageBase64,
      mimeType = "image/png",
      classes = [],
      language = "en",
      goodsServices = "",
      textMarkName = "",
    } = body as {
      imageBase64: string;
      mimeType?: string;
      classes?: number[];
      language?: string;
      goodsServices?: string;
      textMarkName?: string;
    };

    if (!imageBase64?.trim()) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = DISCLAIMERS[language] ? language : "en";
    const markType: "figurative" | "mixed" = textMarkName?.trim() ? "mixed" : "figurative";

    // Step 1: Extract Vienna codes from the image using GPT-4o Vision
    const { codes: viennaCodes, description, description_en } = await extractViennaCodes(
      apiKey,
      imageBase64,
      mimeType,
      lang,
    );

    // Build list of high-confidence Vienna code strings for MARCia filter
    const highConfidenceCodes = viennaCodes
      .filter(c => c.confidence === "high" || c.confidence === "medium")
      .map(c => c.code);

    const allClasses = classes.length > 0 ? [...classes, ...getRelatedClasses(classes)] : [];

    // Step 2: Search MARCia using Vienna codes (and optional text query for mixed marks)
    const BASE = "https://marcia.impi.gob.mx/marcas";
    const encoded = encodeURIComponent(textMarkName?.trim() ?? description_en?.slice(0, 40) ?? "");
    const marciaUrl = `${BASE}/search/quick${encoded ? `?query=${encoded}` : ""}`;

    const { headers: marciaHeaders, ok: sessionOk } = await getMarciaSession();
    let marciaFindings: FigurativeFinding[] = [];
    let marciaTotalCount = 0;

    if (sessionOk) {
      // For mixed marks, also run a text query in parallel
      if (markType === "mixed" && textMarkName?.trim()) {
        const [viennaResult, textResult] = await Promise.all([
          searchMarciaByVienna(marciaHeaders, highConfidenceCodes, allClasses),
          searchMarciaByVienna(marciaHeaders, [], allClasses, textMarkName.trim()),
        ]);
        // Merge and deduplicate by name
        const seen = new Set<string>();
        for (const f of [...viennaResult.findings, ...textResult.findings]) {
          if (!seen.has(f.name)) { seen.add(f.name); marciaFindings.push(f); }
        }
        marciaTotalCount = Math.max(viennaResult.totalCount, textResult.totalCount);
      } else {
        const result = await searchMarciaByVienna(marciaHeaders, highConfidenceCodes, allClasses);
        marciaFindings = result.findings;
        marciaTotalCount = result.totalCount;
      }
    }

    // Step 3: AI risk analysis
    const { riskLevel, riskSummary, riskSummary_en } = await analyzeFigurativeRisk(
      apiKey,
      description_en,
      viennaCodes,
      classes,
      goodsServices,
      marciaFindings,
      markType,
      textMarkName?.trim() || undefined,
      lang,
    );

    const result: FigurativeResult = {
      viennaCodes,
      designDescription: description,
      designDescription_en: description_en,
      marciaFindings,
      marciaTotalCount,
      marciaUrl,
      riskLevel,
      riskSummary,
      riskSummary_en,
      markType,
      disclaimer: DISCLAIMERS[lang],
      searchedByText: markType === "mixed",
      textMarkName: textMarkName?.trim() || undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-figurative error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
