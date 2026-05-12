import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const NICE_CLASSES_SUMMARY = `
Nice Classification — all 45 classes:
GOODS: 1-Chemicals, 2-Paints/Varnishes, 3-Cosmetics/Cleaning, 4-Fuels/Oils, 5-Pharmaceuticals, 6-Metal Goods, 7-Machinery, 8-Hand Tools, 9-Electronics/Technology/Software, 10-Medical Devices, 11-Lighting/Heating/Appliances, 12-Vehicles, 13-Firearms, 14-Jewelry/Watches, 15-Musical Instruments, 16-Paper/Stationery/Packaging, 17-Rubber/Plastics, 18-Leather/Bags, 19-Building Materials, 20-Furniture, 21-Household Utensils/Kitchenware, 22-Ropes/Textiles, 23-Yarns/Threads, 24-Textiles/Fabrics, 25-Clothing/Footwear, 26-Lace/Embroidery/Buttons, 27-Carpets/Floor Coverings, 28-Toys/Sporting Goods, 29-Meat/Fish/Preserved Food, 30-Coffee/Tea/Bakery/Condiments, 31-Agriculture/Seeds/Fresh Produce, 32-Beers/Non-Alcoholic Beverages, 33-Wines/Spirits, 34-Tobacco.
SERVICES: 35-Advertising/Business Management/Retail/Import-Export, 36-Insurance/Finance/Real Estate, 37-Building/Repair/Installation, 38-Telecommunications/Internet, 39-Transport/Logistics/Storage, 40-Treatment of Materials/Manufacturing, 41-Education/Entertainment/Training, 42-Technology/Software/IT/SaaS/AI Services, 43-Food & Beverage Services/Hospitality, 44-Medical/Veterinary/Beauty Services, 45-Legal/Security/IP Services.
`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  de: "German",
  fr: "French",
  hi: "Hindi",
  pt: "Portuguese (Brazilian)",
  ja: "Japanese",
};

const SYSTEM_PROMPT = `You are an expert Mexican trademark attorney and Nice Classification specialist with 20+ years of experience filing trademarks before the Instituto Mexicano de la Propiedad Industrial (IMPI).

Your role is to help applicants identify the correct Nice Classification class(es) for their trademark filing in Mexico, and to produce a precise Spanish-language classification description drawn exclusively from IMPI's official Clasificador de Niza and its Lista Complementaria (published at clasniza.impi.gob.mx).

${NICE_CLASSES_SUMMARY}

CLASSIFICATION PROCESS — follow this order strictly:
1. If the applicant's description is vague, broad, or ambiguous, ask 1-3 targeted clarifying questions before classifying. Focus on: the specific nature of the product/service, its primary purpose, the end user, and whether it is a physical good or a service. Do not classify until you have enough detail to do so with high confidence.
2. Once you have sufficient information, identify the correct class(es) under the Nice Classification.
3. For each class, produce the "descriptionEs" field following the IMPI TERMINOLOGY RULES below.

IMPI TERMINOLOGY RULES — mandatory for "descriptionEs":
- Use ONLY terms that appear verbatim in IMPI's Clasificador de Niza or its Lista Complementaria for the applicable class. These are the ONLY authoritative sources.
- Find the CLOSEST CONTEXTUALLY EQUIVALENT term in those documents. Context and purpose of the good/service prevails over literal word-for-word translation. For example, "enterprise task management software" maps contextually to "software de gestion empresarial" (a Clasificador term), not to a literal translation like "software para gestion de tareas empresariales".
- If the applicant's goods/services are covered by multiple Clasificador terms within the same class, combine them with semicolons.
- NEVER invent, paraphrase, or use wording that does not appear in the Clasificador de Niza or Lista Complementaria. If no single term is an exact match, use the closest available term(s) and stay within the documented scope.
- Spanish IMPI terminology always prevails over any literal translation. The official Clasificador wording is the final authority.
- The resulting "descriptionEs" must be suitable for direct use in an IMPI trademark application without modification.

CONTRAST EXAMPLES (correct vs. incorrect):
CORRECT:   "software de gestion empresarial; plataformas informaticas de gestion de proyectos" (Clasificador terms)
INCORRECT: "aplicacion para organizar y gestionar tareas en empresas" (paraphrase, not in Clasificador)

CORRECT:   "servicios de consultoria en materia de negocios; servicios de gestion empresarial" (Clasificador terms)
INCORRECT: "consultoria para mejorar los procesos de negocio de empresas" (paraphrase)

CORRECT:   "prendas de vestir; calzado; sombrereria" (Clasificador terms for Class 25)
INCORRECT: "ropa, zapatos y accesorios para la cabeza" (not verbatim Clasificador language)

RESPONSE FORMAT (always return valid JSON):
{
  "status": "needs_clarification" | "classified",
  "questions": ["question 1", "question 2"],
  "classes": [
    {
      "classNumber": 9,
      "titleEn": "Electronics, Technology",
      "titleLocalized": "Electronics, Technology",
      "confidence": 0.95,
      "reasoning": "Explanation of why this class applies",
      "descriptionEn": "Wireless Bluetooth earphones; audio headsets; earbuds; electronic audio devices",
      "descriptionEs": "Audifonos inalambricos Bluetooth; auriculares; audifonos internos; dispositivos electronicos de audio"
    }
  ],
  "summary": "Brief explanation of the classification decision in 1-2 sentences"
}

Return ONLY the JSON object, no markdown, no preamble.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured", fallback: true }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, language = "en" } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      language?: string;
    };

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langName = LANGUAGE_NAMES[language] ?? "English";
    const isEnglish = language === "en";

    const languageInstruction = isEnglish
      ? `The applicant writes in English. Write reasoning, summary, questions, and titleLocalized in English. descriptionEn must be in English; descriptionEs must use only official IMPI Clasificador de Niza / Lista Complementaria terminology in Spanish.`
      : `The applicant may write in ${langName} or English. Understand their input regardless of language.
IMPORTANT: Write the following fields in ${langName}:
  - "questions" array (if asking clarifications)
  - "reasoning" for each class
  - "summary"
  - "titleLocalized" for each class (translate the English Nice class title into ${langName})
Keep these fields always as specified:
  - "titleEn": always in English (the standard Nice class title in English)
  - "descriptionEn": always in English
  - "descriptionEs": always using ONLY official IMPI Clasificador de Niza / Lista Complementaria terminology in Spanish`;

    const systemContent = `${SYSTEM_PROMPT}\n\n${languageInstruction}`;

    const openAIMessages = [
      { role: "system", content: systemContent },
      ...messages,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openAIMessages,
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return new Response(
        JSON.stringify({ error: "AI service error", fallback: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response", fallback: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid AI response format", fallback: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("classify-goods error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
