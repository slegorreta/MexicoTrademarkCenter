import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Design System — Pure White + Teal/Coral palette ─────────────────────────
// Page backgrounds: pure white (#FFFFFF) — print-friendly, no beige/cream
const C = {
  // Brand primary — soft teal
  primary:     rgb(0.055, 0.486, 0.482),  // #0E7C7B
  primaryTint: rgb(0.878, 0.949, 0.945),  // #E0F2F1 — small pills only

  // Status
  success:     rgb(0.298, 0.686, 0.490),  // #4CAF7D
  successTint: rgb(0.910, 0.961, 0.933),  // #E8F5EE
  warning:     rgb(0.898, 0.627, 0.298),  // #E5A04C
  warningTint: rgb(0.984, 0.945, 0.878),  // #FBF1E0
  critical:    rgb(0.753, 0.224, 0.169),  // #C0392B
  criticalTint:rgb(0.973, 0.898, 0.886),  // #F8E5E2

  // Neutral text
  textPrimary: rgb(0.173, 0.243, 0.314),  // #2C3E50 charcoal
  textSecond:  rgb(0.373, 0.420, 0.478),  // #5F6B7A
  textMuted:   rgb(0.541, 0.584, 0.639),  // #8A95A3

  // Surfaces — pure white
  white:       rgb(1, 1, 1),
  border:      rgb(0.898, 0.906, 0.922),  // #E5E7EB
  divider:     rgb(0.941, 0.949, 0.961),  // #F0F2F5

  // Keep gold for accent lines only (not backgrounds)
  gold:        rgb(0.788, 0.659, 0.298),  // #C9A84C
};

// A4 in points
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 48;
const MARGIN_BOT = 56;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// ─── Types ───────────────────────────────────────────────────────────────────
interface ConfusionFactor {
  factor: string;
  verdict: string;
  reasoning: string;
  reasoning_en?: string;
}
interface DistinctivenessAssessment {
  tier: string;
  score: number;
  explanation: string;
  explanation_en?: string;
}
interface RegistrabilityFlag {
  category: string;
  severity: string;
  explanation: string;
  explanation_en?: string;
}
interface MarciaFinding {
  name: string;
  status: string;
  classNum: string;
  holder: string;
  expediente?: string;
  similarityScore?: number;
}
interface DomainResult { domain: string; status: string; }
interface TranslationFlag {
  languageCode: string;
  languageName: string;
  translatedForm: string;
  risk: "none" | "low" | "medium" | "high";
  issueCategory: string | null;
  details: string;
  details_en: string;
}
interface NiceClass {
  classNumber: number;
  className: string;
  className_en: string;
  officialHeading: string;
  officialHeading_en: string;
  relevantItems: string[];
  relevantItems_en: string[];
}
interface ClearanceResult {
  risk: "low" | "medium" | "high";
  riskSummary?: string;
  riskSummary_en?: string;
  searchLanguage?: string;
  distinctiveness?: DistinctivenessAssessment;
  dupont?: ConfusionFactor[];
  registrabilityFlags?: RegistrabilityFlag[];
  marciaFindings?: MarciaFinding[];
  marciaTotalCount?: number;
  marciaUrl?: string;
  webFindings?: string[];
  domainResults?: DomainResult[];
  translationAnalysis?: TranslationFlag[];
  niceClassification?: NiceClass[];
  disclaimer?: string;
}

type Lang = "en" | "es" | "zh" | "de" | "fr" | "hi" | "pt" | "ja";

// ─── Score / Verdict System ───────────────────────────────────────────────────

type Verdict = "CLEAR" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

function computeScore(result: ClearanceResult): number {
  let score = 80;
  if (result.risk === "high") score = Math.min(score, 42);
  else if (result.risk === "medium") score = Math.min(score, 65);
  const highFlags = (result.registrabilityFlags ?? []).filter(f => f.severity === "high").length;
  score -= highFlags * 8;
  const medFlags = (result.registrabilityFlags ?? []).filter(f => f.severity === "medium").length;
  score -= medFlags * 4;
  const marciaCount = result.marciaTotalCount ?? result.marciaFindings?.length ?? 0;
  if (marciaCount > 5) score -= 12;
  else if (marciaCount > 2) score -= 6;
  const dist = result.distinctiveness?.score ?? 50;
  // dist is 0-100 (or 0-5 legacy — normalize)
  const normDist = dist <= 5 ? dist * 20 : dist;
  score += Math.round((normDist - 50) / 10);
  return Math.max(5, Math.min(95, Math.round(score)));
}

function scoreToVerdict(score: number): Verdict {
  if (score >= 90) return "CLEAR";
  if (score >= 75) return "LOW";
  if (score >= 55) return "MODERATE";
  if (score >= 30) return "HIGH";
  return "CRITICAL";
}

function verdictColor(v: Verdict): ReturnType<typeof rgb> {
  return v === "CLEAR" ? C.success
    : v === "LOW" ? rgb(0.486, 0.702, 0.259) // #7CB342
    : v === "MODERATE" ? C.warning
    : v === "HIGH" ? rgb(0.851, 0.475, 0.259)  // #D97942
    : C.critical;
}

function verdictTint(v: Verdict): ReturnType<typeof rgb> {
  return v === "CLEAR" ? C.successTint
    : v === "LOW" ? rgb(0.918, 0.957, 0.886)
    : v === "MODERATE" ? C.warningTint
    : v === "HIGH" ? rgb(0.980, 0.929, 0.898)
    : C.criticalTint;
}

function verdictLabel(v: Verdict, lang: Lang): string {
  const map: Record<Verdict, Record<Lang, string>> = {
    CLEAR:    { en: "CLEAR", es: "SIN OBSTACULOS", zh: "CLEAR", de: "FREI", fr: "LIBRE", hi: "CLEAR", pt: "LIVRE", ja: "CLEAR" },
    LOW:      { en: "LOW RISK", es: "RIESGO BAJO", zh: "Low Risk", de: "GERINGES RISIKO", fr: "FAIBLE RISQUE", hi: "LOW RISK", pt: "BAIXO RISCO", ja: "LOW RISK" },
    MODERATE: { en: "MODERATE RISK", es: "RIESGO MODERADO", zh: "Moderate Risk", de: "MITTLERES RISIKO", fr: "RISQUE MODERE", hi: "MODERATE RISK", pt: "RISCO MODERADO", ja: "MODERATE RISK" },
    HIGH:     { en: "HIGH RISK", es: "RIESGO ALTO", zh: "High Risk", de: "HOHES RISIKO", fr: "RISQUE ELEVE", hi: "HIGH RISK", pt: "ALTO RISCO", ja: "HIGH RISK" },
    CRITICAL: { en: "CRITICAL", es: "CRITICO", zh: "Critical", de: "KRITISCH", fr: "CRITIQUE", hi: "CRITICAL", pt: "CRITICO", ja: "CRITICAL" },
  };
  return map[v][lang];
}

