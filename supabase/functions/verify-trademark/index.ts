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

// Related Nice classes that are commonly examined together
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

// Normalize a mark name into a domain-safe slug
function toDomainSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]/g, "")       // keep only alphanumeric
    .trim();
}

interface DomainResult {
  domain: string;
  available: boolean | null; // null = could not determine
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
        // Use Cloudflare DNS-over-HTTPS to check if a domain resolves
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
        // Status 3 = NXDOMAIN (domain does not exist → likely available)
        // Status 0 = NOERROR with answers → domain is taken
        const nxdomain = data.Status === 3;
        const hasAnswers = Array.isArray(data.Answer) && data.Answer.length > 0;

        if (nxdomain) {
          results.push({ domain, available: true, status: "available" });
        } else if (hasAnswers) {
          results.push({ domain, available: false, status: "taken" });
        } else {
          // No error, no answers — parked or NS-only; treat as taken
          results.push({ domain, available: false, status: "taken" });
        }
      } catch {
        results.push({ domain, available: null, status: "unknown" });
      }
    })
  );

  // Return in consistent tld order
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
    // Step 1: Load the SPA shell to obtain session cookies + CSRF token
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

    // Parse cookies from the init response
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

    // Also try to extract CSRF from HTML meta tag
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

    // Step 2: Create a search record
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

    // Step 3: Fetch first page of results (up to 20)
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

async function analyzeRegistrability(apiKey: string, markName: string, classes: number[]): Promise<{
  flags: RegistrabilityFlag[];
  risk: "low" | "medium" | "high";
}> {
  const classContext = classes.length > 0
    ? ` applied for goods/services in Nice Classification class(es) ${classes.join(", ")}`
    : "";

  const prompt = `You are an expert Mexican trademark attorney. Analyze the trademark "${markName}"${classContext} against each of the following 13 absolute grounds for refusal under Mexico's Ley Federal de Protección a la Propiedad Industrial (LFPPI). For every category that may apply, return a flag. Return ONLY a JSON object.

Categories to evaluate:
1. "generic_descriptive" — Generic or descriptive terms that directly describe the product/service (e.g., "Cremoso" for yogurt, "Fast Delivery" for courier)
2. "functional_shape" — Common or functional product shapes/forms necessary for technical function
3. "deceptive" — Signs that mislead about geographic origin, quality, or nature (e.g., "Swiss Chocolate" for non-Swiss products)
4. "official_emblems" — National flags, government emblems, symbols of international organizations (UN, Red Cross, etc.)
5. "personal_identity" — Names, likenesses, signatures of real persons without consent (celebrities, public figures)
6. "confusingly_similar" — Names visually, phonetically, or conceptually similar to well-known existing brands that could cause consumer confusion
7. "famous_mark" — Reproduction or imitation of a famous or notorious mark even in unrelated classes (e.g., Apple, Google, Ferrari)
8. "protected_characters" — Titles of famous works or well-known fictional characters/franchises (Harry Potter, Marvel, Star Wars)
9. "geographic_indication" — Protected geographic indications or appellations of origin (Tequila, Mezcal, Champagne, Roquefort)
10. "immoral_offensive" — Signs contrary to public order, morality, or applicable law (offensive, discriminatory, or illegal terms)
11. "isolated_color" — A single color with no other distinctive elements
12. "non_distinctive_nontrad" — Non-traditional marks (sounds, scents, trade dress) that lack distinctiveness or are functional
13. "bad_faith" — Marks that appear to be filed in bad faith to pirate an existing brand or block legitimate use

Highly weak terms to flag under generic_descriptive: "Tech", "Digital", "AI", "Legal", "Fintech", "Mexico", "Center", "Solutions", "Digital", "Online", "Smart", "Pro", "Plus", "Max", "Global", "International", "Express", "Fast", "Premium", "Elite", "Quality", "Best", "Super", "Ultra".

Return:
{
  "flags": [
    {
      "category": "<one of the 13 keys above>",
      "severity": "low" | "medium" | "high",
      "explanation": "<one sentence explaining why this category may apply to this specific mark>"
    }
  ],
  "risk": "low" | "medium" | "high",
  "summary": "<one sentence overall assessment>"
}

Only include flags that genuinely apply. If no issues are found, return an empty flags array with risk "low". Return ONLY the JSON, no markdown.`;

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
          { role: "system", content: "You are a Mexican trademark law expert. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Registrability analysis API error:", response.status);
      return { flags: [], risk: "low" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { flags: [], risk: "low" };

    const parsed = JSON.parse(content);
    const flags: RegistrabilityFlag[] = (parsed.flags ?? []).filter(
      (f: Record<string, unknown>) => f.category && f.severity && f.explanation
    );
    const risk: "low" | "medium" | "high" = parsed.risk ?? (flags.length > 0 ? "medium" : "low");
    return { flags, risk };
  } catch (err) {
    console.error("Registrability analysis error:", err);
    return { flags: [], risk: "low" };
  }
}

async function searchWeb(apiKey: string, markName: string, classes: number[]): Promise<{
  findings: string[];
  risk: "low" | "medium" | "high";
}> {
  const classContext = classes.length > 0
    ? ` in Nice Classification class(es) ${classes.join(", ")}`
    : "";

  const prompt = `Search the web for existing trademark registrations, brand names, or companies named "${markName}"${classContext}.

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
              content: `Assess trademark "${markName}"${classContext}: { "risk": "low"|"medium"|"high", "findings": [...strings], "reasoning": "..." }`,
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
    } = body as {
      markName: string;
      classes?: number[];
      language?: string;
    };

    if (!markName || markName.trim().length < 1) {
      return new Response(
        JSON.stringify({ error: "markName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Run all checks in parallel
    const [webResult, marciaResult, domainResults, registrabilityResult] = await Promise.all([
      searchWeb(apiKey, markName.trim(), classes),
      searchMarcia(markName.trim(), classes),
      checkDomains(markName.trim()),
      analyzeRegistrability(apiKey, markName.trim(), classes),
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
    // Factor in registrability risk
    if (registrabilityResult.risk === "high") {
      risk = "high";
    } else if (registrabilityResult.risk === "medium" && risk === "low") {
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
