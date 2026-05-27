/**
 * Creates a rich sample clearance report order and triggers PDF generation + email delivery.
 * Usage: node scripts/send-sample-pdf.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xrqbwozlvnrfbckbfbsc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SAMPLE_RESULT = {
  risk: "medium",
  riskSummary:
    "La marca SOLARIS presenta un nivel de riesgo MEDIO. Se identificaron 3 marcas registradas con similitud fonética y conceptual moderada en la clase 35 (servicios de negocios). El análisis DuPont revela factores favorables en cuanto a la distintividad inherente del término, aunque la presencia de registros activos en el IMPI exige precaución antes de proceder con la solicitud.",
  riskSummary_en:
    "The SOLARIS mark presents a MEDIUM risk level. Three registered trademarks with moderate phonetic and conceptual similarity were identified in Class 35 (business services). The DuPont analysis reveals favorable factors regarding the inherent distinctiveness of the term, although the presence of active registrations at IMPI requires caution before proceeding with an application.",
  searchLanguage: "es",
  distinctiveness: {
    tier: "Suggestive",
    score: 72,
    explanation:
      "SOLARIS es un término sugestivo derivado del latín 'solaris' (relativo al sol), que evoca energía, brillo y dinamismo sin describir directamente los servicios. Posee distintividad inherente media-alta.",
    explanation_en:
      "SOLARIS is a suggestive term derived from the Latin 'solaris' (relating to the sun), evoking energy, brightness, and dynamism without directly describing the services. It has medium-high inherent distinctiveness.",
  },
  dupont: [
    {
      factor: "Similitud de las Marcas",
      verdict: "Neutral",
      reasoning:
        "Existen marcas fonéticamente similares (SOLARIS, SOLAR PRO, SOLAREX) que comparten el prefijo SOL-, pero difieren en sus sufijos y presentación gráfica.",
      reasoning_en:
        "There are phonetically similar marks (SOLARIS, SOLAR PRO, SOLAREX) sharing the prefix SOL-, but differing in suffixes and graphic presentation.",
    },
    {
      factor: "Similitud de los Bienes/Servicios",
      verdict: "Favorable",
      reasoning:
        "Los servicios solicitados en clase 35 tienen áreas de traslape limitado con los registros conflictivos, que mayormente cubren energía solar (clase 11) y tecnología (clase 42).",
      reasoning_en:
        "The services sought in class 35 have limited overlap with conflicting registrations, which mostly cover solar energy (class 11) and technology (class 42).",
    },
    {
      factor: "Canales de Distribución",
      verdict: "Favorable",
      reasoning:
        "Los canales de distribución difieren significativamente entre los servicios de administración empresarial y los productos/servicios energéticos de los titulares conflictivos.",
      reasoning_en:
        "Distribution channels differ significantly between business administration services and the energy products/services of conflicting holders.",
    },
    {
      factor: "Consumidores / Compradores",
      verdict: "Favorable",
      reasoning:
        "Los compradores de servicios de negocios son profesionales sofisticados con mayor capacidad de distinción entre marcas similares.",
      reasoning_en:
        "Buyers of business services are sophisticated professionals with greater ability to distinguish between similar marks.",
    },
    {
      factor: "Marcas Famosas o Notoriamente Conocidas",
      verdict: "Neutral",
      reasoning:
        "No se identificó evidencia de que alguna de las marcas conflictivas goce de notoriedad o fama especial en México.",
      reasoning_en:
        "No evidence was identified that any of the conflicting marks enjoy special notoriety or fame in Mexico.",
    },
    {
      factor: "Número de Registros Similares en el Mercado",
      verdict: "Desfavorable",
      reasoning:
        "Se encontraron 7 marcas con el prefijo SOLAR- activas en el IMPI, lo que puede indicar saturación en este espacio semántico.",
      reasoning_en:
        "7 marks with the SOLAR- prefix were found active at IMPI, which may indicate saturation in this semantic space.",
    },
  ],
  registrabilityFlags: [
    {
      category: "Potential Conflict",
      severity: "medium",
      explanation:
        "El expediente MX/E/2023/042871 cubre servicios similares bajo la clase 35 con titular activo.",
      explanation_en:
        "Expediente MX/E/2023/042871 covers similar services under class 35 with an active holder.",
    },
    {
      category: "Geographic Significance",
      severity: "low",
      explanation:
        "SOLARIS podría asociarse con energía solar, un sector en expansión en México. El IMPI podría requerir argumentación adicional sobre la distintividad.",
      explanation_en:
        "SOLARIS could be associated with solar energy, a growing sector in Mexico. IMPI may require additional argumentation on distinctiveness.",
    },
  ],
  marciaFindings: [
    {
      name: "SOLARIS",
      status: "Registrada",
      classNum: "11",
      holder: "ENERGY SOLUTIONS DE MEXICO S.A. DE C.V.",
      expediente: "MX/E/2019/038721",
      similarityScore: 91,
    },
    {
      name: "SOLAR PRO",
      status: "En Trámite",
      classNum: "35",
      holder: "CORPORATIVO SOLAR PRO S.A. DE C.V.",
      expediente: "MX/E/2023/042871",
      similarityScore: 67,
    },
    {
      name: "SOLAREX",
      status: "Registrada",
      classNum: "42",
      holder: "SOLAREX TECHNOLOGIES LLC",
      expediente: "MX/E/2021/051234",
      similarityScore: 58,
    },
  ],
  marciaTotalCount: 3,
  marciaUrl:
    "https://marcia.impi.gob.mx/marcas/search/quick?cadena=SOLARIS&clases=35",
  webFindings: [
    "solaris.mx — Sitio activo de empresa de software de negocios con marca SOLARIS",
    "solarismx.com — Empresa de consultoría con presencia activa en redes sociales",
    "solarismexico.com.mx — Portal de servicios energéticos que usa el nombre SOLARIS",
  ],
  domainResults: [
    { domain: "solaris.com.mx", status: "registered" },
    { domain: "solaris.mx", status: "registered" },
    { domain: "solarismarca.com.mx", status: "available" },
    { domain: "getsolaris.mx", status: "available" },
    { domain: "solarismx.com", status: "registered" },
  ],
  translationAnalysis: [
    {
      languageCode: "la",
      languageName: "Latin",
      translatedForm: "Solaris (of the sun)",
      risk: "low",
      issueCategory: "Descriptive Connotation",
      details:
        "En latín, 'solaris' significa 'relativo al sol'. Aunque es un origen clásico, no es descriptivo de los servicios de negocios solicitados.",
      details_en:
        "In Latin, 'solaris' means 'relating to the sun'. Although a classical origin, it is not descriptive of the business services applied for.",
    },
    {
      languageCode: "en",
      languageName: "English",
      translatedForm: "Solar (adj.)",
      risk: "medium",
      issueCategory: "Descriptive in Context",
      details:
        "En inglés, 'solar' puede interpretarse como descriptivo si los servicios están relacionados con energía solar. Se recomienda delimitar claramente el giro comercial.",
      details_en:
        "In English, 'solar' can be interpreted as descriptive if services relate to solar energy. It is recommended to clearly delimit the commercial field.",
    },
  ],
  niceClassification: {
    classNumber: 35,
    className: "Publicidad; gestión de negocios",
    className_en: "Advertising; Business management",
    officialHeading:
      "Publicidad; gestión de negocios; administración de negocios; funciones de oficina.",
    officialHeading_en:
      "Advertising; business management; business administration; office functions.",
    relevantItems: [
      "Servicios de consultoría empresarial",
      "Gestión de proyectos comerciales",
      "Servicios de marketing digital",
      "Análisis de datos para empresas",
    ],
    relevantItems_en: [
      "Business consulting services",
      "Commercial project management",
      "Digital marketing services",
      "Business data analysis",
    ],
  },
  disclaimer:
    "Este reporte constituye una búsqueda preliminar con fines informativos. No representa una opinión legal formal ni garantiza la registrabilidad de la marca. Para una evaluación completa y asesoría jurídica, consulte a un abogado especialista en propiedad intelectual mexicana.",
};

async function main() {
  console.log("Creating sample clearance report order...");

  // Insert a fresh test order
  const { data: order, error: insertError } = await supabase
    .from("clearance_report_orders")
    .insert({
      email: "sergio.legorreta@lawtaem.com",
      mark_name: "SOLARIS",
      goods_services:
        "Business consulting services, digital marketing, commercial project management, business data analysis and reporting",
      language: "es",
      status: "paid",
      final_amount_usd: 49.99,
      amount_usd: 49.99,
      discount_percent: 0,
      paid_at: new Date().toISOString(),
      clearance_result: SAMPLE_RESULT,
    })
    .select("id")
    .single();

  if (insertError || !order) {
    console.error("Failed to insert order:", insertError);
    process.exit(1);
  }

  const orderId = order.id;
  console.log(`Order created: ${orderId}`);

  // Trigger PDF generation
  console.log("Generating PDF...");
  const pdfUrl = `${SUPABASE_URL}/functions/v1/generate-clearance-pdf`;
  const pdfRes = await fetch(pdfUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  const pdfBody = await pdfRes.json();
  if (!pdfRes.ok) {
    console.error("PDF generation failed:", pdfBody);
    process.exit(1);
  }
  console.log("PDF generated:", pdfBody.storagePath ?? pdfBody);

  // Trigger email send
  console.log("Sending email to sergio.legorreta@lawtaem.com...");
  const emailUrl = `${SUPABASE_URL}/functions/v1/send-clearance-report-email`;
  const emailRes = await fetch(emailUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reportOrderId: orderId }),
  });

  const emailBody = await emailRes.json();
  if (!emailRes.ok) {
    console.error("Email send failed:", emailBody);
    process.exit(1);
  }
  console.log("Email sent successfully:", emailBody);
  console.log(`\nDone! Order ID: ${orderId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