function verdictOneLiner(v: Verdict, lang: Lang): string {
  const en: Record<Verdict, string> = {
    CLEAR:    "No material obstacles — favorable outlook for registration",
    LOW:      "Few obstacles — registrable with standard strategy",
    MODERATE: "Registrable with appropriate filing strategy",
    HIGH:     "Significant obstacles — registration requires modifications",
    CRITICAL: "Registration highly unlikely without major redesign",
  };
  const es: Record<Verdict, string> = {
    CLEAR:    "Sin obstaculos materiales — perspectiva favorable para el registro",
    LOW:      "Pocos obstaculos — registrable con estrategia estandar",
    MODERATE: "Registrable con estrategia de presentacion adecuada",
    HIGH:     "Obstaculos significativos — el registro requiere modificaciones",
    CRITICAL: "Registro altamente improbable sin rediseno mayor de la marca",
  };
  return lang === "es" ? es[v] : en[v];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeText(t: string | undefined | null): string {
  if (!t) return "";
  return t
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`]/g, "")
    .replace(/  +/g, " ")
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  text = safeText(text);
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      // Never truncate — if a single word is wider than maxWidth, render it anyway
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  page: PDFPage, text: string, x: number, y: number,
  font: PDFFont, size: number, maxWidth: number,
  color = C.textPrimary, lineHeight = size * 1.55,
): number {
  const lines = wrapText(safeText(text), font, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

// ─── Arc draw (pixelated but functional for pdf-lib) ─────────────────────────
function drawArc(
  page: PDFPage, cx: number, cy: number, r: number, strokeW: number,
  progress: number,
  color: ReturnType<typeof rgb>,
) {
  const steps = 80;
  const filled = Math.round(steps * Math.min(1, Math.max(0, progress)));
  for (let i = 0; i < filled; i++) {
    const angle = (i / steps) * 2 * Math.PI - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    page.drawRectangle({ x: x - strokeW / 2, y: y - strokeW / 2, width: strokeW, height: strokeW, color });
  }
}

// ─── Pentagon chart ───────────────────────────────────────────────────────────
function drawPentagon(
  page: PDFPage,
  cx: number, cy: number, size: number,
  scores: Array<{ label: string; score: number }>,
  font: PDFFont, bold: PDFFont,
  rc: ReturnType<typeof rgb>,
) {
  const n = 5;
  const maxR = size * 0.38;

  for (let ring = 1; ring <= 4; ring++) {
    const rr = (ring / 4) * maxR;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      pts.push([cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr]);
    }
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      page.drawLine({ start: { x: pts[i][0], y: pts[i][1] }, end: { x: pts[next][0], y: pts[next][1] }, thickness: 0.4, color: C.border });
    }
  }

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + Math.cos(angle) * maxR, y: cy + Math.sin(angle) * maxR }, thickness: 0.4, color: C.border });
  }

  const scorePts: Array<[number, number]> = scores.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r = (s.score / 100) * maxR;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    page.drawLine({ start: { x: scorePts[i][0], y: scorePts[i][1] }, end: { x: scorePts[next][0], y: scorePts[next][1] }, thickness: 1.5, color: rc });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: scorePts[i][0], y: scorePts[i][1] }, thickness: 0.8, color: rc });
  }

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const ax = cx + Math.cos(angle) * (maxR + 12);
    const ay = cy + Math.sin(angle) * (maxR + 12);
    const s = scores[i];
    const dx = cx + Math.cos(angle) * (s.score / 100) * maxR;
    const dy = cy + Math.sin(angle) * (s.score / 100) * maxR;
    page.drawCircle({ x: dx, y: dy, size: 3, color: rc });
    const labelLines = wrapText(safeText(s.label), font, 6, 52);
    for (let li = 0; li < labelLines.length; li++) {
      const lw = font.widthOfTextAtSize(labelLines[li], 6);
      page.drawText(labelLines[li], { x: ax - lw / 2, y: ay - 3 - li * 8, size: 6, font, color: C.textSecond });
    }
    const scoreStr = String(s.score);
    const scoreW = bold.widthOfTextAtSize(scoreStr, 7);
    page.drawText(scoreStr, { x: ax - scoreW / 2, y: ay - 3 - labelLines.length * 8 - 5, size: 7, font: bold, color: C.textPrimary });
  }
}

// ─── 5-axis pentagon scores ───────────────────────────────────────────────────
function computePentagonScores(result: ClearanceResult): Array<{ label: string; score: number }> {
  const dist = result.distinctiveness;
  const rawDist = dist?.score ?? 50;
  const distScore = rawDist <= 5 ? rawDist * 20 : rawDist;

  const flags = result.registrabilityFlags ?? [];
  const highFlags = flags.filter(f => f.severity === "high").length;
  const medFlags = flags.filter(f => f.severity === "medium").length;
  const lfppiScore = Math.max(10, 100 - highFlags * 25 - medFlags * 12);

  const total = result.marciaTotalCount ?? result.marciaFindings?.length ?? 0;
  const marciaScore = Math.max(10, 100 - Math.min(total, 10) * 8);

  const conflictFlags = (result.translationAnalysis ?? []).filter(f => f.risk !== "none").length;
  const transScore = Math.max(20, 100 - conflictFlags * 20);

  const regAvailScore = Math.max(10, Math.round(marciaScore * 0.6 + lfppiScore * 0.4));

  return [
    { label: "Distintividad", score: Math.max(5, Math.min(95, Math.round(distScore))) },
    { label: "LFPPI", score: Math.max(5, Math.min(95, lfppiScore)) },
    { label: "Registro IMPI", score: Math.max(5, Math.min(95, marciaScore)) },
    { label: "Disp. Registral", score: Math.max(5, Math.min(95, regAvailScore)) },
    { label: "Traduccion", score: Math.max(5, Math.min(95, transScore)) },
  ];
}

// ─── Page scaffolding ─────────────────────────────────────────────────────────

function addRunningFooter(
  page: PDFPage, regular: PDFFont, markName: string, pageNum: number, totalPages: number, shortId: string,
) {
  // Single-line minimalist footer — no brand bar, no color block
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 20, color: C.divider });
  page.drawRectangle({ x: 0, y: 20, width: PAGE_W, height: 0.5, color: C.border });
  const left = `MexicoTrademarkCenter.com`;
  const center = `Report ID ${shortId}`;
  const right = `Page ${pageNum} of ${totalPages}`;
  const centerW = regular.widthOfTextAtSize(center, 7);
  const rightW = regular.widthOfTextAtSize(right, 7);
  page.drawText(left, { x: MARGIN_X, y: 6, size: 7, font: regular, color: C.textMuted });
  page.drawText(center, { x: (PAGE_W - centerW) / 2, y: 6, size: 7, font: regular, color: C.textMuted });
  page.drawText(right, { x: PAGE_W - MARGIN_X - rightW, y: 6, size: 7, font: regular, color: C.textMuted });
}

function addPageHeader(
  page: PDFPage, regular: PDFFont, bold: PDFFont, markName: string, niceClasses: NiceClass[], sectionTitle: string,
) {
  // Minimal top strip — white with bottom border line only (no colored fill)
  page.drawRectangle({ x: 0, y: PAGE_H - 24, width: PAGE_W, height: 24, color: C.white });
  page.drawRectangle({ x: 0, y: PAGE_H - 24, width: PAGE_W, height: 0.5, color: C.border });
  const classStr = niceClasses.length > 0 ? `Cl. ${niceClasses.map(c => c.classNumber).join(", ")}` : "";
  const markStr = safeText(markName).slice(0, 28) + (classStr ? ` — ${classStr}` : "");
  const markW = bold.widthOfTextAtSize(markStr, 7.5);
  page.drawText(markStr, { x: (PAGE_W - markW) / 2, y: PAGE_H - 16, size: 7.5, font: bold, color: C.textPrimary });
  page.drawText("MexicoTrademarkCenter.com", { x: MARGIN_X, y: PAGE_H - 16, size: 7, font: regular, color: C.textMuted });
  const secW = regular.widthOfTextAtSize(safeText(sectionTitle), 7);
  page.drawText(safeText(sectionTitle).slice(0, 40), { x: PAGE_W - MARGIN_X - secW, y: PAGE_H - 16, size: 7, font: regular, color: C.textMuted });
}

function addSectionHeader(
  page: PDFPage, bold: PDFFont, title: string, subtitle: string, y: number,
): number {
  const H = subtitle ? 30 : 22;
  // Teal left accent stripe (4px) + colored title text on white — NO full-width fill
  page.drawRectangle({ x: MARGIN_X, y: y - H, width: 3, height: H, color: C.primary });
  page.drawText(safeText(title).toUpperCase(), { x: MARGIN_X + 10, y: y - 14, size: 9.5, font: bold, color: C.primary });
  if (subtitle) {
    page.drawText(safeText(subtitle).slice(0, 90), { x: MARGIN_X + 10, y: y - 25, size: 7.5, font: bold, color: C.textMuted });
  }
  page.drawRectangle({ x: MARGIN_X, y: y - H - 1, width: CONTENT_W, height: 0.6, color: C.border });
  return y - H - 10;
}

function drawCard(page: PDFPage, x: number, y: number, w: number, h: number, bg = C.white) {
  page.drawRectangle({ x, y: y - h, width: w, height: h, color: bg, borderColor: C.border, borderWidth: 0.8 });
}

function drawStatusPill(page: PDFPage, bold: PDFFont, status: string, x: number, y: number): number {
  const isReg = /registrad|vigente|registered|active/i.test(status);
  const isPend = /tr[aá]mite|pendiente|solicitud|pending|filed/i.test(status);
  const color = isReg ? C.success : isPend ? C.warning : C.textMuted;
  const tint = isReg ? C.successTint : isPend ? C.warningTint : C.divider;
  const label = isReg ? "REGISTRADA" : isPend ? "EN TRAMITE" : "ABANDONADA";
  const w = bold.widthOfTextAtSize(label, 7) + 12;
  page.drawRectangle({ x, y: y - 13, width: w, height: 15, color: tint, borderColor: color, borderWidth: 0.8 });
  page.drawText(label, { x: x + 6, y: y - 8, size: 7, font: bold, color });
  return w;
}

// ─── Attorney Commentary ──────────────────────────────────────────────────────

async function generateAttorneyCommentary(
  apiKey: string,
  markName: string,
  goodsServices: string,
  result: ClearanceResult,
  language: string,
): Promise<{ native: string; english: string }> {
  const langName = language === "es" ? "Spanish" : language === "zh" ? "Chinese" :
    language === "de" ? "German" : language === "fr" ? "French" :
    language === "hi" ? "Hindi" : language === "pt" ? "Portuguese" :
    language === "ja" ? "Japanese" : "English";

  const flags = result.registrabilityFlags ?? [];
  const marciaFindings = result.marciaFindings ?? [];
  const topConflicts = marciaFindings.slice(0, 3);
  const conflictList = topConflicts.length > 0
    ? topConflicts.map(f => `"${f.name}" (Exp. ${f.expediente ?? "N/A"}, Clase ${f.classNum}${f.similarityScore ? `, similitud ${f.similarityScore}%` : ""})`).join("; ")
    : "no se encontraron conflictos directos";
  const highFlags = flags.filter(f => f.severity === "high").map(f => f.category).join(", ");
  const niceClasses = (result.niceClassification ?? []).map(nc => `Clase ${nc.classNumber} (${nc.className_en || nc.className})`).join(", ");
  const tier = result.distinctiveness?.tier ?? "desconocido";

  const contextSummary = [
    `Marca: "${markName}"`,
    goodsServices ? `Productos/Servicios: ${goodsServices}` : "",
    niceClasses ? `Clases Niza: ${niceClasses}` : "",
    `Riesgo general: ${result.risk}`,
    `Distintividad: ${tier} (puntuacion ${result.distinctiveness?.score ?? "N/A"}/5)`,
    flags.length > 0 ? `Causales LFPPI identificadas: ${flags.length} (alta severidad: ${highFlags || "ninguna"})` : "LFPPI: Sin causales identificadas",
    `Conflictos MARCia IMPI: ${result.marciaTotalCount ?? marciaFindings.length} marcas encontradas`,
    topConflicts.length > 0 ? `Principales conflictos: ${conflictList}` : "",
    result.riskSummary_en ? `Contexto de riesgo: ${result.riskSummary_en.slice(0, 200)}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `Eres un abogado senior especialista en propiedad intelectual mexicana con mas de 20 anos de experiencia en tramites ante el IMPI.

Con base en los siguientes resultados de busqueda de disponibilidad marcaria, redacta un parrafo de opinion de registrabilidad de 120-180 palabras. Usa EXCLUSIVAMENTE terminologia de la LFPPI (Arts. 171-174, Art. 173 Fr. XVIII, etc.) y la doctrina mexicana de triple similitud (fonetica, visual, conceptual) y del elemento dominante. NO menciones el test DuPont ni ninguna jurisprudencia estadounidense.

RESULTADOS:
${contextSummary}

ESTRUCTURA OBLIGATORIA (un solo parrafo fluido — sin encabezados ni bullets):
1. Establece claramente el veredicto de registrabilidad.
2. Menciona las 2-3 marcas conflictivas mas importantes por nombre con numero de expediente, identifica el elemento dominante que genera el conflicto, y cita el articulo LFPPI especifico (ej. Art. 173 Fr. XVIII LFPPI).
3. Comenta el nivel de distintividad y su impacto en las posibilidades de registro.
4. Termina con una recomendacion concreta y accionable.

Idioma de salida: ${langName}. Cada palabra debe estar en ${langName}. Sin markdown. Sin etiquetas de seccion. Solo prosa profesional.`;

  try {
    let english = "";
    let native = "";

    const engRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are a Mexican trademark attorney. Write professional legal opinions using LFPPI terminology only. No markdown, no bullet points, plain prose. Output in ${langName}.` },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 350,
      }),
    });

    if (engRes.ok) {
      const d = await engRes.json();
      native = d.choices?.[0]?.message?.content?.trim() ?? "";
    }

    if (language !== "en" && native) {
      const transRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Translate the following Mexican trademark attorney opinion into English. Maintain formal legal tone. Preserve all trademark names, LFPPI citations, and expediente numbers exactly. No markdown. Output in English only." },
            { role: "user", content: native },
          ],
          temperature: 0.1,
          max_tokens: 400,
        }),
      });
      if (transRes.ok) {
        const d = await transRes.json();
        english = d.choices?.[0]?.message?.content?.trim() ?? native;
      } else {
        english = native;
      }
    } else {
      english = native;
    }

    return { native, english };
  } catch {
    return { native: "", english: "" };
  }
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const CONFUSION_FACTORS_EN: Record<string, string> = {
  similarity_of_marks: "Similitud de las Marcas (Fonetica, Visual, Conceptual)",
  strength_of_marks: "Fortaleza / Notoriedad de las Marcas",
  similarity_of_goods: "Similitud de Productos / Servicios",
  channels_of_trade: "Canales de Distribucion / Comercializacion",
  conditions_of_purchase: "Condiciones de Compra / Consumidor Destinatario",
  actual_confusion: "Evidencia de Confusion Real en el Mercado",
  concurrent_use: "Uso Simultaneo Prolongado Sin Confusion",
  variety_of_goods: "Variedad de Productos en que se Usa la Marca",
  market_interface: "Interfaz de Mercado / Naturaleza del Uso Previo",
  applicant_bad_faith: "Mala Fe del Solicitante (Art. 173 Fr. XVIII LFPPI)",
  sophistication_of_buyers: "Sofisticacion del Consumidor Destinatario",
  number_of_similar_marks: "Numero de Marcas Similares en el Sector",
  extent_of_potential_confusion: "Magnitud del Riesgo de Confusion",
  "Similitud de las Marcas": "Similitud de las Marcas (Fonetica, Visual, Conceptual)",
  "Similitud de los Bienes/Servicios": "Similitud de Productos / Servicios",
  "Canales de Distribucion": "Canales de Distribucion / Comercializacion",
  "Consumidores / Compradores": "Consumidor Destinatario",
  "Marcas Famosas o Notoriamente Conocidas": "Marcas Notoriamente Conocidas (Art. 173 Fr. XV LFPPI)",
  "Numero de Registros Similares en el Mercado": "Numero de Registros Similares en el Sector",
};

const CATEGORY_LABELS: Record<string, { en: string; es: string; lfppi: string }> = {
  descriptiveness:    { en: "Descriptiveness", es: "Descriptividad", lfppi: "Art. 173 Fr. II LFPPI" },
  genericness:        { en: "Genericness", es: "Genericidad", lfppi: "Art. 173 Fr. I LFPPI" },
  deceptiveness:      { en: "Deceptiveness", es: "Caracter Enganoso", lfppi: "Art. 173 Fr. III LFPPI" },
  geographic:         { en: "Geographic Indicator", es: "Indicacion Geografica", lfppi: "Art. 173 Fr. IV LFPPI" },
  official_signs:     { en: "Official Signs / Emblems", es: "Signos Oficiales / Emblemas", lfppi: "Art. 173 Fr. VI LFPPI" },
  surname:            { en: "Common Surname", es: "Apellido Comun", lfppi: "Art. 173 Fr. V LFPPI" },
  confusing_similarity:{ en: "Confusing Similarity", es: "Similitud Confusoria", lfppi: "Art. 173 Fr. XVIII LFPPI" },
  prior_registration: { en: "Prior Registration Conflict", es: "Conflicto con Registro Previo", lfppi: "Art. 173 Fr. XVI LFPPI" },
  notorious_mark:     { en: "Notorious / Well-Known Mark", es: "Marca Notoriamente Conocida", lfppi: "Art. 173 Fr. XV LFPPI" },
  public_order:       { en: "Public Order / Morality", es: "Orden Publico / Moral", lfppi: "Art. 173 Fr. VII LFPPI" },
  "Potential Conflict":   { en: "Potential Conflict", es: "Conflicto Potencial", lfppi: "Art. 173 Fr. XVIII LFPPI" },
  "Geographic Significance": { en: "Geographic Significance", es: "Significado Geografico", lfppi: "Art. 173 Fr. IV LFPPI" },
  "Descriptive Connotation": { en: "Descriptive Connotation", es: "Connotacion Descriptiva", lfppi: "Art. 173 Fr. II LFPPI" },
};

// LFPPI fracciones that passed — Mexican law only, no USPTO boilerplate
const LFPPI_PASSED_GROUNDS: Array<{ fraccion: string; question_en: string; question_es: string }> = [
  { fraccion: "Art. 173 Fr. I", question_en: "Mark is not a generic term for its goods/services", question_es: "La marca no es un termino generico para sus productos/servicios" },
  { fraccion: "Art. 173 Fr. II", question_en: "Mark is not purely descriptive of goods/services characteristics", question_es: "La marca no es meramente descriptiva de las caracteristicas de los productos/servicios" },
  { fraccion: "Art. 173 Fr. III", question_en: "Mark is not deceptive as to nature, quality, or geographic origin", question_es: "La marca no es enganosa en cuanto a naturaleza, calidad u origen geografico" },
  { fraccion: "Art. 173 Fr. V", question_en: "Mark has sufficient distinctiveness to distinguish in commerce", question_es: "La marca tiene suficiente distintividad para diferenciarse en el comercio" },
  { fraccion: "Art. 173 Fr. VI", question_en: "Mark does not reproduce a translation or transliteration of a notorious mark", question_es: "La marca no reproduce una traduccion o transliteracion de una marca notoria" },
  { fraccion: "Art. 173 Fr. VII", question_en: "Mark does not violate public order or morality", question_es: "La marca no viola el orden publico ni la moral" },
  { fraccion: "Art. 173 Fr. VIII", question_en: "Mark does not reproduce national or foreign official emblems or flags", question_es: "La marca no reproduce emblemas o banderas oficiales nacionales o extranjeras" },
  { fraccion: "Art. 173 Fr. IX", question_en: "Mark does not reproduce symbols of international organizations", question_es: "La marca no reproduce simbolos de organismos internacionales" },
  { fraccion: "Art. 173 Fr. XI", question_en: "Mark is not an isolated color without distinctive configuration", question_es: "La marca no es un color aislado sin configuracion distintiva" },
  { fraccion: "Art. 173 Fr. XIV", question_en: "Mark does not conflict with a copyright registered at INDAUTOR", question_es: "La marca no conflictua con una obra registrada ante el INDAUTOR" },
];

function isHighSimilarity(f: MarciaFinding, markName: string): boolean {
  if (f.similarityScore !== undefined) return f.similarityScore >= 80;
  return f.name.toLowerCase().trim() === markName.toLowerCase().trim();
}

function isMedSimilarity(f: MarciaFinding, markName: string): boolean {
  if (f.similarityScore !== undefined) return f.similarityScore >= 50 && f.similarityScore < 80;
  const n = f.name.toLowerCase().trim();
  const m = markName.toLowerCase().trim();
  return n.slice(0, 3) === m.slice(0, 3) && n !== m;
}

function buildKeyFindings(result: ClearanceResult): Array<{ title_en: string; title_es: string; desc_en: string; desc_es: string; dataPoint: string; color: ReturnType<typeof rgb> }> {
  const findings: Array<{ title_en: string; title_es: string; desc_en: string; desc_es: string; dataPoint: string; color: ReturnType<typeof rgb> }> = [];

  const marciaFindings = result.marciaFindings ?? [];
  const critical = marciaFindings.filter(f => isHighSimilarity(f, result.riskSummary ?? ""));
  const totalConflicts = marciaFindings.filter(f => isHighSimilarity(f, result.riskSummary ?? "") || isMedSimilarity(f, result.riskSummary ?? "")).length;

  findings.push({
    title_en: "Registry Conflicts",
    title_es: "Conflictos Registrales",
    desc_en: `${marciaFindings.length} marks found in IMPI MARCia. ${critical.length} critical, ${totalConflicts - critical.length} significant.`,
    desc_es: `${marciaFindings.length} marcas encontradas en IMPI MARCia. ${critical.length} criticas, ${totalConflicts - critical.length} significativas.`,
    dataPoint: `${marciaFindings.length} marcas`,
    color: marciaFindings.length > 3 ? C.critical : marciaFindings.length > 1 ? C.warning : C.success,
  });

  const flags = result.registrabilityFlags ?? [];
  findings.push({
    title_en: "LFPPI Grounds",
    title_es: "Causales LFPPI",
    desc_en: `${flags.length} ground(s) raised. ${flags.filter(f => f.severity === "high").length} high severity.`,
    desc_es: `${flags.length} causal(es) identificada(s). ${flags.filter(f => f.severity === "high").length} de alta severidad.`,
    dataPoint: `${flags.length} causales`,
    color: flags.some(f => f.severity === "high") ? C.critical : flags.length > 0 ? C.warning : C.success,
  });

  const dist = result.distinctiveness;
  if (dist) {
    const tierEs: Record<string, string> = { generic: "Generica", descriptive: "Descriptiva", suggestive: "Sugestiva", arbitrary: "Arbitraria", fanciful: "De Fantasia" };
    const rawScore = dist.score <= 5 ? dist.score * 20 : dist.score;
    findings.push({
      title_en: "Distinctiveness",
      title_es: "Distintividad",
      desc_en: `Mark classified as ${dist.tier} (${rawScore}/100). ${rawScore >= 60 ? "Favorable for registration." : "Low distinctiveness increases refusal risk."}`,
      desc_es: `Marca clasificada como ${tierEs[dist.tier] ?? dist.tier} (${rawScore}/100). ${rawScore >= 60 ? "Favorable para el registro." : "Baja distintividad aumenta riesgo de rechazo."}`,
      dataPoint: `${tierEs[dist.tier] ?? dist.tier} ${dist.score <= 5 ? dist.score + "/5" : rawScore + "/100"}`,
      color: rawScore >= 60 ? C.success : rawScore >= 40 ? C.warning : C.critical,
    });
  }

  return findings;
}

// ─── 5 Strategy Paths ─────────────────────────────────────────────────────────
function buildStrategies(result: ClearanceResult, markName: string, useEnglish: boolean): Array<{
  num: number; title: string; desc: string; viability: number; timeline: string; fee: string; recommended: boolean;
}> {
  const T = (en: string, es: string) => useEnglish ? en : es;
  const risk = result.risk;
  const dist = result.distinctiveness;
  const tier = dist?.tier ?? "suggestive";

  const path1Viability = risk === "low" && (tier === "arbitrary" || tier === "fanciful") ? 9 : risk === "medium" ? 6 : 4;
  const path2Viability = 7;
  const path3Viability = risk === "medium" ? 5 : 4;
  const path4Viability = tier === "descriptive" || tier === "suggestive" ? 7 : 5;
  const path5Viability = 8;

  const paths = [
    {
      num: 1,
      title: T("File the mark as submitted", "Presentar la marca tal como se solicita"),
      desc: T(
        `File the mark "${safeText(markName)}" before IMPI as currently defined. Acknowledge the identified risks and prepare contingency responses for potential office actions. Most cost-effective path if risk tolerance is moderate.`,
        `Presentar la marca "${safeText(markName)}" ante el IMPI tal como esta definida. Reconocer los riesgos identificados y preparar respuestas para posibles prevenciones. La opcion mas economica si la tolerancia al riesgo es moderada.`,
      ),
      viability: path1Viability,
      timeline: T("12-18 months", "12-18 meses"),
      fee: "USD $299",
      recommended: false,
    },
    {
      num: 2,
      title: T("File as a mixed mark with a distinctive design element", "Presentar como marca mixta con elemento grafico distintivo"),
      desc: T(
        "Add a distinctive figurative element (logo, stylized typography, or device) to the word mark. Mixed marks enjoy broader protection and the graphic element reduces phonetic-similarity objections under Art. 173 Fr. XVIII LFPPI.",
        "Agregar un elemento figurativo distintivo (logotipo, tipografia estilizada o dispositivo) a la marca denominativa. Las marcas mixtas tienen mayor proteccion y el elemento grafico reduce objeciones de similitud fonetica bajo Art. 173 Fr. XVIII LFPPI.",
      ),
      viability: path2Viability,
      timeline: T("12-18 months", "12-18 meses"),
      fee: "USD $299",
      recommended: false,
    },
    {
      num: 3,
      title: T("Refile in an adjacent Nice class", "Re-presentar en una clase Niza adyacente"),
      desc: T(
        "If the primary class faces direct registration conflicts, file in an adjacent class covering related but different goods/services. This can establish brand presence while the primary class strategy is developed.",
        "Si la clase principal enfrenta conflictos directos de registro, presentar en una clase adyacente que cubra productos/servicios relacionados pero distintos. Esto permite establecer presencia de marca mientras se desarrolla la estrategia para la clase principal.",
      ),
      viability: path3Viability,
      timeline: T("12-18 months", "12-18 meses"),
      fee: "USD $299",
      recommended: false,
    },
    {
      num: 4,
      title: T("Claim acquired distinctiveness with prior-use evidence", "Alegar distintividad adquirida con evidencia de uso previo"),
      desc: T(
        "Submit evidence of prior commercial use in Mexico (invoices, advertising, social media, contracts) to demonstrate acquired secondary meaning. Art. 171 LFPPI recognizes distinctiveness acquired through use, which can overcome descriptiveness objections.",
        "Presentar evidencia de uso comercial previo en Mexico (facturas, publicidad, redes sociales, contratos) para demostrar significado secundario adquirido. El Art. 171 LFPPI reconoce la distintividad adquirida mediante el uso, lo que puede superar objeciones de descriptividad.",
      ),
      viability: path4Viability,
      timeline: T("14-22 months", "14-22 meses"),
      fee: "USD $299",
      recommended: false,
    },
    {
      num: 5,
      title: T("Adopt a suggested alternative mark", "Adoptar una marca alternativa sugerida"),
      desc: T(
        `Create a more distinctive mark by modifying "${safeText(markName)}" with a coined suffix or prefix. Alternatives such as "${safeText(markName)}IX", "NEO${safeText(markName).slice(0, 4).toUpperCase()}", or "${safeText(markName).slice(0, 4).toUpperCase()}NOVA eliminate Art. 173 Fr. XVIII confusing-similarity risk and maximize registrability.`,
        `Crear una marca mas distintiva modificando "${safeText(markName)}" con un sufijo o prefijo acunado. Alternativas como "${safeText(markName)}IX", "NEO${safeText(markName).slice(0, 4).toUpperCase()}" o "${safeText(markName).slice(0, 4).toUpperCase()}NOVA" eliminan el riesgo de similitud confusoria bajo Art. 173 Fr. XVIII y maximizan la registrabilidad.`,
      ),
      viability: path5Viability,
      timeline: T("12-18 months", "12-18 meses"),
      fee: "USD $299",
      recommended: false,
    },
  ];

  // Mark the highest-viability path as recommended
  const maxV = Math.max(...paths.map(p => p.viability));
  const recIdx = paths.findIndex(p => p.viability === maxV);
  paths[recIdx].recommended = true;

  return paths;
}

