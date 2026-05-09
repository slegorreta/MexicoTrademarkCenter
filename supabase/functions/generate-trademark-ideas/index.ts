import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a creative trademark naming specialist with deep expertise in Mexican trademark law and brand strategy.

Your task is to generate 6-8 creative, distinctive trademark name candidates based on the user's business description and any inspiration images they provide.

TRADEMARK NAMING RULES (Mexican/IMPI context):
- Names must be distinctive — not purely descriptive of the goods/services
- Avoid generic terms (e.g. "Fresh Juice" for a juice brand)
- Invented words, evocative combinations, and creative adaptations score best at IMPI
- Avoid geographic names of Mexico without distinctiveness
- Avoid names that are surnames alone
- Names should be pronounceable and memorable
- Short (1-3 words) is ideal for trademark registration

STYLE CATEGORIES to use:
- "Invented word" — coined term with no direct meaning (e.g. Kodak, Xerox)
- "Evocative" — suggests quality/feeling without describing it directly (e.g. Amazon, Apple)
- "Compound" — two words or roots merged (e.g. Facebook, YouTube)
- "Foreign word" — word from another language that sounds distinctive in Spanish context
- "Adapted spelling" — creative respelling of a common word
- "Metaphorical" — object/concept used metaphorically

If inspiration images are provided, analyze their visual style, tone, and any text/letterforms to inform naming style.

RESPONSE FORMAT (return valid JSON only, no markdown):
{
  "ideas": [
    {
      "name": "Veltara",
      "style": "Invented word",
      "rationale": "Coined from 'vel' (speed) and '-tara' (a classical suffix), evoking velocity and elegance.",
      "rationaleZh": "由'vel'（速度）和'-tara'（经典后缀）创造，传达速度和优雅感。"
    }
  ]
}

Generate exactly 6-8 ideas. Vary the styles. Make names feel premium and registrable.`;

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
      description,
      inspirationImages = [],
      language = "en",
    } = body as {
      description: string;
      inspirationImages: Array<{ base64: string; mimeType: string }>;
      language?: string;
    };

    if (!description || description.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "description is required (minimum 5 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const languageNote = language === "zh"
      ? "The user writes in Chinese. Understand the Chinese description. Still generate English trademark names (trademarks in Mexico are typically filed in the language of the mark). Rationale in rationaleZh should be in Chinese."
      : language === "de"
      ? "The user writes in German. Understand the German description. Generate distinctive trademark names suitable for Mexico filing (English, invented words, or international names). Write the rationale field in German."
      : language === "es"
      ? "The user writes in Spanish. Generate creative trademark names appropriate for Mexico filing. Write the rationale field in Spanish."
      : language === "fr"
      ? "The user writes in French. Understand the French description. Generate distinctive trademark names suitable for Mexico filing (English, invented words, or international names). Write the rationale field in French."
      : language === "hi"
      ? "The user writes in Hindi. Understand the Hindi description. Generate distinctive trademark names suitable for Mexico filing (English, invented words, or international names). Write the rationale field in Hindi."
      : language === "pt"
      ? "The user writes in Portuguese. Understand the Portuguese description. Generate distinctive trademark names suitable for Mexico filing (English, invented words, or international names). Write the rationale field in Portuguese."
      : "The user writes in English. Generate English/invented trademark names appropriate for Mexico filing.";

    const userContentParts: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [
      {
        type: "text",
        text: `Business description: ${description}\n\n${languageNote}\n\nGenerate 6-8 trademark name ideas for this business.`,
      },
    ];

    // Add up to 3 inspiration images
    const images = inspirationImages.slice(0, 3);
    for (const img of images) {
      userContentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`,
          detail: "low",
        },
      });
    }

    if (images.length > 0) {
      userContentParts.push({
        type: "text",
        text: "Also consider the visual style, tone, and aesthetic of the inspiration marks shown above when suggesting names.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContentParts },
        ],
        temperature: 0.85,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-trademark-ideas error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
