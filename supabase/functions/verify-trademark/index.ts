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

async function searchMarciaHTML(markName: string, classes: number[]): Promise<{
  findings: Array<{ name: string; status: string; classNum: string; holder: string }>;
  marciaUrl: string;
}> {
  const encoded = encodeURIComponent(markName);
  const marciaUrl = `https://marcia.impi.gob.mx/marcas/search/quick?query=${encoded}`;

  try {
    const res = await fetch(marciaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TrademarkClearanceBot/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { findings: [], marciaUrl };
    }

    const html = await res.text();

    const findings: Array<{ name: string; status: string; classNum: string; holder: string }> = [];

    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

    let rowMatch;
    let rowCount = 0;
    while ((rowMatch = rowPattern.exec(html)) !== null && rowCount < 20) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];
      let cellMatch;
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
        const text = cellMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (text) cells.push(text);
      }
      if (cells.length >= 3) {
        const name = cells[0] || "";
        const classNum = cells[1] || "";
        const status = cells[2] || "";
        const holder = cells[3] || "";

        if (name && name.length > 1 && !/denominaci[oó]n/i.test(name)) {
          const allClasses = classes.length > 0
            ? [...classes, ...getRelatedClasses(classes)]
            : [];

          const classNumParsed = parseInt(classNum);
          const inScope = allClasses.length === 0 ||
            allClasses.includes(classNumParsed) ||
            classNum === "";

          if (inScope) {
            findings.push({ name, status, classNum, holder });
            rowCount++;
          }
        }
      }
    }

    return { findings: findings.slice(0, 10), marciaUrl };
  } catch (err) {
    console.error("MARCia fetch error:", err);
    return { findings: [], marciaUrl };
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
    const [webResult, marciaResult, domainResults] = await Promise.all([
      searchWeb(apiKey, markName.trim(), classes),
      searchMarciaHTML(markName.trim(), classes),
      checkDomains(markName.trim()),
    ]);

    // Compute combined risk
    let risk: "low" | "medium" | "high" = webResult.risk;
    if (marciaResult.findings.length > 0) {
      const hasExactMatch = marciaResult.findings.some(
        f => f.name.toLowerCase().trim() === markName.toLowerCase().trim()
      );
      if (hasExactMatch) {
        risk = "high";
      } else if (risk === "low") {
        risk = "medium";
      }
    }

    const disclaimer =
      language === "zh" ? DISCLAIMER_ZH :
      language === "es" ? DISCLAIMER_ES :
      DISCLAIMER;

    const result = {
      risk,
      webFindings: webResult.findings,
      marciaFindings: marciaResult.findings,
      marciaUrl: marciaResult.marciaUrl,
      domainResults,
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
