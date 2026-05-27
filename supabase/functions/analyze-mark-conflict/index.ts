import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      applicantMark: string;
      conflictMark: string;
      conflictHolder?: string;
      conflictStatus?: string;
      conflictClass?: string;
      conflictGoodsServices?: string;
      applicantClasses?: number[];
      applicantGoodsServices?: string;
      language?: string;
      similarityScore?: number;
    };

    const {
      applicantMark,
      conflictMark,
      conflictHolder = "",
      conflictStatus = "",
      conflictClass = "",
      conflictGoodsServices = "",
      applicantClasses = [],
      applicantGoodsServices = "",
      language = "en",
      similarityScore = 0,
    } = body;

    if (!applicantMark || !conflictMark) {
      return new Response(JSON.stringify({ error: "applicantMark and conflictMark are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LANGUAGE_NAMES: Record<string, string> = {
      en: "English", zh: "Chinese", es: "Spanish", de: "German",
      fr: "French", hi: "Hindi", pt: "Portuguese", ja: "Japanese",
    };
    const langName = LANGUAGE_NAMES[language] ?? "English";

    const classContext = applicantClasses.length > 0
      ? `Nice Class(es) ${applicantClasses.join(", ")}`
      : "unspecified class";
    const goodsContext = applicantGoodsServices ? ` covering: "${applicantGoodsServices}"` : "";
    const conflictClassCtx = conflictClass ? ` in class ${conflictClass}` : "";
    const conflictGoodsCtx = conflictGoodsServices ? ` (goods/services: "${conflictGoodsServices}")` : "";
    const holderCtx = conflictHolder ? ` Holder: ${conflictHolder}.` : "";
    const statusCtx = conflictStatus ? ` Status: ${conflictStatus}.` : "";
    const simCtx = similarityScore > 0 ? ` Estimated visual/phonetic similarity: ${similarityScore}%.` : "";

    const prompt = `You are a Mexican trademark attorney analyzing whether a conflict mark poses a real threat to a trademark application.

APPLICANT'S MARK: "${applicantMark}"
Applied in: ${classContext}${goodsContext}

CONFLICT MARK: "${conflictMark}"${conflictClassCtx}${conflictGoodsCtx}${holderCtx}${statusCtx}${simCtx}

Write a concise 3–4 sentence analysis in ${langName} that covers:
1. How similar the two marks are (visually, phonetically, conceptually).
2. Whether the goods/services overlap or are commercially related.
3. The practical risk this conflict poses to the applicant's registration — be direct and specific.
4. One concrete recommendation (e.g. "file anyway with a consent agreement", "differentiate the design element", "avoid this mark", "this is low risk").

Be specific, not generic. Reference the actual mark names throughout. Do not hedge excessively.
Return ONLY JSON: { "analysis": "...", "riskVerdict": "low"|"medium"|"high" }`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Mexican trademark attorney. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "No analysis returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(content);
    return new Response(JSON.stringify({
      analysis: parsed.analysis ?? "",
      riskVerdict: parsed.riskVerdict ?? "medium",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("analyze-mark-conflict error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