function getAxisInterpretation(label: string, score: number, useEnglish: boolean): string {
  const T = (en: string, es: string) => useEnglish ? en : es;
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const map: Record<string, Record<string, string>> = {
    Distintividad: {
      high: T("Strong mark — favorable for registration.", "Marca fuerte — favorable para el registro."),
      medium: T("Moderate strength — consider strengthening the mark.", "Fortaleza moderada — considere reforzar la marca."),
      low: T("Weak mark — high refusal risk under Art. 173 LFPPI.", "Marca debil — alto riesgo de rechazo bajo Art. 173 LFPPI."),
    },
    LFPPI: {
      high: T("No significant absolute grounds for refusal detected.", "No se detectaron causales absolutas significativas de rechazo."),
      medium: T("Some LFPPI grounds raised — review recommended.", "Algunas causales LFPPI identificadas — se recomienda revision."),
      low: T("Multiple absolute grounds for refusal identified.", "Multiples causales absolutas de rechazo identificadas."),
    },
    "Registro IMPI": {
      high: T("Few conflicting marks found in IMPI registry.", "Pocas marcas conflictivas encontradas en el registro IMPI."),
      medium: T("Moderate number of potentially conflicting marks.", "Numero moderado de marcas potencialmente conflictivas."),
      low: T("High number of conflicting marks in IMPI registry.", "Alto numero de marcas conflictivas en el registro IMPI."),
    },
    "Disp. Registral": {
      high: T("High registry availability — favorable filing outlook.", "Alta disponibilidad registral — panorama favorable."),
      medium: T("Moderate availability — some conflicts to manage.", "Disponibilidad moderada — algunos conflictos por gestionar."),
      low: T("Low availability — significant registry obstacles.", "Baja disponibilidad — obstaculos registrales significativos."),
    },
    Traduccion: {
      high: T("No problematic translations or transliterations detected.", "Sin traducciones o transliteraciones problematicas."),
      medium: T("Some translation risks identified.", "Algunos riesgos de traduccion identificados."),
      low: T("Significant translation conflicts detected.", "Conflictos de traduccion significativos detectados."),
    },
  };
  return map[label]?.[level] ?? "";
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────

async function buildPdf(
  markName: string,
  goodsServices: string,
  orderId: string,
  result: ClearanceResult,
  openAiKey?: string,
  purchaserEmail?: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const dateDisplay = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const niceClasses = result.niceClassification ?? [];
  const searchLang = (result.searchLanguage ?? "en") as Lang;
  const isBilingual = searchLang !== "en";

  const score = computeScore(result);
  const verdict = scoreToVerdict(score);
  const vc = verdictColor(verdict);
  const pentagonScores = computePentagonScores(result);
  const shortId = orderId.slice(0, 8).toUpperCase();

  const safeMarkName = safeText(markName).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
  const classNum = niceClasses.length > 0 ? String(niceClasses[0].classNumber) : "X";

  let commentary = { native: "", english: "" };
  if (openAiKey) {
    commentary = await generateAttorneyCommentary(openAiKey, markName, goodsServices, result, searchLang);
  }

  const pages: PDFPage[] = [];
  const sectionNames: string[] = [];

  const newPage = (sectionName = "") => {
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    // Pure white background — no beige, no tint
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.white });
    pages.push(p);
    sectionNames.push(sectionName);
    return p;
  };

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER PAGE
  // ══════════════════════════════════════════════════════════════════════
  {
    const p = newPage("Cover");

    // ── Header bar: wordmark only, clean ──
    const headerH = 52;
    p.drawRectangle({ x: 0, y: PAGE_H - headerH, width: PAGE_W, height: headerH, color: C.white });
    p.drawRectangle({ x: 0, y: PAGE_H - headerH, width: PAGE_W, height: 0.8, color: C.border });

    // Wordmark — left aligned, teal
    p.drawText("MEXICO TRADEMARK CENTER", { x: MARGIN_X, y: PAGE_H - 28, size: 13, font: bold, color: C.primary });
    p.drawText("MexicoTrademarkCenter.com", { x: MARGIN_X, y: PAGE_H - 42, size: 8, font: regular, color: C.textMuted });

    // Report type — right aligned
    const rtLabel = "TRADEMARK CLEARANCE REPORT";
    const rtW = regular.widthOfTextAtSize(rtLabel, 8);
    p.drawText(rtLabel, { x: PAGE_W - MARGIN_X - rtW, y: PAGE_H - 28, size: 8, font: regular, color: C.textMuted });
    const rt2 = "Dictamen de Viabilidad Marcaria";
    const rt2W = italic.widthOfTextAtSize(rt2, 8);
    p.drawText(rt2, { x: PAGE_W - MARGIN_X - rt2W, y: PAGE_H - 40, size: 8, font: italic, color: C.textMuted });

    // ── Mark name — large display ──
    const markY = PAGE_H - headerH - 50;
    const mnStr = safeText(markName).toUpperCase();
    const mnSize = mnStr.length > 16 ? 36 : mnStr.length > 10 ? 44 : 52;
    const mnW = bold.widthOfTextAtSize(mnStr, mnSize);
    p.drawText(mnStr, { x: (PAGE_W - mnW) / 2, y: markY, size: mnSize, font: bold, color: C.textPrimary });

    // Class chips
    const classChipY = markY - 22;
    if (niceClasses.length > 0) {
      const chipParts = niceClasses.map(nc => `Clase ${nc.classNumber}`);
      const chipStr = chipParts.join("  ·  ");
      const chipW = bold.widthOfTextAtSize(chipStr, 9);
      p.drawText(chipStr, { x: (PAGE_W - chipW) / 2, y: classChipY, size: 9, font: bold, color: C.primary });
    }

    // Goods/services — wrapped, centered
    if (goodsServices) {
      const gsLines = wrapText(safeText(goodsServices), regular, 9, CONTENT_W - 40).slice(0, 3);
      let gsY = classChipY - 18;
      for (const line of gsLines) {
        const gW = regular.widthOfTextAtSize(line, 9);
        p.drawText(line, { x: (PAGE_W - gW) / 2, y: gsY, size: 9, font: regular, color: C.textSecond });
        gsY -= 14;
      }
    }

    // ── Divider ──
    const divY = PAGE_H - headerH - 160;
    p.drawRectangle({ x: MARGIN_X, y: divY, width: CONTENT_W, height: 0.8, color: C.border });

    // ── Score gauge ──
    const gaugeSection = divY - 10;
    const gaugeCX = PAGE_W / 2;
    const gaugeCY = gaugeSection - 72;
    const gaugeR = 48;

    // Outer track
    drawArc(p, gaugeCX, gaugeCY, gaugeR, 10, 1, C.border);
    // Score arc in verdict color
    drawArc(p, gaugeCX, gaugeCY, gaugeR, 10, score / 100, vc);
    // Inner white fill
    p.drawCircle({ x: gaugeCX, y: gaugeCY, size: gaugeR - 7, color: C.white });

    // Score number
    const scoreStr = String(score);
    const scoreSz = 34;
    const scoreW = bold.widthOfTextAtSize(scoreStr, scoreSz);
    p.drawText(scoreStr, { x: gaugeCX - scoreW / 2, y: gaugeCY + 8, size: scoreSz, font: bold, color: C.textPrimary });
    const outOfStr = "/ 100";
    const outOfW = regular.widthOfTextAtSize(outOfStr, 11);
    p.drawText(outOfStr, { x: gaugeCX - outOfW / 2, y: gaugeCY - 14, size: 11, font: regular, color: C.textMuted });

    // Verdict label below gauge
    const vLabel = verdictLabel(verdict, searchLang);
    const vLabelW = bold.widthOfTextAtSize(vLabel, 11) + 20;
    const vBadgeX = gaugeCX - vLabelW / 2;
    const vBadgeY = gaugeCY - gaugeR - 16;
    p.drawRectangle({ x: vBadgeX, y: vBadgeY - 16, width: vLabelW, height: 18, color: vc });
    p.drawText(vLabel, { x: vBadgeX + 10, y: vBadgeY - 9, size: 11, font: bold, color: C.white });

    // One-liner verdict explanation
    const vOneliner = verdictOneLiner(verdict, searchLang);
    const vOneLinerLines = wrapText(vOneliner, regular, 9, CONTENT_W - 80);
    let vlY = vBadgeY - 28;
    for (const vl of vOneLinerLines.slice(0, 2)) {
      const vlW = regular.widthOfTextAtSize(vl, 9);
      p.drawText(vl, { x: (PAGE_W - vlW) / 2, y: vlY, size: 9, font: regular, color: C.textSecond });
      vlY -= 13;
    }

    // ── Score meaning legend — 5 rows ──
    const legendY = gaugeCY - gaugeR - 76;
    const legendTitleEn = "WHAT THIS SCORE MEANS";
    const legendTitleEs = "QUE SIGNIFICA ESTE PUNTAJE";
    const legendTitle = isBilingual ? legendTitleEs : legendTitleEn;
    const ltW = bold.widthOfTextAtSize(legendTitle, 8);
    p.drawText(legendTitle, { x: (PAGE_W - ltW) / 2, y: legendY, size: 8, font: bold, color: C.textMuted });
    p.drawRectangle({ x: MARGIN_X + 40, y: legendY - 4, width: CONTENT_W - 80, height: 0.5, color: C.border });

    const legendRows: Array<{ range: string; label: string; desc_en: string; desc_es: string; v: Verdict }> = [
      { range: "90-100", label: "CLEAR / SIN OBSTACULOS", desc_en: "No material obstacles", desc_es: "Sin obstaculos materiales", v: "CLEAR" },
      { range: "75-89",  label: "LOW / BAJO",             desc_en: "Few obstacles — registrable", desc_es: "Pocos obstaculos — registrable", v: "LOW" },
      { range: "55-74",  label: "MODERATE / MODERADO",    desc_en: "Registrable with strategy", desc_es: "Registrable con estrategia", v: "MODERATE" },
      { range: "30-54",  label: "HIGH / ALTO",            desc_en: "Multiple significant obstacles", desc_es: "Multiples obstaculos significativos", v: "HIGH" },
      { range: "0-29",   label: "CRITICAL / CRITICO",     desc_en: "Registration highly unlikely", desc_es: "Registro altamente improbable", v: "CRITICAL" },
    ];

    let lRowY = legendY - 14;
    for (const row of legendRows) {
      const isThis = row.v === verdict;
      const rowColor = verdictColor(row.v);
      // Color dot
      p.drawCircle({ x: MARGIN_X + 44, y: lRowY - 4, size: 5, color: rowColor });
      // Range
      p.drawText(row.range, { x: MARGIN_X + 54, y: lRowY - 8, size: 8, font: regular, color: C.textMuted });
      // Label
      p.drawText(row.label, { x: MARGIN_X + 90, y: lRowY - 8, size: 8, font: isThis ? bold : regular, color: isThis ? rowColor : C.textSecond });
      // Description
      const desc = isBilingual ? row.desc_es : row.desc_en;
      p.drawText(desc, { x: MARGIN_X + 240, y: lRowY - 8, size: 8, font: regular, color: C.textMuted });
      // Marker triangle for current verdict
      if (isThis) {
        p.drawText("<", { x: PAGE_W - MARGIN_X - 20, y: lRowY - 8, size: 9, font: bold, color: rowColor });
      }
      lRowY -= 14;
    }

    // ── Quick-stats tiles — 4 equal columns ──
    const tilesY = lRowY - 12;
    p.drawRectangle({ x: MARGIN_X, y: tilesY - 1, width: CONTENT_W, height: 0.5, color: C.border });
    const tilesStartY = tilesY - 10;
    const tileW = (CONTENT_W - 12) / 4;
    const tileH = 62;
    const keyFindings = buildKeyFindings(result);
    const dist = result.distinctiveness;
    const rawDistScore = dist ? (dist.score <= 5 ? dist.score * 20 : dist.score) : 0;
    const tierEs: Record<string, string> = { generic: "Generica", descriptive: "Descriptiva", suggestive: "Sugestiva", arbitrary: "Arbitraria", fanciful: "De Fantasia" };

    const tiles = [
      {
        value: String(marciaFindings_count(result)),
        label_en: "Critical conflicts",
        label_es: "Conflictos criticos",
        color: keyFindings[0]?.color ?? C.textMuted,
      },
      {
        value: `${(result.registrabilityFlags ?? []).length}`,
        label_en: "LFPPI grounds raised",
        label_es: "Causales LFPPI",
        color: (result.registrabilityFlags ?? []).length > 0 ? C.warning : C.success,
      },
      {
        value: dist ? `${tierEs[dist.tier] ?? dist.tier} ${dist.score <= 5 ? dist.score + "/5" : rawDistScore + "/100"}` : "N/A",
        label_en: "Distinctiveness",
        label_es: "Distintividad",
        color: rawDistScore >= 60 ? C.success : rawDistScore >= 40 ? C.warning : C.critical,
      },
      {
        value: `${result.marciaTotalCount ?? (result.marciaFindings ?? []).length}`,
        label_en: "Marks in IMPI search",
        label_es: "Marcas en busqueda IMPI",
        color: (result.marciaTotalCount ?? 0) > 5 ? C.critical : C.warning,
      },
    ];

    for (let ti = 0; ti < tiles.length; ti++) {
      const tx = MARGIN_X + ti * (tileW + 4);
      const tile = tiles[ti];
      drawCard(p, tx, tilesStartY, tileW, tileH);
      const tileLabel = isBilingual ? tile.label_es : tile.label_en;
      // Label at top
      const tlLines = wrapText(tileLabel.toUpperCase(), regular, 7, tileW - 12);
      let tly = tilesStartY - 10;
      for (const tll of tlLines.slice(0, 2)) {
        p.drawText(tll, { x: tx + 6, y: tly, size: 7, font: regular, color: C.textMuted });
        tly -= 9;
      }
      // Value
      const tvLines = wrapText(safeText(tile.value), bold, 13, tileW - 12);
      let tvY = tilesStartY - tileH + 24;
      for (const tvl of tvLines.slice(0, 2)) {
        p.drawText(tvl, { x: tx + 6, y: tvY, size: 13, font: bold, color: tile.color });
        tvY += 14;
      }
      // Color stripe at bottom
      p.drawRectangle({ x: tx, y: tilesStartY - tileH, width: tileW, height: 3, color: tile.color });
    }

    // ── Footer ──
    const footerY = tilesStartY - tileH - 20;
    p.drawRectangle({ x: MARGIN_X, y: footerY, width: CONTENT_W, height: 0.5, color: C.border });
    const footerParts = [
      "Mexico — IMPI Registry",
      dateDisplay,
      `Report ID: ${shortId}`,
      "Preliminary analysis. Not legal advice.",
    ];
    const footerStr = footerParts.join("  ·  ");
    const footerW = regular.widthOfTextAtSize(footerStr, 7.5);
    p.drawText(footerStr, { x: (PAGE_W - footerW) / 2, y: footerY - 14, size: 7.5, font: regular, color: C.textMuted });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Helper: render all analysis sections
  // ══════════════════════════════════════════════════════════════════════

  const renderAllSections = (lang: Lang, useEnglish: boolean) => {
    const T = (en: string, es: string) => useEnglish ? en : es;
    const tierLabel = (tier: string) => {
      const en: Record<string, string> = { generic: "Generic", descriptive: "Descriptive", suggestive: "Suggestive", arbitrary: "Arbitrary", fanciful: "Fanciful" };
      const es: Record<string, string> = { generic: "Generica", descriptive: "Descriptiva", suggestive: "Sugestiva", arbitrary: "Arbitraria", fanciful: "De Fantasia" };
      return useEnglish ? (en[tier] ?? tier) : (es[tier] ?? tier);
    };

    // ── EXECUTIVE SUMMARY ────────────────────────────────────────────
    {
      const p = newPage(T("Executive Summary", "Resumen Ejecutivo"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Executive Summary", "Resumen Ejecutivo"));

      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("EXECUTIVE SUMMARY", "RESUMEN EJECUTIVO"),
        T(`Registrability assessment — ${safeText(markName)}`, `Evaluacion de registrabilidad — ${safeText(markName)}`),
        y,
      );
      y -= 8;

      // Verdict card — white with colored left stripe and tinted background (small element)
      const verdictH = 60;
      const vt = verdictOneLiner(verdict, lang);
      const vtLabelStr = verdictLabel(verdict, lang);
      p.drawRectangle({ x: MARGIN_X, y: y - verdictH, width: CONTENT_W, height: verdictH, color: verdictTint(verdict), borderColor: C.border, borderWidth: 0.8 });
      p.drawRectangle({ x: MARGIN_X, y: y - verdictH, width: 5, height: verdictH, color: vc });
      p.drawText(vtLabelStr, { x: MARGIN_X + 14, y: y - 18, size: 13, font: bold, color: vc });
      const vtLines = wrapText(vt, regular, 9, CONTENT_W - 100);
      let vtY = y - 34;
      for (const vtl of vtLines.slice(0, 2)) {
        p.drawText(vtl, { x: MARGIN_X + 14, y: vtY, size: 9, font: regular, color: C.textSecond });
        vtY -= 13;
      }
      // Score pill — top right
      const spStr = `${score}/100`;
      const spW = bold.widthOfTextAtSize(spStr, 12) + 16;
      p.drawRectangle({ x: MARGIN_X + CONTENT_W - spW - 6, y: y - 38, width: spW, height: 26, color: vc });
      p.drawText(spStr, { x: MARGIN_X + CONTENT_W - spW, y: y - 22, size: 12, font: bold, color: C.white });
      y -= verdictH + 12;

      // Risk summary paragraph
      const summaryText = useEnglish ? (result.riskSummary_en ?? result.riskSummary ?? "") : (result.riskSummary ?? result.riskSummary_en ?? "");
      if (summaryText) {
        const sumLines = wrapText(summaryText, regular, 9, CONTENT_W - 24);
        const sumH = sumLines.length * 13.5 + 20;
        drawCard(p, MARGIN_X, y, CONTENT_W, sumH);
        p.drawRectangle({ x: MARGIN_X, y: y - sumH, width: CONTENT_W, height: 2, color: C.primary });
        let sy = y - 14;
        for (const sl of sumLines) {
          if (sy < MARGIN_BOT + 10) break;
          p.drawText(sl, { x: MARGIN_X + 12, y: sy, size: 9, font: regular, color: C.textPrimary });
          sy -= 13.5;
        }
        y -= sumH + 10;
      }

      // Attorney notes
      const commentText = useEnglish ? commentary.english : commentary.native;
      if (commentText) {
        p.drawText(T("ATTORNEY NOTES", "NOTAS DE ANALISIS"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.primary });
        y -= 10;
        const cmLines = wrapText(commentText, regular, 9, CONTENT_W - 24);
        const cmH = cmLines.length * 13.5 + 20;
        drawCard(p, MARGIN_X, y, CONTENT_W, Math.min(cmH, 160));
        let cy2 = y - 14;
        for (const cl of cmLines) {
          if (cy2 < MARGIN_BOT + 20 || cy2 < y - 150) break;
          p.drawText(cl, { x: MARGIN_X + 12, y: cy2, size: 9, font: regular, color: C.textPrimary });
          cy2 -= 13.5;
        }
        y -= Math.min(cmH, 160) + 12;
      }

      // Key findings — 3 tiles
      if (y > MARGIN_BOT + 80) {
        const findings = buildKeyFindings(result);
        if (findings.length > 0) {
          p.drawText(T("KEY FINDINGS", "HALLAZGOS CLAVE"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
          y -= 10;
          const colW3 = (CONTENT_W - 8) / 3;
          const cardH3 = 80;
          for (let i = 0; i < Math.min(findings.length, 3); i++) {
            const fx = MARGIN_X + i * (colW3 + 4);
            const finding = findings[i];
            drawCard(p, fx, y, colW3, cardH3);
            p.drawRectangle({ x: fx, y: y - cardH3, width: colW3, height: 3, color: finding.color });
            const ftTitle = useEnglish ? finding.title_en : finding.title_es;
            p.drawText(safeText(ftTitle), { x: fx + 8, y: y - 14, size: 8.5, font: bold, color: C.textPrimary });
            const ftDesc = useEnglish ? finding.desc_en : finding.desc_es;
            const descLines = wrapText(ftDesc, regular, 7.5, colW3 - 16);
            let fy = y - 28;
            for (const dl of descLines.slice(0, 3)) {
              p.drawText(dl, { x: fx + 8, y: fy, size: 7.5, font: regular, color: C.textSecond });
              fy -= 11;
            }
            // DataPoint at bottom — full text, wrapped
            const dpLines = wrapText(safeText(finding.dataPoint), bold, 7, colW3 - 16);
            let dpY = y - cardH3 + 12;
            for (const dl of dpLines.slice(0, 2)) {
              p.drawText(dl, { x: fx + 8, y: dpY, size: 7, font: bold, color: finding.color });
              dpY += 10;
            }
          }
          y -= cardH3 + 12;
        }
      }

      // 5-axis pentagon
      if (y > MARGIN_BOT + 120) {
        p.drawText(T("5-AXIS RISK PROFILE", "PERFIL DE RIESGO — 5 EJES"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 10;
        const pCardH = 130;
        drawCard(p, MARGIN_X, y, CONTENT_W, pCardH);

        const pentCX = MARGIN_X + 88;
        const pentCY = y - pCardH / 2;
        drawPentagon(p, pentCX, pentCY, 120, pentagonScores, regular, bold, vc);

        const barsX = MARGIN_X + 180;
        const barsW = CONTENT_W - 180 - 10;
        let by = y - 14;
        for (const ps of pentagonScores) {
          const barColor = ps.score >= 70 ? C.success : ps.score >= 40 ? C.warning : C.critical;
          const labelLines = wrapText(safeText(ps.label), bold, 7.5, barsW - 28);
          for (const ll of labelLines.slice(0, 1)) {
            p.drawText(ll, { x: barsX, y: by, size: 7.5, font: bold, color: C.textPrimary });
          }
          p.drawText(`${ps.score}`, { x: barsX + barsW - 22, y: by, size: 7.5, font: bold, color: barColor });
          by -= 12;
          p.drawRectangle({ x: barsX, y: by - 3, width: barsW - 24, height: 6, color: C.border });
          p.drawRectangle({ x: barsX, y: by - 3, width: (barsW - 24) * ps.score / 100, height: 6, color: barColor });
          by -= 14;
          const interp = getAxisInterpretation(ps.label, ps.score, useEnglish);
          const interpLines = wrapText(safeText(interp), italic, 6.5, barsW);
          for (const il of interpLines.slice(0, 1)) {
            p.drawText(il, { x: barsX, y: by, size: 6.5, font: italic, color: C.textMuted });
          }
          by -= 12;
        }
        y -= pCardH + 8;
      }
    }

    // ── CONFLICTING MARKS ────────────────────────────────────────────
    {
      const findings = result.marciaFindings ?? [];
      const totalCount = result.marciaTotalCount ?? findings.length;
      const critical = findings.filter(f => isHighSimilarity(f, markName));
      const significant = findings.filter(f => !isHighSimilarity(f, markName) && isMedSimilarity(f, markName));
      const background = findings.filter(f => !isHighSimilarity(f, markName) && !isMedSimilarity(f, markName));

      let p = newPage(T("Conflicting Marks", "Marcas en Conflicto"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Conflicting Marks", "Marcas en Conflicto"));

      let y = PAGE_H - 34;
      const subTitle = `${critical.length} ${T("critical", "criticas")}  |  ${significant.length} ${T("significant", "significativas")}  |  ${background.length} ${T("background", "ruido de fondo")}`;
      y = addSectionHeader(p, bold,
        T("CONFLICTING MARKS — IMPI MARCIA RESULTS", "MARCAS EN CONFLICTO — RESULTADOS IMPI MARCIA"),
        subTitle,
        y,
      );
      y -= 8;

      if (totalCount > 0) {
        const barH = 20;
        drawCard(p, MARGIN_X, y, CONTENT_W, barH + 14);
        let bx = MARGIN_X + 1;
        const segments = [
          { label: `${T("Critical", "Criticas")} (${critical.length})`, count: critical.length, color: C.critical },
          { label: `${T("Significant", "Significativas")} (${significant.length})`, count: significant.length, color: C.warning },
          { label: `${T("Background", "Fondo")} (${background.length})`, count: background.length, color: C.textMuted },
        ];
        const totalSeg = segments.reduce((a, s) => a + s.count, 0) || 1;
        for (const seg of segments) {
          const segW = Math.max(seg.count > 0 ? 40 : 0, ((CONTENT_W - 2) * seg.count) / totalSeg);
          if (segW > 0) {
            p.drawRectangle({ x: bx, y: y - barH, width: segW, height: barH, color: seg.color });
            if (segW > 40) {
              const slLines = wrapText(safeText(seg.label), bold, 6.5, segW - 8);
              p.drawText(slLines[0] ?? "", { x: bx + 4, y: y - 13, size: 6.5, font: bold, color: C.white });
            }
            bx += segW;
          }
        }
        y -= barH + 20;
        const analyzed = T(`Analyzed ${totalCount} marks from IMPI MARCia database`, `Se analizaron ${totalCount} marcas del registro IMPI MARCia`);
        p.drawText(analyzed, { x: MARGIN_X, y, size: 7.5, font: regular, color: C.textMuted });
        y -= 18;
      }

      // Critical tier
      if (critical.length > 0) {
        p.drawRectangle({ x: MARGIN_X, y: y - 24, width: CONTENT_W, height: 26, color: C.criticalTint });
        p.drawRectangle({ x: MARGIN_X, y: y - 24, width: 4, height: 26, color: C.critical });
        p.drawText(T("CRITICAL — Direct obstacles to registration", "CRITICO — Obstaculos directos al registro"), { x: MARGIN_X + 12, y: y - 12, size: 8.5, font: bold, color: C.critical });
        p.drawText(T("Art. 173 Fr. XVIII LFPPI — high phonetic/visual/conceptual similarity", "Art. 173 Fr. XVIII LFPPI — alta similitud fonetica/visual/conceptual"), { x: MARGIN_X + 12, y: y - 21, size: 7, font: regular, color: C.textSecond });
        y -= 34;

        for (let i = 0; i < critical.length; i++) {
          const f = critical[i];
          if (y < MARGIN_BOT + 80) {
            p = newPage(T("Conflicting Marks (cont.)", "Marcas en Conflicto (cont.)"));
            addPageHeader(p, regular, bold, markName, niceClasses, T("Conflicting Marks", "Marcas en Conflicto"));
            y = PAGE_H - 44;
          }

          // Dynamic card height
          const holderLines = wrapText(T("Holder: ", "Titular: ") + safeText(f.holder), regular, 8, CONTENT_W - 72);
          const cardH = 28 + Math.max(holderLines.length * 11, 16) + 48;
          drawCard(p, MARGIN_X, y, CONTENT_W, cardH);

          // Similarity arc (left)
          const simScore = f.similarityScore ?? (f.name.toLowerCase().trim() === markName.toLowerCase().trim() ? 98 : 72);
          const simColor = simScore >= 80 ? C.critical : simScore >= 60 ? C.warning : C.primary;
          const dotCX = MARGIN_X + 30;
          const dotCY = y - 32;
          drawArc(p, dotCX, dotCY, 20, 5, 1, C.border);
          drawArc(p, dotCX, dotCY, 20, 5, simScore / 100, simColor);
          p.drawCircle({ x: dotCX, y: dotCY, size: 14, color: C.white });
          const simStr = `${simScore}`;
          const simW = bold.widthOfTextAtSize(simStr, 9);
          p.drawText(simStr, { x: dotCX - simW / 2, y: dotCY - 4, size: 9, font: bold, color: simColor });

          // Mark info
          const infoX = MARGIN_X + 62;
          const nameW = CONTENT_W - 62 - 100;
          const nameLines = wrapText(safeText(f.name).toUpperCase(), bold, 11, nameW);
          p.drawText(nameLines[0] ?? "", { x: infoX, y: y - 14, size: 11, font: bold, color: C.textPrimary });
          drawStatusPill(p, bold, f.status, MARGIN_X + CONTENT_W - 98, y - 14);

          let hY = y - 28;
          for (const hl of holderLines.slice(0, 2)) {
            p.drawText(hl, { x: infoX, y: hY, size: 8, font: regular, color: C.textSecond });
            hY -= 11;
          }

          // Expediente — full format, monospaced style
          const expParts = [
            f.expediente ? `Exp. ${f.expediente}` : "",
            `${T("Class", "Clase")} ${f.classNum}`,
            "Mexico IMPI",
          ].filter(Boolean);
          p.drawText(expParts.join("  ·  "), { x: infoX, y: hY - 2, size: 8, font: regular, color: C.textMuted });

          p.drawRectangle({ x: MARGIN_X + 8, y: y - 56, width: CONTENT_W - 16, height: 0.5, color: C.border });

          // Analysis text — in report language only
          const analysisText = useEnglish
            ? `This mark "${safeText(f.name)}" in ${T("Class", "Clase")} ${f.classNum} presents a conflict under Art. 173 Fr. XVIII LFPPI due to phonetic and visual similarity with the applied-for mark. The dominant element creates a likelihood of confusion among consumers. Registration is at risk without mark modifications.`
            : `Esta marca "${safeText(f.name)}" en Clase ${f.classNum} presenta un conflicto bajo Art. 173 Fr. XVIII LFPPI por similitud fonetica y visual con la marca solicitante. El elemento dominante genera riesgo de confusion entre consumidores. El registro esta en riesgo sin modificaciones.`;

          const anLines = wrapText(analysisText, regular, 7.5, CONTENT_W - 20);
          let aY = y - 66;
          for (const al of anLines.slice(0, 3)) {
            if (aY < MARGIN_BOT + 8) break;
            p.drawText(al, { x: MARGIN_X + 10, y: aY, size: 7.5, font: regular, color: C.textPrimary });
            aY -= 11;
          }

          y -= cardH + 6;
        }
      }

      // Significant tier
      if (significant.length > 0) {
        if (y < MARGIN_BOT + 60) {
          p = newPage(T("Conflicting Marks (cont.)", "Marcas en Conflicto (cont.)"));
          addPageHeader(p, regular, bold, markName, niceClasses, T("Conflicting Marks", "Marcas en Conflicto"));
          y = PAGE_H - 44;
        }
        p.drawRectangle({ x: MARGIN_X, y: y - 24, width: CONTENT_W, height: 26, color: C.warningTint });
        p.drawRectangle({ x: MARGIN_X, y: y - 24, width: 4, height: 26, color: C.warning });
        p.drawText(T("SIGNIFICANT — Moderate obstacles", "SIGNIFICATIVO — Obstaculos moderados"), { x: MARGIN_X + 12, y: y - 14, size: 8.5, font: bold, color: C.warning });
        y -= 34;

        for (let i = 0; i < Math.min(significant.length, 6); i++) {
          const f = significant[i];
          if (y < MARGIN_BOT + 60) {
            p = newPage(T("Conflicting Marks (cont.)", "Marcas en Conflicto (cont.)"));
            addPageHeader(p, regular, bold, markName, niceClasses, T("Conflicting Marks", "Marcas en Conflicto"));
            y = PAGE_H - 44;
          }
          const sigHolder = wrapText(T("Holder: ", "Titular: ") + safeText(f.holder), regular, 8, CONTENT_W - 20);
          const cardH2 = 18 + sigHolder.length * 11 + 20;
          drawCard(p, MARGIN_X, y, CONTENT_W, cardH2);
          const sigNameLines = wrapText(safeText(f.name).toUpperCase(), bold, 10, CONTENT_W - 110);
          p.drawText(sigNameLines[0] ?? "", { x: MARGIN_X + 10, y: y - 14, size: 10, font: bold, color: C.textPrimary });
          drawStatusPill(p, bold, f.status, MARGIN_X + CONTENT_W - 98, y - 14);
          let shY = y - 28;
          for (const hl of sigHolder.slice(0, 2)) {
            p.drawText(hl, { x: MARGIN_X + 10, y: shY, size: 8, font: regular, color: C.textSecond });
            shY -= 11;
          }
          const expParts2 = [f.expediente ? `Exp. ${f.expediente}` : "", `${T("Class", "Clase")} ${f.classNum}`, "Mexico IMPI"].filter(Boolean);
          p.drawText(expParts2.join("  ·  "), { x: MARGIN_X + 10, y: shY - 2, size: 7.5, font: regular, color: C.textMuted });
          y -= cardH2 + 4;
        }
      }

      // Background noise
      if (background.length > 0) {
        if (y < MARGIN_BOT + 80) {
          p = newPage(T("Conflicting Marks (cont.)", "Marcas en Conflicto (cont.)"));
          addPageHeader(p, regular, bold, markName, niceClasses, T("Conflicting Marks", "Marcas en Conflicto"));
          y = PAGE_H - 44;
        }
        p.drawText(T("BACKGROUND NOISE", "RUIDO DE FONDO"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 14;
        p.drawRectangle({ x: MARGIN_X, y: y - 16, width: CONTENT_W, height: 18, color: C.divider });
        p.drawRectangle({ x: MARGIN_X, y: y - 16, width: CONTENT_W, height: 0.6, color: C.border });
        const cols = [
          { x: MARGIN_X + 6, w: 130, label_en: "Mark", label_es: "Marca" },
          { x: MARGIN_X + 144, w: 130, label_en: "Holder", label_es: "Titular" },
          { x: MARGIN_X + 282, w: 50, label_en: "Class", label_es: "Clase" },
          { x: MARGIN_X + 340, w: 100, label_en: "Status", label_es: "Estado" },
        ];
        for (const col of cols) {
          p.drawText(useEnglish ? col.label_en : col.label_es, { x: col.x, y: y - 10, size: 7.5, font: bold, color: C.textPrimary });
        }
        y -= 22;

        for (let i = 0; i < Math.min(background.length, 15) && y > MARGIN_BOT; i++) {
          const f = background[i];
          const nameLines = wrapText(safeText(f.name), regular, 8, cols[0].w - 4);
          const holderLines = wrapText(safeText(f.holder), regular, 8, cols[1].w - 4);
          const rowLines = Math.max(nameLines.length, holderLines.length, 1);
          const rowH = rowLines * 11 + 5;
          const rowBg = i % 2 === 0 ? C.divider : C.white;
          p.drawRectangle({ x: MARGIN_X, y: y - rowH, width: CONTENT_W, height: rowH, color: rowBg });
          let nY = y - 8;
          for (const nl of nameLines.slice(0, rowLines)) { p.drawText(nl, { x: cols[0].x, y: nY, size: 8, font: regular, color: C.textPrimary }); nY -= 11; }
          let hY2 = y - 8;
          for (const hl of holderLines.slice(0, rowLines)) { p.drawText(hl, { x: cols[1].x, y: hY2, size: 8, font: regular, color: C.textSecond }); hY2 -= 11; }
          p.drawText(safeText(f.classNum), { x: cols[2].x, y: y - 8, size: 8, font: regular, color: C.textSecond });
          p.drawText(safeText(f.status), { x: cols[3].x, y: y - 8, size: 8, font: regular, color: C.textSecond });
          y -= rowH + 2;
        }
      }
    }

    // ── LFPPI ANALYSIS ────────────────────────────────────────────────
    {
      const flags = result.registrabilityFlags ?? [];
      const p = newPage(T("LFPPI Analysis", "Analisis LFPPI"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("LFPPI Registrability Analysis", "Analisis de Registrabilidad LFPPI"));

      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("LFPPI REGISTRABILITY ANALYSIS", "ANALISIS DE REGISTRABILIDAD LFPPI"),
        T("Evaluation against Mexico's Ley Federal de Proteccion a la Propiedad Industrial", "Evaluacion bajo la LFPPI — legislacion mexicana de propiedad industrial"),
        y,
      );
      y -= 8;

      // Summary callout
      const failed = flags.filter(f => f.severity === "high" || f.severity === "medium").length;
      const summaryStr = `${failed} ${T("grounds raised", "causales identificadas")}  ·  ${LFPPI_PASSED_GROUNDS.length} ${T("fracciones passed", "fracciones aprobadas")}`;
      p.drawRectangle({ x: MARGIN_X, y: y - 26, width: CONTENT_W, height: 30, color: C.white, borderColor: C.primary, borderWidth: 1 });
      p.drawRectangle({ x: MARGIN_X, y: y - 26, width: 4, height: 30, color: C.primary });
      const sumW = bold.widthOfTextAtSize(summaryStr, 9);
      p.drawText(summaryStr, { x: (PAGE_W - sumW) / 2, y: y - 12, size: 9, font: bold, color: C.primary });
      y -= 42;

      if (flags.length === 0) {
        drawCard(p, MARGIN_X, y, CONTENT_W, 44, C.successTint);
        p.drawRectangle({ x: MARGIN_X, y: y - 44, width: 4, height: 44, color: C.success });
        const noGrounds = T("No absolute grounds for refusal detected under the LFPPI.", "No se detectaron causales absolutas de negativa bajo la LFPPI.");
        p.drawText(noGrounds, { x: MARGIN_X + 14, y: y - 20, size: 10, font: bold, color: C.success });
        y -= 56;
      } else {
        const sorted = [...flags].sort((a, b) => {
          const sv: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (sv[a.severity] ?? 2) - (sv[b.severity] ?? 2);
        });

        for (const flag of sorted) {
          if (y < MARGIN_BOT + 60) break;
          const sColor = flag.severity === "high" ? C.critical : flag.severity === "medium" ? C.warning : C.success;
          const catInfo = CATEGORY_LABELS[flag.category] ?? { en: flag.category, es: flag.category, lfppi: "Art. 173 LFPPI" };
          const catLabel = useEnglish ? catInfo.en : catInfo.es;
          const explainText = useEnglish ? (flag.explanation_en ?? flag.explanation) : flag.explanation;
          const explainLines = wrapText(explainText, regular, 8.5, CONTENT_W - 28);
          const cardH = 28 + explainLines.length * 13 + 12;
          drawCard(p, MARGIN_X, y, CONTENT_W, cardH);

          // Header — colored left bar + text on white (no full-width colored bar)
          p.drawRectangle({ x: MARGIN_X, y: y - cardH, width: 5, height: cardH, color: sColor });
          const failedLabel = flag.severity === "high"
            ? T("RAISED — HIGH SEVERITY", "IDENTIFICADA — ALTA SEVERIDAD")
            : T("RAISED — MEDIUM SEVERITY", "IDENTIFICADA — SEVERIDAD MEDIA");
          p.drawText(failedLabel, { x: MARGIN_X + 14, y: y - 14, size: 8, font: bold, color: sColor });
          const catW = bold.widthOfTextAtSize(catLabel, 9);
          // Wrap category label
          const catLines = wrapText(catLabel, bold, 9, CONTENT_W - 100);
          let cly = y - 14;
          for (const cl of catLines.slice(0, 1)) {
            p.drawText(cl, { x: MARGIN_X + 160, y: cly, size: 9, font: bold, color: C.textPrimary });
          }
          void catW;
          const lfppiRef = catInfo.lfppi;
          const lfW = regular.widthOfTextAtSize(lfppiRef, 8);
          p.drawText(lfppiRef, { x: MARGIN_X + CONTENT_W - lfW - 14, y: y - 14, size: 8, font: regular, color: C.textMuted });

          p.drawRectangle({ x: MARGIN_X + 14, y: y - 26, width: CONTENT_W - 28, height: 0.5, color: C.border });

          let fy = y - 38;
          for (const el of explainLines) {
            if (fy < MARGIN_BOT + 8) break;
            p.drawText(el, { x: MARGIN_X + 14, y: fy, size: 8.5, font: regular, color: C.textPrimary });
            fy -= 13;
          }
          y -= cardH + 8;
        }
      }

      // Passed grounds — LFPPI fracciones only (no USPTO boilerplate)
      if (y > MARGIN_BOT + 60) {
        y -= 4;
        p.drawText(T("LFPPI FRACCIONES — PASSED", "FRACCIONES LFPPI — APROBADAS"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 12;
        const passedList = LFPPI_PASSED_GROUNDS.filter(g => !flags.find(f => g.fraccion.includes(f.category)));
        for (let i = 0; i < Math.min(passedList.length, 10) && y > MARGIN_BOT; i++) {
          const ground = passedList[i];
          const rowBg = i % 2 === 0 ? C.divider : C.white;
          const qText = useEnglish ? ground.question_en : ground.question_es;
          const qLines = wrapText(qText, regular, 8, CONTENT_W - 100);
          const rowH = qLines.length * 11 + 8;
          p.drawRectangle({ x: MARGIN_X, y: y - rowH, width: CONTENT_W, height: rowH, color: rowBg });
          const fracW = bold.widthOfTextAtSize(ground.fraccion, 7.5);
          p.drawText(ground.fraccion, { x: MARGIN_X + 8, y: y - 8, size: 7.5, font: bold, color: C.primary });
          let qY = y - 8;
          for (const ql of qLines.slice(0, 2)) {
            p.drawText(ql, { x: MARGIN_X + fracW + 20, y: qY, size: 8, font: regular, color: C.textPrimary });
            qY -= 11;
          }
          const okStr = T("Passed", "Aprobada");
          const okW = bold.widthOfTextAtSize(okStr, 8);
          p.drawText(okStr, { x: MARGIN_X + CONTENT_W - okW - 8, y: y - 8, size: 8, font: bold, color: C.success });
          y -= rowH + 2;
        }
      }
    }

    // ── CONFUSION LIKELIHOOD ANALYSIS ────────────────────────────────
    if (result.dupont && result.dupont.length > 0) {
      const factors = result.dupont;
      const favor = factors.filter(f => f.verdict === "favors_registration" || f.verdict === "Favorable").length;
      const against = factors.filter(f => f.verdict === "against_registration" || f.verdict === "Desfavorable").length;
      const neutral = factors.length - favor - against;

      let p = newPage(T("Confusion Likelihood Analysis", "Analisis de Confundibilidad"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Confusion Likelihood Analysis", "Analisis de Confundibilidad"));

      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("CONFUSION LIKELIHOOD ANALYSIS — LFPPI Art. 173 Fr. XVIII", "ANALISIS DE CONFUNDIBILIDAD — LFPPI Art. 173 Fr. XVIII"),
        T("Triple-similarity doctrine: phonetic, visual and conceptual — dominant element analysis", "Doctrina de triple similitud: fonetica, visual y conceptual — analisis del elemento dominante"),
        y,
      );
      y -= 8;

      // Summary
      const boxW2 = (CONTENT_W - 8) / 3;
      const summaryBoxes = [
        { label: T(`${favor} Favorable`, `${favor} Favorable`), color: C.success },
        { label: T(`${neutral} Neutral`, `${neutral} Neutral`), color: C.textMuted },
        { label: T(`${against} Unfavorable`, `${against} Desfavorable`), color: C.critical },
      ];
      for (let i = 0; i < summaryBoxes.length; i++) {
        const bx = MARGIN_X + i * (boxW2 + 4);
        p.drawRectangle({ x: bx, y: y - 28, width: boxW2, height: 30, color: C.white, borderColor: summaryBoxes[i].color, borderWidth: 1.5 });
        p.drawRectangle({ x: bx, y: y - 28, width: 4, height: 30, color: summaryBoxes[i].color });
        const lw = bold.widthOfTextAtSize(safeText(summaryBoxes[i].label), 8.5);
        p.drawText(safeText(summaryBoxes[i].label), { x: bx + (boxW2 - lw) / 2, y: y - 16, size: 8.5, font: bold, color: summaryBoxes[i].color });
      }
      y -= 44;

      const COL_W = (CONTENT_W - 8) / 2;
      let col = 0;
      let colY = y;
      let colYRight = y;

      for (let i = 0; i < factors.length; i++) {
        const f = factors[i];
        const isFavor = f.verdict === "favors_registration" || f.verdict === "Favorable";
        const isAgainst = f.verdict === "against_registration" || f.verdict === "Desfavorable";
        const fc = isFavor ? C.success : isAgainst ? C.critical : C.textMuted;
        const verdLabel = isFavor ? T("FAVORABLE", "FAVORABLE") : isAgainst ? T("UNFAVORABLE", "DESFAVORABLE") : T("NEUTRAL", "NEUTRAL");
        const factorLabel = CONFUSION_FACTORS_EN[f.factor] ?? safeText(f.factor);
        const reasonText = useEnglish ? (f.reasoning_en ?? f.reasoning) : f.reasoning;
        const reasonLines = wrapText(reasonText, regular, 8, COL_W - 22);
        const factorLines = wrapText(`${i + 1}. ${factorLabel}`, bold, 8, COL_W - 60);
        const cardH = 16 + factorLines.length * 11 + reasonLines.length * 12 + 16;

        const isLeft = col % 2 === 0;
        const cx = isLeft ? MARGIN_X : MARGIN_X + COL_W + 8;

        if ((isLeft ? colY : colYRight) - cardH < MARGIN_BOT) {
          p = newPage(T("Confusion Analysis (cont.)", "Confundibilidad (cont.)"));
          addPageHeader(p, regular, bold, markName, niceClasses, T("Confusion Likelihood", "Confundibilidad"));
          colY = PAGE_H - 44;
          colYRight = colY;
          y = colY;
        }

        const useY = isLeft ? colY : colYRight;
        drawCard(p, cx, useY, COL_W, cardH);
        if (isAgainst) {
          p.drawRectangle({ x: cx, y: useY - cardH, width: 3, height: cardH, color: C.critical });
        }

        let fLy = useY - 12;
        for (const fl of factorLines.slice(0, 2)) {
          p.drawText(fl, { x: cx + 10, y: fLy, size: 8, font: bold, color: C.textPrimary });
          fLy -= 11;
        }
        const vl = bold.widthOfTextAtSize(verdLabel, 7);
        p.drawRectangle({ x: cx + COL_W - vl - 14, y: useY - 22, width: vl + 12, height: 14, color: fc });
        p.drawText(verdLabel, { x: cx + COL_W - vl - 8, y: useY - 14, size: 7, font: bold, color: C.white });

        let ry = useY - 14 - factorLines.length * 11 - 4;
        for (const rl of reasonLines) {
          if (ry < MARGIN_BOT + 8) break;
          p.drawText(rl, { x: cx + 10, y: ry, size: 8, font: regular, color: C.textPrimary });
          ry -= 12;
        }

        if (isLeft) colY -= cardH + 6;
        else colYRight -= cardH + 6;
        col++;
      }
    }

    // ── DISTINCTIVENESS ───────────────────────────────────────────────
    {
      const p = newPage(T("Distinctiveness & Translation", "Distintividad y Traduccion"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Distinctiveness & Translation", "Distintividad y Traduccion"));

      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("DISTINCTIVENESS & TRANSLATION ANALYSIS", "ANALISIS DE DISTINTIVIDAD Y TRADUCCION"),
        T("Mark strength evaluation and multi-language conflict screening", "Evaluacion de fortaleza de marca y revision de conflictos multilingue"),
        y,
      );
      y -= 8;

      const colW2 = (CONTENT_W - 16) / 2;
      const leftX = MARGIN_X;
      const rightX = MARGIN_X + colW2 + 16;

      const dist = result.distinctiveness;
      p.drawText(T("DISTINCTIVENESS / DISTINTIVIDAD", "DISTINTIVIDAD / DISTINCTIVENESS"), { x: leftX, y, size: 7.5, font: bold, color: C.primary });
      y -= 14;

      // Tier spectrum — full tier names, no abbreviation
      const tiers = ["Generic", "Descriptive", "Suggestive", "Arbitrary", "Fanciful"];
      const tiersEs = ["Generica", "Descriptiva", "Sugestiva", "Arbitraria", "De Fantasia"];
      const tierColors = [C.critical, C.warning, rgb(0.8, 0.65, 0.1), C.success, C.primary];
      const tierW = (colW2 - 2) / tiers.length;
      const activeTier = dist?.tier ?? "suggestive";
      const activeIdx = tiers.findIndex(t => t.toLowerCase() === activeTier.toLowerCase());

      for (let ti = 0; ti < tiers.length; ti++) {
        const isActive = ti === activeIdx;
        const tx = leftX + ti * tierW;
        p.drawRectangle({ x: tx, y: y - 22, width: tierW - 1, height: 22, color: isActive ? tierColors[ti] : C.border });
        const tierName = useEnglish ? tiers[ti] : tiersEs[ti];
        // Full tier name — wrap inside cell
        const tierNameLines = wrapText(tierName, isActive ? bold : regular, 6.5, tierW - 4);
        let tny = y - 10;
        for (const tnl of tierNameLines.slice(0, 2)) {
          const tnW = (isActive ? bold : regular).widthOfTextAtSize(tnl, 6.5);
          p.drawText(tnl, { x: tx + (tierW - tnW) / 2, y: tny, size: 6.5, font: isActive ? bold : regular, color: isActive ? C.white : C.textMuted });
          tny -= 8;
        }
      }
      y -= 28;

      if (dist) {
        const rawScore2 = dist.score <= 5 ? dist.score * 20 : dist.score;
        const badgeLabel = `${tierLabel(dist.tier)} — ${rawScore2}/100`;
        const bdW = bold.widthOfTextAtSize(badgeLabel, 9) + 16;
        p.drawRectangle({ x: leftX, y: y - 18, width: bdW, height: 20, color: activeIdx >= 0 ? tierColors[Math.min(activeIdx, tierColors.length - 1)] : C.textMuted });
        p.drawText(badgeLabel, { x: leftX + 8, y: y - 10, size: 9, font: bold, color: C.white });
        y -= 26;

        const explainText = useEnglish ? (dist.explanation_en ?? dist.explanation) : dist.explanation;
        const expLines = wrapText(explainText, regular, 8, colW2);
        for (const line of expLines.slice(0, 6)) {
          p.drawText(line, { x: leftX, y, size: 8, font: regular, color: C.textPrimary });
          y -= 12;
        }
        y -= 8;

        // Strength meter
        p.drawText(T("Distinctiveness Strength (LFPPI Art. 173)", "Fortaleza de Distintividad (LFPPI Art. 173)"), { x: leftX, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 14;
        p.drawRectangle({ x: leftX, y: y - 10, width: colW2, height: 10, color: C.border });
        const meterW = (colW2 * rawScore2) / 100;
        const mColor = rawScore2 >= 60 ? C.success : rawScore2 >= 40 ? C.warning : C.critical;
        p.drawRectangle({ x: leftX, y: y - 10, width: meterW, height: 10, color: mColor });
        const mLabel = `${rawScore2}/100`;
        p.drawText(mLabel, { x: leftX + colW2 + 4, y: y - 9, size: 8, font: bold, color: mColor });
        y -= 24;
      }

      // Translation analysis — stacked cards (no narrow columns)
      let ry = PAGE_H - 34 - 30;
      p.drawText(T("TRANSLATION ANALYSIS", "ANALISIS DE TRADUCCION"), { x: rightX, y: ry, size: 7.5, font: bold, color: C.primary });
      ry -= 14;

      const translationFlags = result.translationAnalysis ?? [];
      if (translationFlags.length === 0) {
        drawCard(p, rightX, ry, colW2, 44, C.successTint);
        p.drawRectangle({ x: rightX, y: ry - 44, width: 3, height: 44, color: C.success });
        p.drawText(T("No conflicting meanings detected", "Sin significados conflictivos detectados"), { x: rightX + 12, y: ry - 22, size: 8.5, font: bold, color: C.success });
        ry -= 54;
      } else {
        for (let i = 0; i < translationFlags.length && ry > MARGIN_BOT; i++) {
          const tf = translationFlags[i];
          const riskC = tf.risk === "high" ? C.critical : tf.risk === "medium" ? C.warning : tf.risk === "low" ? C.primary : C.success;
          const riskTintC = tf.risk === "high" ? C.criticalTint : tf.risk === "medium" ? C.warningTint : tf.risk === "low" ? C.primaryTint : C.successTint;
          const detailText = useEnglish ? (tf.details_en || tf.details) : tf.details;
          // Stacked card: language header + form + full detail text
          const detailLines = wrapText(detailText, regular, 7.5, colW2 - 24);
          const formLines = wrapText(safeText(tf.translatedForm), bold, 8, colW2 - 24);
          const cardH2 = 14 + formLines.length * 11 + detailLines.length * 11 + 20;
          drawCard(p, rightX, ry, colW2, cardH2, riskTintC);
          p.drawRectangle({ x: rightX, y: ry - cardH2, width: 3, height: cardH2, color: riskC });

          // Language name + risk pill on same row
          p.drawText(safeText(tf.languageName).toUpperCase(), { x: rightX + 10, y: ry - 12, size: 8, font: bold, color: C.textPrimary });
          const riskStr = tf.risk.toUpperCase();
          const riskPillW = bold.widthOfTextAtSize(riskStr, 7) + 12;
          p.drawRectangle({ x: rightX + colW2 - riskPillW - 8, y: ry - 22, width: riskPillW, height: 14, color: riskC });
          p.drawText(riskStr, { x: rightX + colW2 - riskPillW - 2, y: ry - 15, size: 7, font: bold, color: C.white });

          // Translated form
          let rfY = ry - 26;
          for (const fl of formLines.slice(0, 2)) {
            p.drawText(fl, { x: rightX + 10, y: rfY, size: 8, font: bold, color: riskC });
            rfY -= 11;
          }

          // Full detail text — no truncation
          for (const dl of detailLines) {
            if (rfY < MARGIN_BOT + 8) break;
            p.drawText(dl, { x: rightX + 10, y: rfY, size: 7.5, font: regular, color: C.textSecond });
            rfY -= 11;
          }

          ry -= cardH2 + 6;
        }
      }
    }

    // ── DOMAIN & WEB PRESENCE ─────────────────────────────────────────
    {
      const p = newPage(T("Domain & Web Presence", "Dominio y Presencia Web"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Domain & Web Presence", "Dominio y Presencia Web"));

      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("DOMAIN AVAILABILITY & WEB PRESENCE", "DISPONIBILIDAD DE DOMINIO Y PRESENCIA WEB"),
        T("Digital brand footprint assessment", "Evaluacion de huella digital de la marca"),
        y,
      );
      y -= 8;

      const colW3 = (CONTENT_W - 16) / 2;
      const leftX2 = MARGIN_X;
      const rightX2 = MARGIN_X + colW3 + 16;
      const domains = result.domainResults ?? [];

      p.drawText(T("DOMAIN AVAILABILITY", "DISPONIBILIDAD DE DOMINIO"), { x: leftX2, y, size: 7.5, font: bold, color: C.primary });
      y -= 12;

      for (const d of domains) {
        if (y < MARGIN_BOT + 20) break;
        const avail = d.status === "available";
        const pillColor = avail ? C.success : C.critical;
        const symbol = avail ? "+" : "x";
        const text = `${symbol}  ${safeText(d.domain)}`;
        const pillLines = wrapText(text, avail ? bold : regular, 8.5, colW3 - 20);
        const pillH = Math.max(20, pillLines.length * 12 + 8);
        p.drawRectangle({ x: leftX2, y: y - pillH, width: colW3, height: pillH, color: avail ? C.successTint : C.criticalTint, borderColor: pillColor, borderWidth: 0.8 });
        let plY = y - 10;
        for (const pl of pillLines.slice(0, 2)) {
          p.drawText(pl, { x: leftX2 + 10, y: plY, size: 8.5, font: avail ? bold : regular, color: pillColor });
          plY -= 12;
        }
        const statusStr = avail ? T("Available", "Disponible") : T("Registered", "Registrado");
        const stW = regular.widthOfTextAtSize(statusStr, 7.5);
        p.drawText(statusStr, { x: leftX2 + colW3 - stW - 8, y: y - 10, size: 7.5, font: regular, color: pillColor });
        y -= pillH + 4;
      }

      if (domains.length === 0) {
        p.drawText(T("Domain availability not checked.", "Disponibilidad de dominio no verificada."), { x: leftX2, y, size: 8, font: italic, color: C.textMuted });
        y -= 16;
      }

      // Web findings
      let ry3 = PAGE_H - 34 - 30;
      p.drawText(T("WEB PRESENCE", "PRESENCIA WEB"), { x: rightX2, y: ry3, size: 7.5, font: bold, color: C.primary });
      ry3 -= 14;
      const webFindings = result.webFindings ?? [];
      if (webFindings.length === 0) {
        drawCard(p, rightX2, ry3, colW3, 44, C.successTint);
        p.drawRectangle({ x: rightX2, y: ry3 - 44, width: 3, height: 44, color: C.success });
        p.drawText(T("No significant web presence conflicts detected", "Sin conflictos significativos de presencia web"), { x: rightX2 + 12, y: ry3 - 22, size: 8, font: bold, color: C.success });
        ry3 -= 54;
      } else {
        for (let i = 0; i < Math.min(webFindings.length, 8) && ry3 > MARGIN_BOT; i++) {
          const finding = webFindings[i];
          const fLines = wrapText(finding, regular, 7.5, colW3 - 20);
          const fH = fLines.length * 12 + 14;
          drawCard(p, rightX2, ry3, colW3, fH);
          let fy = ry3 - 12;
          for (const fl of fLines) {
            if (fy < MARGIN_BOT + 4) break;
            p.drawText(fl, { x: rightX2 + 10, y: fy, size: 7.5, font: regular, color: C.textPrimary });
            fy -= 12;
          }
          ry3 -= fH + 6;
        }
      }
    }

    // ── STRATEGY RECOMMENDATIONS — exactly 5 paths ────────────────────
    {
      const p = newPage(T("Strategy Recommendations", "Recomendaciones Estrategicas"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Strategy Recommendations", "Recomendaciones Estrategicas"));

      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("STRATEGY RECOMMENDATIONS — 5 PATHS", "RECOMENDACIONES ESTRATEGICAS — 5 CAMINOS"),
        T("All paths numbered 1-5. Recommended path marked.", "Todos los caminos numerados 1-5. Camino recomendado marcado."),
        y,
      );
      y -= 8;

      const strategies = buildStrategies(result, markName, useEnglish);

      for (const strat of strategies) {
        if (y < MARGIN_BOT + 80) break;
        const descLines = wrapText(strat.desc, regular, 8, CONTENT_W - 52);
        const cardH = 32 + descLines.length * 12 + 24;
        drawCard(p, MARGIN_X, y, CONTENT_W, cardH);

        // Number badge
        const numStr = `${strat.num}`;
        p.drawRectangle({ x: MARGIN_X + 6, y: y - 28, width: 22, height: 22, color: strat.recommended ? vc : C.border });
        const nw = bold.widthOfTextAtSize(numStr, 10);
        p.drawText(numStr, { x: MARGIN_X + 6 + (22 - nw) / 2, y: y - 20, size: 10, font: bold, color: strat.recommended ? C.white : C.textMuted });

        // Title — full text, wrapped
        const titleLines = wrapText(strat.title, bold, 9.5, CONTENT_W - 90);
        let tly = y - 15;
        for (const tl of titleLines.slice(0, 2)) {
          p.drawText(tl, { x: MARGIN_X + 36, y: tly, size: 9.5, font: bold, color: C.textPrimary });
          tly -= 12;
        }
        if (strat.recommended) {
          const recStr = T("RECOMMENDED", "RECOMENDADO");
          const recW = bold.widthOfTextAtSize(recStr, 7) + 12;
          p.drawRectangle({ x: MARGIN_X + CONTENT_W - recW - 6, y: y - 22, width: recW, height: 16, color: vc });
          p.drawText(recStr, { x: MARGIN_X + CONTENT_W - recW, y: y - 15, size: 7, font: bold, color: C.white });
        }

        // Viability bar
        p.drawText(T("Viability:", "Viabilidad:"), { x: MARGIN_X + 36, y: y - 30, size: 7.5, font: bold, color: C.textMuted });
        const barMaxW = 100;
        p.drawRectangle({ x: MARGIN_X + 86, y: y - 35, width: barMaxW, height: 7, color: C.border });
        const vBarColor = strat.viability >= 7 ? C.success : strat.viability >= 5 ? C.warning : C.critical;
        p.drawRectangle({ x: MARGIN_X + 86, y: y - 35, width: barMaxW * strat.viability / 10, height: 7, color: vBarColor });
        p.drawText(`${strat.viability}/10`, { x: MARGIN_X + 192, y: y - 34, size: 7.5, font: bold, color: vBarColor });

        // Meta info
        const meta = `${T("Timeline:", "Plazo:")} ${strat.timeline}  ·  ${T("MTC fee:", "Tarifa MTC:")} ${strat.fee}`;
        const metaW = regular.widthOfTextAtSize(meta, 7.5);
        p.drawText(meta, { x: MARGIN_X + CONTENT_W - metaW - 8, y: y - 34, size: 7.5, font: regular, color: C.textMuted });

        // Description — full text, no truncation
        let dy2 = y - 46;
        for (const dl of descLines) {
          if (dy2 < MARGIN_BOT + 8) break;
          p.drawText(dl, { x: MARGIN_X + 36, y: dy2, size: 8, font: regular, color: C.textPrimary });
          dy2 -= 12;
        }

        y -= cardH + 8;
      }

      // Filing cost breakdown — USD $299 all-in
      if (y > MARGIN_BOT + 80) {
        y -= 4;
        const costH = 88;
        drawCard(p, MARGIN_X, y, CONTENT_W, costH);
        p.drawRectangle({ x: MARGIN_X, y: y - costH, width: 4, height: costH, color: C.primary });
        p.drawText(T("FILING COST BREAKDOWN — USD $299 ALL-IN", "DESGLOSE DE COSTOS — USD $299 TODO INCLUIDO"), { x: MARGIN_X + 14, y: y - 16, size: 9.5, font: bold, color: C.textPrimary });
        p.drawRectangle({ x: MARGIN_X + 14, y: y - 22, width: CONTENT_W - 28, height: 0.5, color: C.border });
        const costItems = [
          T("IMPI government filing fee (paid directly to IMPI on your behalf):  USD $170", "Cuota oficial IMPI (pagada directamente al IMPI en tu nombre):  USD $170"),
          T("MTC professional service fee (preparation, filing, prosecution, reporting):  USD $129", "Tarifa profesional MTC (preparacion, presentacion, gestion, reportes):  USD $129"),
          T("Total all-in:  USD $299", "Total todo incluido:  USD $299"),
          T("Money-back: If IMPI raises a substantive objection on first office action, the $129 MTC fee is refunded.", "Garantia: Si el IMPI emite una prevencion sustantiva en el primer oficio, se reembolsa la tarifa MTC de $129."),
        ];
        let cy3 = y - 34;
        for (const ci of costItems) {
          if (cy3 < MARGIN_BOT + 8) break;
          const isTotal = ci.includes("$299");
          const ciLines = wrapText(ci, isTotal ? bold : regular, 8, CONTENT_W - 28);
          for (const cl of ciLines.slice(0, 2)) {
            p.drawText(cl, { x: MARGIN_X + 14, y: cy3, size: 8, font: isTotal ? bold : regular, color: isTotal ? C.primary : C.textPrimary });
            cy3 -= 12;
          }
        }
      }
    }

    // ── NICE CLASSIFICATION ────────────────────────────────────────────
    if (niceClasses.length > 0) {
      let p = newPage(T("Nice Classification", "Clasificacion Niza"));
      addPageHeader(p, regular, bold, markName, niceClasses, T("Nice Classification", "Clasificacion Niza"));
      let y = PAGE_H - 34;
      y = addSectionHeader(p, bold,
        T("NICE CLASSIFICATION", "CLASIFICACION NIZA"),
        T("International trademark classification", "Clasificacion internacional de marcas"),
        y,
      );
      y -= 10;

      for (const nc of niceClasses) {
        if (y < MARGIN_BOT + 60) {
          p = newPage(T("Nice Classification (cont.)", "Clasificacion Niza (cont.)"));
          addPageHeader(p, regular, bold, markName, niceClasses, T("Nice Classification", "Clasificacion Niza"));
          y = PAGE_H - 44;
        }
        const className = useEnglish ? (nc.className_en || nc.className) : nc.className;
        const officialHeading = useEnglish ? (nc.officialHeading_en || nc.officialHeading) : nc.officialHeading;
        const items = useEnglish ? (nc.relevantItems_en?.length ? nc.relevantItems_en : nc.relevantItems) : nc.relevantItems;

        // Class badge — outlined
        p.drawRectangle({ x: MARGIN_X, y: y - 34, width: 44, height: 36, color: C.white, borderColor: C.primary, borderWidth: 1.5 });
        const cnStr = String(nc.classNumber);
        const cnW = bold.widthOfTextAtSize(cnStr, 16);
        p.drawText(cnStr, { x: MARGIN_X + (44 - cnW) / 2, y: y - 22, size: 16, font: bold, color: C.primary });
        p.drawText(safeText(className), { x: MARGIN_X + 52, y: y - 12, size: 10.5, font: bold, color: C.primary });
        const ohLines = wrapText(safeText(officialHeading), regular, 7.5, CONTENT_W - 52);
        let ohY = y - 26;
        for (const ohl of ohLines.slice(0, 2)) {
          p.drawText(ohl, { x: MARGIN_X + 52, y: ohY, size: 7.5, font: regular, color: C.textSecond });
          ohY -= 11;
        }
        y -= 42;
        p.drawRectangle({ x: MARGIN_X + 52, y, width: CONTENT_W - 52, height: 0.8, color: C.primary });
        y -= 12;

        for (const item of items.slice(0, 12)) {
          if (y < MARGIN_BOT) break;
          p.drawRectangle({ x: MARGIN_X + 4, y: y - 4, width: 5, height: 5, color: C.primary });
          y = drawWrappedText(p, safeText(item), MARGIN_X + 16, y, regular, 8.5, CONTENT_W - 16, C.textPrimary, 13);
          y -= 2;
        }
        y -= 16;
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════
  if (isBilingual) {
    renderAllSections(searchLang, false);

    // Language divider page — pure white, no sidebar
    const dp = newPage("Language Divider");
    dp.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.white });
    dp.drawRectangle({ x: MARGIN_X, y: PAGE_H / 2 + 24, width: CONTENT_W, height: 1, color: C.border });
    dp.drawRectangle({ x: MARGIN_X, y: PAGE_H / 2 - 28, width: CONTENT_W, height: 1, color: C.border });
    const divLabel = "ENGLISH VERSION";
    const divW = bold.widthOfTextAtSize(divLabel, 22);
    dp.drawText(divLabel, { x: (PAGE_W - divW) / 2, y: PAGE_H / 2 + 4, size: 22, font: bold, color: C.textPrimary });
    const subLabel = "MexicoTrademarkCenter.com";
    const subW = regular.widthOfTextAtSize(subLabel, 10);
    dp.drawText(subLabel, { x: (PAGE_W - subW) / 2, y: PAGE_H / 2 - 22, size: 10, font: regular, color: C.textMuted });

    renderAllSections("en", true);
  } else {
    renderAllSections("en", true);
  }

  // ══════════════════════════════════════════════════════════════════════
  // FINAL PAGE — DISCLAIMER
  // ══════════════════════════════════════════════════════════════════════
  {
    const p = newPage("Disclaimer");
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.white });

    const dX = MARGIN_X;
    const dW = CONTENT_W;

    p.drawText("MEXICO TRADEMARK CENTER", { x: dX, y: PAGE_H - 52, size: 13, font: bold, color: C.primary });
    p.drawText("MexicoTrademarkCenter.com", { x: dX, y: PAGE_H - 66, size: 9, font: regular, color: C.textMuted });
    p.drawRectangle({ x: dX, y: PAGE_H - 74, width: dW, height: 0.8, color: C.border });

    const cardY = PAGE_H - 90;
    const cardH = 480;
    p.drawRectangle({ x: dX, y: cardY - cardH, width: dW, height: cardH, color: C.white, borderColor: C.border, borderWidth: 0.8 });
    p.drawRectangle({ x: dX, y: cardY - cardH, width: 3, height: cardH, color: C.primary });

    const disclaimerEN = [
      "This Trademark Clearance Report was generated by MexicoTrademarkCenter.com using AI-powered",
      "analysis against the official IMPI MARCia trademark registry database.",
      "",
      "This report is an automated preliminary screening only. It does not constitute legal advice,",
      "a formal clearance opinion, or an attorney-client relationship.",
      "MexicoTrademarkCenter.com is not a law firm.",
      "",
      "Results are based on data available at the time of generation and may not reflect the most",
      "current registry status. Always consult a qualified trademark attorney in Mexico before",
      "making any filing decisions.",
    ];

    const disclaimerES = [
      "Este Informe de Disponibilidad de Marca fue generado por MexicoTrademarkCenter.com mediante",
      "analisis automatizado contra la base de datos oficial IMPI MARCia.",
      "",
      "Este informe es unicamente una revision preliminar automatizada. No constituye asesoria legal,",
      "una opinion formal de disponibilidad, ni establece una relacion abogado-cliente.",
      "MexicoTrademarkCenter.com no es un despacho juridico.",
      "",
      "Los resultados se basan en datos disponibles al momento de la generacion y pueden no reflejar",
      "el estado mas reciente del registro. Siempre consulte a un abogado especialista en marcas en",
      "Mexico antes de tomar decisiones de registro.",
    ];

    let dy = cardY - 18;
    p.drawText("DISCLAIMER", { x: dX + 16, y: dy, size: 9, font: bold, color: C.primary });
    dy -= 6;
    p.drawRectangle({ x: dX + 16, y: dy, width: dW - 32, height: 0.8, color: C.border });
    dy -= 14;
    for (const line of disclaimerEN) {
      if (!line) { dy -= 8; continue; }
      p.drawText(line, { x: dX + 16, y: dy, size: 8.5, font: regular, color: C.textPrimary });
      dy -= 13;
    }
    dy -= 8;
    p.drawRectangle({ x: dX + 16, y: dy, width: dW - 32, height: 0.8, color: C.border });
    dy -= 14;
    p.drawText("AVISO LEGAL", { x: dX + 16, y: dy, size: 9, font: bold, color: C.primary });
    dy -= 14;
    for (const line of disclaimerES) {
      if (!line) { dy -= 8; continue; }
      p.drawText(line, { x: dX + 16, y: dy, size: 8.5, font: italic, color: C.textSecond });
      dy -= 13;
    }

    const metaStr = `Report generated: ${timestamp}${purchaserEmail ? ` | Prepared for: ${purchaserEmail}` : ""}`;
    p.drawText(safeText(metaStr).slice(0, 90), { x: dX, y: 52, size: 7.5, font: regular, color: C.textMuted });
    p.drawText("MexicoTrademarkCenter.com  |  Independent Trademark Filing Services for Mexico", { x: dX, y: 38, size: 7.5, font: bold, color: C.primary });
  }

  // Apply running footers to all body pages (skip cover + disclaimer + divider)
  const totalPages = pages.length;
  for (let i = 0; i < pages.length; i++) {
    const sn = sectionNames[i];
    if (i === 0 || sn === "Disclaimer" || sn === "Language Divider") continue;
    addRunningFooter(pages[i], regular, markName, i + 1, totalPages, shortId);
  }

  pdfDoc.setTitle(`TrademarkClearance-${safeMarkName}-Class${classNum}-${dateStr}`);
  pdfDoc.setAuthor("MexicoTrademarkCenter.com");
  pdfDoc.setSubject("Trademark Clearance Report");
  pdfDoc.setCreator("MexicoTrademarkCenter AI Analysis System");

  return pdfDoc.save();
}

// ─── Helper used in cover tiles ───────────────────────────────────────────────
function marciaFindings_count(result: ClearanceResult): number {
  const findings = result.marciaFindings ?? [];
  return findings.filter(f => isHighSimilarity(f, result.riskSummary ?? "") || (f.similarityScore !== undefined && f.similarityScore >= 80)).length;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reportOrderId } = await req.json() as { reportOrderId: string };
    if (!reportOrderId) {
      return new Response(JSON.stringify({ error: "reportOrderId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: order } = await supabase
      .from("clearance_report_orders")
      .select("*")
      .eq("id", reportOrderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pdfBytes = await buildPdf(
      order.mark_name,
      order.goods_services,
      order.id,
      order.clearance_result as ClearanceResult,
      openAiKey ?? undefined,
      order.email ?? undefined,
    );

    await supabase.storage.createBucket("clearance-reports", { public: false }).catch(() => {});

    const safeMark = safeText(order.mark_name).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
    const result = order.clearance_result as ClearanceResult;
    const classes = result?.niceClassification ?? [];
    const classNum2 = classes.length > 0 ? String(classes[0].classNumber) : "X";
    const dateStr2 = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `TrademarkClearance-${safeMark}-Class${classNum2}-${dateStr2}.pdf`;
    const storagePath = `${reportOrderId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("clearance-reports")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      const fallbackPath = `${reportOrderId}.pdf`;
      await supabase.storage.from("clearance-reports").upload(fallbackPath, pdfBytes, { contentType: "application/pdf", upsert: true });
      await supabase.from("clearance_report_orders").update({ pdf_storage_path: fallbackPath }).eq("id", reportOrderId);
    } else {
      await supabase.from("clearance_report_orders").update({ pdf_storage_path: storagePath }).eq("id", reportOrderId);
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-clearance-report-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ reportOrderId }),
      });
    } catch (e) {
      console.error("Email send error:", e);
    }

    return new Response(JSON.stringify({ success: true, storagePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-clearance-pdf error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
