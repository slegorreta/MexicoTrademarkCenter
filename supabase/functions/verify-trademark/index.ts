import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DISCLAIMER =
  "This is an automated preliminary screening only. It does not constitute legal advice or a formal clearance opinion. Always consult a qualified trademark attorney before filing.";

const DISCLAIMER_ZH =
  "这仅是自动初步筛查，不构成法律建议或正式检索意见。在提交申请前，请务必咨询有资质的商标代理人。";

const DISCLAIMER_ES =
  "Esta es únicamente una verificación preliminar automatizada. No constituye asesoría legal ni una opinión formal de disponibilidad. Consulte a un especialista en marcas antes de presentar su solicitud.";

const RELATED_CLASSES: Record<number, number[]> = {
  3: [5, 44],
  5: [3, 44],
  9: [42, 38],
  25: [18, 24, 26],
  18: [25],
  24: [25],
  35: [42, 36],
  42: [9, 35, 38],
  43: [30, 29, 32, 33],
  41: [42, 35],
  44: [3, 5],
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

        if (!res.ok) {
          results.push({ domain, available: null, status: "unknown" });
          return;
        }

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

    if (!initRes.ok) {
      console.error("MARCia init failed:", initRes.status);
      return { findings: [], marciaUrl, totalCount: 0 };
    }

    const setCookieHeaders: string[] = [];
    initRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") setCookieHeaders.push(value);
    });

    const cookieMap: Record<string, string> = {};
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      const eqIdx = pair.indexOf("=");
      if (eqIdx > -1) {
        const name = pair.slice(0, eqIdx).trim();
        const val = pair.slice(eqIdx + 1).trim();
        cookieMap[name] = val;
      }
    }

    const html = await initRes.text();
    const metaCsrf = html.match(/name=["']_csrf["'][^>]*content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/content=["']([^"']+)["'][^>]*name=["']_csrf["']/i)?.[1]
      ?? "";

    const xsrfToken = cookieMap["XSRF-TOKEN"] ?? metaCsrf;
    const cookieString = Object.entries(cookieMap)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

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

    if (!recordRes.ok) {
      console.error("MARCia record creation failed:", recordRes.status, await recordRes.text());
      return { findings: [], marciaUrl, totalCount: 0 };
    }

    const record = await recordRes.json();
    const searchId: string = record.id;
    const totalCount: number = record.count ?? 0;

    if (!searchId) {
      return { findings: [], marciaUrl, totalCount: 0 };
    }

    const allClasses = classes.length > 0
      ? [...classes, ...getRelatedClasses(classes)]
      : [];

    const resultRes = await fetch(`${BASE}/search/internal/result`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        searchId,
        pageSize: 20,
        pageNumber: 0,
        statusFilter: [],
        viennaCodeFilter: [],
        niceClassFilter: allClasses.length > 0 ? allClasses : [],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!resultRes.ok) {
      console.error("MARCia result fetch failed:", resultRes.status);
      return { findings: [], marciaUrl, totalCount };
    }

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
}

export interface DupontFactor {
  factor: string;
  verdict: "favors_registration" | "neutral" | "against_registration";
  reasoning: string;
}

export interface DistinctivenessAssessment {
  tier: "generic" | "descriptive" | "suggestive" | "arbitrary" | "fanciful";
  score: number;
  explanation: string;
}

async function analyzeRegistrability(
  apiKey: string,
  markName: string,
  classes: number[],
  goodsServices: string
): Promise<{
  flags: RegistrabilityFlag[];
  risk: "low" | "medium" | "high";
  dupont: DupontFactor[];
  distinctiveness: DistinctivenessAssessment;
  riskSummary: string;
}> {
  const classContext = classes.length > 0
    ? ` applied for goods/services in Nice Classification class(es) ${classes.join(", ")}`
    : "";
  const goodsContext = goodsServices
    ? ` covering the following goods/services: "${goodsServices}"`
    : "";

  const prompt = `You are an expert Mexican trademark attorney. Analyze the proposed trademark "${markName}"${classContext}${goodsContext}.

Return a single JSON object with ALL of the following fields. Return ONLY JSON, no markdown.

---

PART 1 — ABSOLUTE GROUNDS (LFPPI)
Evaluate against each of these 13 categories. Only include flags that genuinely apply:
1. "generic_descriptive" — Generic or descriptive terms (e.g., "Cremoso" for yogurt)
2. "functional_shape" — Common or functional product shapes
3. "deceptive" — Signs that mislead about origin, quality, or nature
4. "official_emblems" — National flags, government symbols, international org emblems
5. "personal_identity" — Real person's name/likeness without consent
6. "confusingly_similar" — Visually, phonetically, or conceptually similar to well-known existing brands
7. "famous_mark" — Imitation of a famous/notorious mark even in unrelated classes
8. "protected_characters" — Famous fictional characters or franchise titles
9. "geographic_indication" — Protected appellations of origin (Tequila, Mezcal, Champagne)
10. "immoral_offensive" — Contrary to public order or morality
11. "isolated_color" — A single color with no other distinctive elements
12. "non_distinctive_nontrad" — Non-traditional marks lacking distinctiveness
13. "bad_faith" — Filed to pirate an existing brand

Weak generic terms to flag: Tech, Digital, AI, Legal, Fintech, Mexico, Center, Solutions, Online, Smart, Pro, Plus, Max, Global, International, Express, Fast, Premium, Elite, Quality, Best, Super, Ultra.

---

PART 2 — DISTINCTIVENESS
Rate the mark on the spectrum from generic to fanciful:
- "generic": Common word for the goods/services (lowest protection, likely refused)
- "descriptive": Describes a feature or quality of the goods/services
- "suggestive": Suggests a quality without directly describing it
- "arbitrary": Real word with no connection to the goods/services
- "fanciful": Invented word with no prior meaning (strongest protection)

Score: 1=generic, 2=descriptive, 3=suggestive, 4=arbitrary, 5=fanciful

---

PART 3 — ALL 13 DUPONT FACTORS
Apply all 13 classic DuPont likelihood-of-confusion factors, informed by the specific goods/services described.
Use these exact factor names (in "factor" field):
1. "similarity_of_marks"
2. "relatedness_of_goods"
3. "channels_of_trade"
4. "purchasing_conditions"
5. "strength_of_cited_mark"
6. "actual_confusion"
7. "number_of_similar_marks"
8. "length_of_use"
9. "variety_of_goods"
10. "market_interface"
11. "right_to_exclude"
12. "extent_of_confusion"
13. "other_factors"

Each factor must have one of: "favors_registration", "neutral", "against_registration"

---

PART 4 — PLAIN-LANGUAGE RISK SUMMARY
Write a 3-4 sentence plain-language paragraph summarizing the overall clearance findings. Address: (1) the mark's registrability outlook, (2) key risks or conflicts, (3) recommended next steps. Write as if explaining to a business owner who is not a lawyer.

---

Return exactly this JSON structure:
{
  "flags": [{"category": "...", "severity": "low"|"medium"|"high", "explanation": "..."}],
  "risk": "low"|"medium"|"high",
  "distinctiveness": {"tier": "generic"|"descriptive"|"suggestive"|"arbitrary"|"fanciful", "score": 1-5, "explanation": "..."},
  "dupont": [{"factor": "...", "verdict": "favors_registration"|"neutral"|"against_registration", "reasoning": "..."}],
  "riskSummary": "..."
}`;

  const defaultDistinctiveness: DistinctivenessAssessment = { tier: "arbitrary", score: 4, explanation: "Unable to assess distinctiveness." };
  const defaultDupont: DupontFactor[] = [
    "similarity_of_marks", "relatedness_of_goods", "channels_of_trade", "purchasing_conditions",
    "strength_of_cited_mark", "actual_confusion", "number_of_similar_marks", "length_of_use",
    "variety_of_goods", "market_interface", "right_to_exclude", "extent_of_confusion", "other_factors"
  ].map(factor => ({ factor, verdict: "neutral" as const, reasoning: "Analysis unavailable." }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Mexican trademark law expert. Return only valid JSON with no markdown wrapping." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Registrability analysis API error:", response.status);
      return { flags: [], risk: "low", dupont: defaultDupont, distinctiveness: defaultDistinctiveness, riskSummary: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { flags: [], risk: "low", dupont: defaultDupont, distinctiveness: defaultDistinctiveness, riskSummary: "" };

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
    };

    const riskSummary: string = parsed.riskSummary ?? "";

    return { flags, risk, dupont, distinctiveness, riskSummary };
  } catch (err) {
    console.error("Registrability analysis error:", err);
    return { flags: [], risk: "low", dupont: defaultDupont, distinctiveness: defaultDistinctiveness, riskSummary: "" };
  }
}

async function searchWeb(apiKey: string, markName: string, classes: number[], goodsServices: string): Promise<{
  findings: string[];
  risk: "low" | "medium" | "high";
}> {
  const classContext = classes.length > 0
    ? ` in Nice Classification class(es) ${classes.join(", ")}`
    : "";
  const goodsContext = goodsServices ? ` for: ${goodsServices}` : "";

  const prompt = `Search the web for existing trademark registrations, brand names, or companies named "${markName}"${classContext}${goodsContext}.

Focus on:
1. Registered trademarks with this exact name or very similar names
2. Well-known brands or companies using this name
3. Any IMPI (Mexican trademark office) registered marks
4. International trademark registrations (USPTO, EUIPO, WIPO) for this name

Return a JSON object with:
{
  "risk": "low" | "medium" | "high",
  "findings": ["finding 1", "finding 2", ...],
  "reasoning": "brief explanation"
}

Risk levels:
- "high": Exact match found as a registered trademark in the same or related class
- "medium": Similar names found, or registered in different classes, or pending applications
- "low": No significant existing trademarks found with this name

Return only the JSON, no markdown.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const fallbackResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a trademark clearance assistant. Based on your training knowledge, assess if a trademark name is likely already in use. Return JSON only.",
            },
            {
              role: "user",
              content: `Assess trademark "${markName}"${classContext}${goodsContext}: { "risk": "low"|"medium"|"high", "findings": [...strings], "reasoning": "..." }`,
            },
          ],
          temperature: 0.1,
          max_tokens: 600,
          response_format: { type: "json_object" },
        }),
      });

      if (!fallbackResponse.ok) {
        return { findings: ["Web search unavailable — manual clearance search recommended"], risk: "medium" };
      }

      const fallbackData = await fallbackResponse.json();
      const content = fallbackData.choices?.[0]?.message?.content;
      if (!content) return { findings: [], risk: "low" };
      const parsed = JSON.parse(content);
      return { findings: parsed.findings || [], risk: parsed.risk || "medium" };
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
    return { findings: ["Web search unavailable — manual clearance search recommended"], risk: "medium" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      markName,
      classes = [],
      language = "en",
      goodsServices = "",
    } = body as {
      markName: string;
      classes?: number[];
      language?: string;
      goodsServices?: string;
    };

    if (!markName || markName.trim().length < 1) {
      return new Response(
        JSON.stringify({ error: "markName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [webResult, marciaResult, domainResults, registrabilityResult] = await Promise.all([
      searchWeb(apiKey, markName.trim(), classes, goodsServices),
      searchMarcia(markName.trim(), classes),
      checkDomains(markName.trim()),
      analyzeRegistrability(apiKey, markName.trim(), classes, goodsServices),
    ]);

    // Compute combined risk
    let risk: "low" | "medium" | "high" = webResult.risk;
    if (marciaResult.totalCount > 0) {
      const hasExactMatch = marciaResult.findings.some(
        f => f.name.toLowerCase().trim() === markName.toLowerCase().trim()
      );
      if (hasExactMatch || marciaResult.totalCount >= 5) {
        risk = "high";
      } else if (risk === "low") {
        risk = "medium";
      }
    }
    if (registrabilityResult.risk === "high") {
      risk = "high";
    } else if (registrabilityResult.risk === "medium" && risk === "low") {
      risk = "medium";
    }

    // Factor in DuPont: 3+ against_registration → at least medium; 5+ → high
    const dupontAgainst = registrabilityResult.dupont.filter(f => f.verdict === "against_registration").length;
    if (dupontAgainst >= 5 && risk !== "high") {
      risk = "high";
    } else if (dupontAgainst >= 3 && risk === "low") {
      risk = "medium";
    }

    const disclaimer =
      language === "zh" ? DISCLAIMER_ZH :
      language === "es" ? DISCLAIMER_ES :
      DISCLAIMER;

    const result = {
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
      disclaimer,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-trademark error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
