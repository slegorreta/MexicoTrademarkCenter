import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Design System Colors ─────────────────────────────────────────────────────
const C = {
  // Brand
  deepGreen:   rgb(0.051, 0.169, 0.122),  // #0D2B1F — cover, headers
  midGreen:    rgb(0.102, 0.290, 0.196),  // #1A4A32 — section backgrounds
  gold:        rgb(0.788, 0.659, 0.298),  // #C9A84C — accents
  // Semantic
  accentRed:   rgb(0.753, 0.224, 0.169),  // #C0392B
  accentOrange:rgb(0.902, 0.494, 0.133),  // #E67E22
  accentGreen: rgb(0.153, 0.682, 0.376),  // #27AE60
  // Surfaces
  offWhite:    rgb(0.973, 0.965, 0.945),  // #F8F6F1
  cardWhite:   rgb(1, 1, 1),
  border:      rgb(0.878, 0.867, 0.843),  // #E0DDD7
  // Text
  textPrimary: rgb(0.102, 0.102, 0.102),  // #1A1A1A
  textSecond:  rgb(0.333, 0.333, 0.333),  // #555555
  textMuted:   rgb(0.533, 0.533, 0.533),  // #888888
  white:       rgb(1, 1, 1),
  black:       rgb(0, 0, 0),
};

// A4 dimensions in points (595.28 × 841.89)
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 51;   // ~18mm
const MARGIN_TOP = 85; // ~15mm header + 15mm top = leaves room for running header
const MARGIN_BOT = 60;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// ─── Types ───────────────────────────────────────────────────────────────────
interface DupontFactor {
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
  dupont?: DupontFactor[];
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
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word.slice(0, 60); // hard truncate runaway words
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

function riskColor(risk: "low" | "medium" | "high") {
  return risk === "high" ? C.accentRed : risk === "medium" ? C.accentOrange : C.accentGreen;
}

function riskTintColor(risk: "low" | "medium" | "high") {
  return risk === "high"
    ? rgb(0.992, 0.941, 0.933)  // #FDF0EE
    : risk === "medium"
    ? rgb(0.996, 0.953, 0.918)  // #FEF3EA
    : rgb(0.918, 0.976, 0.937); // #EBFAEF
}

function riskLabel(risk: "low" | "medium" | "high", lang: Lang): string {
  const map: Record<string, Record<Lang, string>> = {
    high: { en: "HIGH RISK", es: "RIESGO ALTO", zh: "High Risk", de: "HOHES RISIKO", fr: "RISQUE ELEVE", hi: "HIGH RISK", pt: "ALTO RISCO", ja: "HIGH RISK" },
    medium: { en: "MEDIUM RISK", es: "RIESGO MEDIO", zh: "Medium Risk", de: "MITTLERES RISIKO", fr: "RISQUE MODERE", hi: "MEDIUM RISK", pt: "RISCO MEDIO", ja: "MEDIUM RISK" },
    low: { en: "LOW RISK", es: "RIESGO BAJO", zh: "Low Risk", de: "NIEDRIGES RISIKO", fr: "RISQUE FAIBLE", hi: "LOW RISK", pt: "BAIXO RISCO", ja: "LOW RISK" },
  };
  return map[risk][lang];
}

function riskVerdict(risk: "low" | "medium" | "high"): { en: string; es: string } {
  if (risk === "high") return {
    en: "HIGH RISK — Registration Not Recommended Without Modifications",
    es: "RIESGO ALTO — No Se Recomienda Registro Sin Modificaciones",
  };
  if (risk === "medium") return {
    en: "MEDIUM RISK — Registration Possible With Strategy",
    es: "RIESGO MEDIO — Registro Posible Con Estrategia Adecuada",
  };
  return {
    en: "LOW RISK — Favorable Outlook for Registration",
    es: "RIESGO BAJO — Perspectiva Favorable Para el Registro",
  };
}

// Compute a 0-100 score from result data
function computeScore(result: ClearanceResult): number {
  let score = 80;
  if (result.risk === "high") score = Math.min(score, 40);
  else if (result.risk === "medium") score = Math.min(score, 65);
  const against = (result.dupont ?? []).filter(f => f.verdict === "against_registration").length;
  score -= against * 3;
  const highFlags = (result.registrabilityFlags ?? []).filter(f => f.severity === "high").length;
  score -= highFlags * 8;
  const medFlags = (result.registrabilityFlags ?? []).filter(f => f.severity === "medium").length;
  score -= medFlags * 4;
  const marciaCount = result.marciaTotalCount ?? result.marciaFindings?.length ?? 0;
  if (marciaCount > 5) score -= 10;
  else if (marciaCount > 2) score -= 5;
  const dist = result.distinctiveness?.score ?? 3;
  score += (dist - 3) * 4;
  return Math.max(5, Math.min(95, Math.round(score)));
}

// Compute 5-axis pentagon scores (0-100 each)
function computePentagonScores(result: ClearanceResult): Array<{ label: string; score: number }> {
  const dist = result.distinctiveness;
  const distScore = dist ? Math.round((dist.score / 5) * 100) : 50;

  const dupont = result.dupont ?? [];
  const favor = dupont.filter(f => f.verdict === "favors_registration").length;
  const against = dupont.filter(f => f.verdict === "against_registration").length;
  const dupontScore = dupont.length > 0 ? Math.round(((favor - against * 1.5) / dupont.length + 1) * 50) : 50;

  const flags = result.registrabilityFlags ?? [];
  const highFlags = flags.filter(f => f.severity === "high").length;
  const medFlags = flags.filter(f => f.severity === "medium").length;
  const lfppiScore = Math.max(10, 100 - highFlags * 25 - medFlags * 12);

  const total = result.marciaTotalCount ?? result.marciaFindings?.length ?? 0;
  const marciaScore = Math.max(10, 100 - Math.min(total, 10) * 8);

  const conflictFlags = (result.translationAnalysis ?? []).filter(f => f.risk !== "none").length;
  const transScore = Math.max(20, 100 - conflictFlags * 20);

  return [
    { label: "Distinctiveness", score: Math.max(5, Math.min(95, distScore)) },
    { label: "DuPont Factors", score: Math.max(5, Math.min(95, dupontScore)) },
    { label: "LFPPI Grounds", score: Math.max(5, Math.min(95, lfppiScore)) },
    { label: "MARCia Registry", score: Math.max(5, Math.min(95, marciaScore)) },
    { label: "Trans. Analysis", score: Math.max(5, Math.min(95, transScore)) },
  ];
}

// Draw a simple circular progress arc using thin rectangles arranged around a center
function drawArc(
  page: PDFPage, cx: number, cy: number, r: number, strokeW: number,
  progress: number, // 0-1
  color: ReturnType<typeof rgb>,
) {
  const steps = 72;
  const filled = Math.round(steps * progress);
  for (let i = 0; i < filled; i++) {
    const angle = (i / steps) * 2 * Math.PI - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    page.drawRectangle({ x: x - strokeW / 2, y: y - strokeW / 2, width: strokeW, height: strokeW, color });
  }
}

// Draw pentagon chart
function drawPentagon(page: PDFPage, cx: number, cy: number, size: number, scores: Array<{ label: string; score: number }>, font: PDFFont, bold: PDFFont, rc: ReturnType<typeof rgb>) {
  const n = 5;
  const maxR = size * 0.38;

  // Draw grid rings
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

  // Draw axis lines
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + Math.cos(angle) * maxR, y: cy + Math.sin(angle) * maxR }, thickness: 0.4, color: C.border });
  }

  // Draw filled polygon (score areas)
  const scorePts: Array<[number, number]> = scores.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r = (s.score / 100) * maxR;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });
  // Fill with triangles from center
  const fillColor = rgb(rc.red * 0.4 + 0.6, rc.green * 0.4 + 0.6, rc.blue * 0.4 + 0.6);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    // Draw thin filled triangle approximation using a line sweep
    page.drawLine({ start: { x: scorePts[i][0], y: scorePts[i][1] }, end: { x: scorePts[next][0], y: scorePts[next][1] }, thickness: 1.5, color: fillColor });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: scorePts[i][0], y: scorePts[i][1] }, thickness: 0.8, color: rc });
  }

  // Vertex dots + labels
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const ax = cx + Math.cos(angle) * (maxR + 10);
    const ay = cy + Math.sin(angle) * (maxR + 10);
    const s = scores[i];

    // Score dot on axis
    const dx = cx + Math.cos(angle) * (s.score / 100) * maxR;
    const dy = cy + Math.sin(angle) * (s.score / 100) * maxR;
    page.drawCircle({ x: dx, y: dy, size: 3, color: rc });

    // Axis label
    const labelW = font.widthOfTextAtSize(safeText(s.label), 6.5);
    page.drawText(safeText(s.label), { x: ax - labelW / 2, y: ay - 3, size: 6.5, font, color: C.textSecond });

    // Score number
    const scoreStr = String(s.score);
    const scoreW = bold.widthOfTextAtSize(scoreStr, 7);
    page.drawText(scoreStr, { x: ax - scoreW / 2, y: ay - 12, size: 7, font: bold, color: C.textPrimary });
  }
}

// ─── Page Scaffolding ─────────────────────────────────────────────────────────

function addRunningHeader(page: PDFPage, regular: PDFFont, bold: PDFFont, markName: string, niceClasses: NiceClass[]) {
  const classStr = niceClasses.length > 0 ? `Cl. ${niceClasses.map(c => c.classNumber).join(", ")}` : "";
  const center = safeText(markName).slice(0, 30) + (classStr ? ` — ${classStr}` : "");
  const centerW = bold.widthOfTextAtSize(center, 8);
  const siteStr = "MexicoTrademarkCenter.com";
  const confStr = "CONFIDENTIAL";

  // Background strip
  page.drawRectangle({ x: 0, y: PAGE_H - 26, width: PAGE_W, height: 26, color: C.offWhite });
  // Gold bottom border
  page.drawRectangle({ x: 0, y: PAGE_H - 27, width: PAGE_W, height: 1, color: C.gold });

  page.drawText(siteStr, { x: MARGIN_X, y: PAGE_H - 18, size: 7, font: regular, color: C.textMuted });
  page.drawText(center, { x: (PAGE_W - centerW) / 2, y: PAGE_H - 18, size: 8, font: bold, color: C.textPrimary });
  const confW = bold.widthOfTextAtSize(confStr, 7);
  page.drawText(confStr, { x: PAGE_W - MARGIN_X - confW, y: PAGE_H - 18, size: 7, font: bold, color: C.gold });
}

function addRunningFooter(page: PDFPage, regular: PDFFont, markName: string, sectionName: string, pageNum: number, totalPages: number) {
  const left = `Trademark Clearance Report — ${safeText(markName).slice(0, 25)}`;
  const right = `Page ${pageNum} of ${totalPages}`;
  const rightW = regular.widthOfTextAtSize(right, 7);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 22, color: C.offWhite });
  page.drawRectangle({ x: 0, y: 22, width: PAGE_W, height: 0.5, color: C.border });

  page.drawText(left, { x: MARGIN_X, y: 8, size: 7, font: regular, color: C.textMuted });
  const centerStr = safeText(sectionName).slice(0, 40);
  const centerW = regular.widthOfTextAtSize(centerStr, 7);
  page.drawText(centerStr, { x: (PAGE_W - centerW) / 2, y: 8, size: 7, font: regular, color: C.textMuted });
  page.drawText(right, { x: PAGE_W - MARGIN_X - rightW, y: 8, size: 7, font: regular, color: C.textMuted });
}

function drawPageBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.offWhite });
}

function addSectionHeader(page: PDFPage, bold: PDFFont, title: string, subtitle: string, y: number): number {
  const H = 28;
  // Full-width dark green bar
  page.drawRectangle({ x: 0, y: y - H, width: PAGE_W, height: H, color: C.deepGreen });
  // 4px gold left accent stripe
  page.drawRectangle({ x: 0, y: y - H, width: 4, height: H, color: C.gold });
  page.drawText(safeText(title).toUpperCase(), { x: MARGIN_X + 6, y: y - 12, size: 9, font: bold, color: C.white });
  if (subtitle) {
    page.drawText(safeText(subtitle).slice(0, 80), { x: MARGIN_X + 6, y: y - 22, size: 7.5, font: bold, color: rgb(0.7, 0.8, 0.7) });
  }
  return y - H - 8;
}

function drawCard(page: PDFPage, x: number, y: number, w: number, h: number, bg = C.cardWhite) {
  page.drawRectangle({ x, y: y - h, width: w, height: h, color: C.border });
  page.drawRectangle({ x: x + 0.5, y: y - h + 0.5, width: w - 1, height: h - 1, color: bg });
}

function drawStatusBadge(page: PDFPage, bold: PDFFont, status: string, x: number, y: number) {
  const isReg = /registrad|vigente|registered|active/i.test(status);
  const isPend = /tr[aá]mite|pendiente|solicitud|pending|filed/i.test(status);
  const bgColor = isReg ? C.midGreen : isPend ? C.accentOrange : C.textMuted;
  const label = isReg ? "REGISTERED" : isPend ? "PENDING" : "ABANDONED";
  const w = bold.widthOfTextAtSize(label, 7) + 10;
  page.drawRectangle({ x, y: y - 12, width: w, height: 14, color: bgColor });
  page.drawText(label, { x: x + 5, y: y - 7, size: 7, font: bold, color: C.white });
  return w;
}

// ─── Attorney Commentary Generation ──────────────────────────────────────────

async function generateAttorneyCommentary(
  apiKey: string,
  markName: string,
  goodsServices: string,
  result: ClearanceResult,
  language: string,
): Promise<{ native: string; english: string }> {
  const isBilingual = language !== "en";
  const langName = isBilingual ? (
    language === "es" ? "Spanish" : language === "zh" ? "Chinese" :
    language === "de" ? "German" : language === "fr" ? "French" :
    language === "hi" ? "Hindi" : language === "pt" ? "Portuguese" : "Japanese"
  ) : "English";

  const flags = result.registrabilityFlags ?? [];
  const marciaFindings = result.marciaFindings ?? [];
  const topConflicts = marciaFindings.slice(0, 3);
  const conflictList = topConflicts.length > 0
    ? topConflicts.map(f => `"${f.name}" (Exp. ${f.expediente ?? f.classNum}, Class ${f.classNum}${f.similarityScore ? `, ${f.similarityScore}% similar` : ""})`).join("; ")
    : "no direct conflicts found";
  const highFlags = flags.filter(f => f.severity === "high").map(f => f.category).join(", ");
  const niceClasses = (result.niceClassification ?? []).map(nc => `Class ${nc.classNumber} (${nc.className_en || nc.className})`).join(", ");
  const tier = result.distinctiveness?.tier ?? "unknown";
  const dupontAgainst = (result.dupont ?? []).filter(f => f.verdict === "against_registration").length;
  const dupontFavor = (result.dupont ?? []).filter(f => f.verdict === "favors_registration").length;

  const contextSummary = [
    `Mark: "${markName}"`,
    goodsServices ? `Goods/Services: ${goodsServices}` : "",
    niceClasses ? `Nice Classes: ${niceClasses}` : "",
    `Overall Risk: ${result.risk}`,
    `Distinctiveness: ${tier} (score ${result.distinctiveness?.score ?? "N/A"}/5)`,
    `DuPont factors: ${dupontFavor} favoring registration, ${dupontAgainst} against`,
    flags.length > 0 ? `LFPPI grounds flagged: ${flags.length} (high severity: ${highFlags || "none"})` : "LFPPI: No grounds flagged",
    `IMPI MARCia conflicts: ${result.marciaTotalCount ?? marciaFindings.length} marks found`,
    topConflicts.length > 0 ? `Top conflicts: ${conflictList}` : "",
    result.riskSummary_en ? `Risk context: ${result.riskSummary_en.slice(0, 200)}` : "",
  ].filter(Boolean).join("\n");

  const englishPrompt = `You are a senior Mexican intellectual property attorney with 20+ years of experience in trademark prosecution before IMPI.

Based on the following trademark clearance search results, write a professional registrability opinion paragraph of 120-180 words.

SEARCH RESULTS:
${contextSummary}

MANDATORY STRUCTURE (write as a single flowing paragraph — no section headers):
1. State the registrability verdict clearly.
2. Name the 2-3 top conflicting marks specifically by name with expediente numbers if available, identify the dominant element causing conflict, and cite the specific LFPPI article/fraction (e.g., Art. 173 Fr. XVIII LFPPI).
3. Mention the distinctiveness tier and what it means for registration prospects.
4. End with one concrete, actionable recommendation.

Write in professional but accessible language. No markdown. No section labels. Plain prose only.`;

  try {
    let english = "";
    let native = "";

    const engRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Mexican trademark attorney. Write professional legal opinions. No markdown, no bullet points, plain prose." },
          { role: "user", content: englishPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (engRes.ok) {
      const d = await engRes.json();
      english = d.choices?.[0]?.message?.content?.trim() ?? "";
    }

    if (isBilingual && english) {
      const transRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `Translate the following Mexican trademark attorney opinion into ${langName}. Maintain formal legal tone. Preserve all trademark names, LFPPI citations, and expediente numbers exactly. No markdown.` },
            { role: "user", content: english },
          ],
          temperature: 0.1,
          max_tokens: 350,
        }),
      });
      if (transRes.ok) {
        const d = await transRes.json();
        native = d.choices?.[0]?.message?.content?.trim() ?? english;
      } else {
        native = english;
      }
    } else {
      native = english;
    }

    return { native, english };
  } catch {
    return { native: "", english: "" };
  }
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
  const rc = riskColor(result.risk);
  const niceClasses = result.niceClassification ?? [];
  const searchLang = (result.searchLanguage ?? "en") as Lang;
  const isBilingual = searchLang !== "en";
  const score = computeScore(result);
  const pentagonScores = computePentagonScores(result);
  const shortId = orderId.slice(0, 8).toUpperCase();

  // Safe mark name for filename
  const safeMarkName = safeText(markName).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
  const classNum = niceClasses.length > 0 ? String(niceClasses[0].classNumber) : "X";

  // Generate attorney commentary
  let commentary = { native: "", english: "" };
  if (openAiKey) {
    commentary = await generateAttorneyCommentary(openAiKey, markName, goodsServices, result, searchLang);
  }

  const pages: PDFPage[] = [];
  const sectionNames: string[] = [];

  const newPage = (sectionName = "") => {
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(p);
    sectionNames.push(sectionName);
    return p;
  };

  // ════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER PAGE
  // ════════════════════════════════════════════════════════════════════
  {
    const p = newPage("Cover");
    // Full-bleed dark green
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.deepGreen });

    // ── TOP AREA ──
    p.drawText("MEXICO TRADEMARK CENTER", { x: MARGIN_X, y: PAGE_H - 44, size: 11, font: bold, color: C.white });

    const coverRightLabel = "TRADEMARK CLEARANCE REPORT";
    const crW = regular.widthOfTextAtSize(coverRightLabel, 8);
    p.drawText(coverRightLabel, { x: PAGE_W - MARGIN_X - crW, y: PAGE_H - 38, size: 8, font: regular, color: C.gold });
    const coverRightLabel2 = "DICTAMEN DE VIABILIDAD MARCARIA";
    const crW2 = regular.widthOfTextAtSize(coverRightLabel2, 8);
    p.drawText(coverRightLabel2, { x: PAGE_W - MARGIN_X - crW2, y: PAGE_H - 50, size: 8, font: regular, color: rgb(0.7, 0.8, 0.7) });

    // Gold rule at 80%
    const rule1Y = PAGE_H * 0.80;
    p.drawRectangle({ x: MARGIN_X, y: rule1Y, width: CONTENT_W, height: 1.5, color: C.gold });

    // ── CENTER — Mark Name ──
    const mnStr = safeText(markName).toUpperCase().slice(0, 22);
    const mnSize = mnStr.length > 12 ? 36 : 48;
    const mnW = bold.widthOfTextAtSize(mnStr, mnSize);
    p.drawText(mnStr, { x: (PAGE_W - mnW) / 2, y: rule1Y - 50, size: mnSize, font: bold, color: C.white });

    // Class line
    const classLine = niceClasses.length > 0
      ? `Class ${niceClasses.map(c => c.classNumber).join(", ")} — ${safeText(niceClasses[0].className_en || niceClasses[0].className).slice(0, 40)}`
      : "Trademark Clearance Analysis";
    const clW = bold.widthOfTextAtSize(classLine, 12);
    p.drawText(classLine, { x: (PAGE_W - clW) / 2, y: rule1Y - 80, size: 12, font: bold, color: C.gold });

    // Goods/Services (max 2 lines)
    if (goodsServices) {
      const gsLines = wrapText(goodsServices, regular, 9.5, CONTENT_W - 60).slice(0, 2);
      const gsY = rule1Y - 100;
      for (let i = 0; i < gsLines.length; i++) {
        const gW = regular.widthOfTextAtSize(gsLines[i], 9.5);
        p.drawText(gsLines[i], { x: (PAGE_W - gW) / 2, y: gsY - i * 15, size: 9.5, font: regular, color: rgb(0.75, 0.75, 0.75) });
      }
    }

    const rule2Y = rule1Y - 130;
    p.drawRectangle({ x: MARGIN_X, y: rule2Y, width: CONTENT_W, height: 1.5, color: C.gold });

    // ── SCORE CIRCLE ──
    const circleY = rule2Y - 85;
    const circleCX = PAGE_W / 2;
    const circleR = 42;

    // Outer arc (risk color) — background ring first
    drawArc(p, circleCX, circleY, circleR, 8, 1, rgb(0.2, 0.35, 0.25));
    // Progress arc
    drawArc(p, circleCX, circleY, circleR, 8, score / 100, rc);
    // Inner fill
    p.drawCircle({ x: circleCX, y: circleY, size: circleR - 6, color: C.deepGreen });

    // Score number
    const scoreStr = String(score);
    const scoreSize = 34;
    const scoreW = bold.widthOfTextAtSize(scoreStr, scoreSize);
    p.drawText(scoreStr, { x: circleCX - scoreW / 2, y: circleY + 8, size: scoreSize, font: bold, color: C.white });
    const outOfStr = "/100";
    const outOfW = bold.widthOfTextAtSize(outOfStr, 13);
    p.drawText(outOfStr, { x: circleCX - outOfW / 2, y: circleY - 14, size: 13, font: bold, color: C.gold });

    // Risk badge below circle
    const rl = riskLabel(result.risk, "en");
    const rlW = bold.widthOfTextAtSize(rl, 9) + 20;
    const badgeX = circleCX - rlW / 2;
    const badgeY = circleY - circleR - 20;
    p.drawRectangle({ x: badgeX, y: badgeY - 14, width: rlW, height: 18, color: rc });
    p.drawText(rl, { x: badgeX + 10, y: badgeY - 8, size: 9, font: bold, color: C.white });

    // ── BOTTOM AREA ──
    const bottomY = PAGE_H * 0.28;

    // Three data pills
    const pillData = [
      "Mexico - IMPI Registry",
      `${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      "Confidential",
    ];
    const totalPillW = pillData.reduce((acc, t) => acc + regular.widthOfTextAtSize(t, 8) + 28, 0) + 20;
    let pillX = (PAGE_W - totalPillW) / 2;
    for (const pd of pillData) {
      const pw = regular.widthOfTextAtSize(pd, 8) + 28;
      p.drawRectangle({ x: pillX, y: bottomY - 14, width: pw, height: 18, color: rgb(0.102, 0.29, 0.196), borderColor: C.gold, borderWidth: 0.8 });
      p.drawText(pd, { x: pillX + 14, y: bottomY - 7, size: 8, font: regular, color: C.white });
      pillX += pw + 10;
    }

    // Gold rule
    p.drawRectangle({ x: MARGIN_X, y: bottomY - 26, width: CONTENT_W, height: 1, color: C.gold });

    // Bilingual disclaimer block (two columns)
    const colW = (CONTENT_W - 20) / 2;
    const disclaimerEN = "This report is an AI-powered trademark screening analysis against the official IMPI MARCia database. It does not constitute legal advice.";
    const disclaimerES = "Este informe es un analisis automatizado de disponibilidad marcaria contra el registro oficial IMPI MARCia. No constituye asesoria legal.";
    const enLines = wrapText(disclaimerEN, regular, 7.5, colW);
    const esLines = wrapText(disclaimerES, italic, 7.5, colW);
    let dy = bottomY - 42;
    for (const line of enLines) {
      p.drawText(line, { x: MARGIN_X, y: dy, size: 7.5, font: regular, color: rgb(0.55, 0.65, 0.55) });
      dy -= 12;
    }
    dy = bottomY - 42;
    for (const line of esLines) {
      p.drawText(line, { x: MARGIN_X + colW + 20, y: dy, size: 7.5, font: italic, color: rgb(0.45, 0.55, 0.45) });
      dy -= 12;
    }

    // Bottom domain
    const siteLabel = "MexicoTrademarkCenter.com";
    const slW = bold.widthOfTextAtSize(siteLabel, 9);
    p.drawText(siteLabel, { x: (PAGE_W - slW) / 2, y: 30, size: 9, font: bold, color: C.gold });
  }

  // ════════════════════════════════════════════════════════════════════
  // Helper: render all analysis sections for a given language
  // ════════════════════════════════════════════════════════════════════

  const renderAllSections = (lang: Lang, useEnglish: boolean) => {
    const T = (en: string, es: string) => useEnglish ? en : es;

    // ── PAGE 2: EXECUTIVE SUMMARY ──────────────────────────────────────
    {
      const p = newPage("Executive Summary");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      // Section header
      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("EXECUTIVE SUMMARY", "RESUMEN EJECUTIVO"),
        T("Registrability assessment for trademark " + safeText(markName).slice(0, 25), "Evaluacion de registrabilidad para la marca " + safeText(markName).slice(0, 20)),
        y,
      );
      y -= 8;

      // ── Verdict Card ──
      const verdictH = 56;
      const vt = riskVerdict(result.risk);
      drawCard(p, MARGIN_X, y, CONTENT_W, verdictH, riskTintColor(result.risk));
      p.drawRectangle({ x: MARGIN_X, y: y - verdictH, width: 5, height: verdictH, color: rc });
      const verdictText = useEnglish ? vt.en : `${vt.en}`;
      p.drawText(safeText(verdictText).slice(0, 70), { x: MARGIN_X + 14, y: y - 20, size: 13, font: bold, color: rc });
      const verdictSub = useEnglish ? vt.es : vt.en;
      p.drawText(safeText(verdictSub).slice(0, 80), { x: MARGIN_X + 14, y: y - 36, size: 8.5, font: regular, color: C.textSecond });
      // Score pill top-right of card
      const scoreStr2 = `${score}/100`;
      const spW = bold.widthOfTextAtSize(scoreStr2, 11) + 14;
      p.drawRectangle({ x: MARGIN_X + CONTENT_W - spW - 8, y: y - 38, width: spW, height: 26, color: rc });
      p.drawText(scoreStr2, { x: MARGIN_X + CONTENT_W - spW - 1, y: y - 22, size: 11, font: bold, color: C.white });
      y -= verdictH + 10;

      // ── Attorney Notes Card ──
      const commentText = useEnglish ? commentary.english : commentary.native;
      if (commentText) {
        const attnLabel = "ATTORNEY NOTES / NOTAS DE ANALISIS";
        const attnLabelW = bold.widthOfTextAtSize(attnLabel, 7.5);
        p.drawText(attnLabel, { x: MARGIN_X, y, size: 7.5, font: bold, color: C.gold });
        y -= 10;
        const commentLines = wrapText(commentText, regular, 9.5, CONTENT_W - 24);
        const cardH = commentLines.length * 14.5 + 20;
        drawCard(p, MARGIN_X, y, CONTENT_W, cardH);
        p.drawRectangle({ x: MARGIN_X, y: y - cardH, width: CONTENT_W, height: 2, color: C.gold });
        let cy2 = y - 14;
        for (const line of commentLines) {
          if (cy2 < MARGIN_BOT + 20) break;
          p.drawText(line, { x: MARGIN_X + 12, y: cy2, size: 9.5, font: regular, color: C.textPrimary });
          cy2 -= 14.5;
        }
        y -= cardH + 12;
        void attnLabelW;
      }

      // ── Key Findings Grid (3 columns) ──
      if (y > MARGIN_BOT + 100) {
        const findings3 = buildKeyFindings(result, useEnglish);
        if (findings3.length > 0) {
          p.drawText(T("KEY FINDINGS", "HALLAZGOS CLAVE"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
          y -= 10;
          const colW3 = (CONTENT_W - 16) / 3;
          const cardH3 = 90;
          for (let i = 0; i < Math.min(findings3.length, 3); i++) {
            const fx = MARGIN_X + i * (colW3 + 8);
            const finding = findings3[i];
            drawCard(p, fx, y, colW3, cardH3);
            // Severity stripe
            p.drawRectangle({ x: fx, y: y - cardH3, width: colW3, height: 4, color: finding.color });
            p.drawText(safeText(finding.title).slice(0, 22), { x: fx + 8, y: y - 18, size: 8.5, font: bold, color: C.textPrimary });
            const descLines = wrapText(finding.desc, regular, 7.5, colW3 - 16).slice(0, 3);
            let fy = y - 32;
            for (const dl of descLines) {
              p.drawText(dl, { x: fx + 8, y: fy, size: 7.5, font: regular, color: C.textSecond });
              fy -= 12;
            }
            p.drawText(safeText(finding.dataPoint).slice(0, 28), { x: fx + 8, y: y - cardH3 + 10, size: 7, font: bold, color: C.gold });
          }
          y -= cardH3 + 14;
        }
      }

      // ── Pentagon + Axis Bars (two column) ──
      if (y > MARGIN_BOT + 130) {
        p.drawText(T("5-AXIS RISK PROFILE", "PERFIL DE RIESGO — 5 EJES"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 10;
        const pCardH = 130;
        drawCard(p, MARGIN_X, y, CONTENT_W, pCardH);

        const pentCX = MARGIN_X + 85;
        const pentCY = y - pCardH / 2;
        drawPentagon(p, pentCX, pentCY, 120, pentagonScores, regular, bold, rc);

        // Score bars on right side
        const barsX = MARGIN_X + 170;
        const barsW = CONTENT_W - 170 - 10;
        let by = y - 16;
        for (const ps of pentagonScores) {
          const barColor = ps.score >= 70 ? C.accentGreen : ps.score >= 40 ? C.accentOrange : C.accentRed;
          p.drawText(safeText(ps.label), { x: barsX, y: by, size: 7.5, font: bold, color: C.textPrimary });
          p.drawText(`${ps.score}`, { x: barsX + barsW - 22, y: by, size: 7.5, font: bold, color: barColor });
          by -= 12;
          // Bar track
          p.drawRectangle({ x: barsX, y: by - 3, width: barsW - 24, height: 7, color: C.border });
          p.drawRectangle({ x: barsX, y: by - 3, width: (barsW - 24) * ps.score / 100, height: 7, color: barColor });
          by -= 16;
          // Interpretation
          const interp = getAxisInterpretation(ps.label, ps.score, useEnglish);
          p.drawText(safeText(interp).slice(0, 55), { x: barsX, y: by, size: 6.5, font: italic, color: C.textMuted });
          by -= 14;
        }
        y -= pCardH + 8;
      }
    }

    // ── PAGES 3–4: CONFLICTING MARKS ───────────────────────────────────
    {
      const findings = result.marciaFindings ?? [];
      const totalCount = result.marciaTotalCount ?? findings.length;

      const critical = findings.filter(f => isHighSimilarity(f, markName));
      const significant = findings.filter(f => !isHighSimilarity(f, markName) && isMedSimilarity(f, markName));
      const background = findings.filter(f => !isHighSimilarity(f, markName) && !isMedSimilarity(f, markName));

      let p = newPage("Conflicting Marks");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      let y = PAGE_H - 26 - 8;
      const subTitle = `${critical.length} critical  |  ${significant.length} significant  |  ${background.length} background noise`;
      y = addSectionHeader(p, bold,
        T("CONFLICTING MARKS — IMPI MARCIA RESULTS", "MARCAS EN CONFLICTO — RESULTADOS IMPI MARCIA"),
        subTitle,
        y,
      );
      y -= 6;

      // Similarity distribution bar
      if (totalCount > 0) {
        const barH = 22;
        drawCard(p, MARGIN_X, y, CONTENT_W, barH + 16);
        let bx = MARGIN_X + 1;
        const segments = [
          { label: `Identical (${critical.length})`, count: critical.length, color: C.accentRed },
          { label: `Very Similar (${significant.length})`, count: significant.length, color: C.accentOrange },
          { label: `Background (${background.length})`, count: background.length, color: C.textMuted },
        ];
        const totalSeg = segments.reduce((a, s) => a + s.count, 0) || 1;
        for (const seg of segments) {
          const segW = Math.max(seg.count > 0 ? 40 : 0, ((CONTENT_W - 2) * seg.count) / totalSeg);
          if (segW > 0) {
            p.drawRectangle({ x: bx, y: y - barH, width: segW, height: barH, color: seg.color });
            if (segW > 35) {
              p.drawText(safeText(seg.label).slice(0, 14), { x: bx + 4, y: y - 14, size: 6.5, font: bold, color: C.white });
            }
            bx += segW;
          }
        }
        y -= barH + 22;
        const analyzed = `${T("Analyzed", "Analizado")} ${totalCount} ${T("marks from IMPI MARCia database", "marcas del registro IMPI MARCia")}`;
        p.drawText(analyzed, { x: MARGIN_X, y, size: 7.5, font: regular, color: C.textMuted });
        y -= 18;
      }

      // Critical tier
      if (critical.length > 0) {
        // Tier banner
        p.drawRectangle({ x: MARGIN_X, y: y - 22, width: CONTENT_W, height: 24, color: rgb(0.992, 0.941, 0.933) });
        p.drawRectangle({ x: MARGIN_X, y: y - 22, width: 4, height: 24, color: C.accentRed });
        p.drawText(T("CRITICAL — Direct Obstacles to Registration", "CRITICO — Obstaculos Directos al Registro"), { x: MARGIN_X + 12, y: y - 10, size: 8.5, font: bold, color: C.accentRed });
        p.drawText(T("Marks with high similarity or same class registration", "Marcas con alta similitud o registro en la misma clase"), { x: MARGIN_X + 12, y: y - 19, size: 7, font: regular, color: C.textSecond });
        y -= 32;

        for (let i = 0; i < critical.length; i++) {
          const f = critical[i];
          if (y < MARGIN_BOT + 80) {
            p = newPage("Conflicting Marks (cont.)");
            drawPageBackground(p);
            addRunningHeader(p, regular, bold, markName, niceClasses);
            y = PAGE_H - 26 - MARGIN_TOP + 26;
          }

          const cardH = 90;
          const bg = i % 2 === 0 ? C.cardWhite : C.offWhite;
          drawCard(p, MARGIN_X, y, CONTENT_W, cardH, bg);
          p.drawRectangle({ x: MARGIN_X, y: y - cardH, width: CONTENT_W, height: cardH, color: bg });
          p.drawRectangle({ x: MARGIN_X, y: y - cardH, width: CONTENT_W, height: 0.5, color: C.border });

          // Similarity donut (left)
          const dotCX = MARGIN_X + 28;
          const dotCY = y - 30;
          const simScore = f.similarityScore ?? (f.name.toLowerCase().trim() === markName.toLowerCase().trim() ? 98 : 70);
          const dotColor = simScore >= 80 ? C.accentRed : simScore >= 60 ? C.accentOrange : rgb(0.8, 0.7, 0.1);
          drawArc(p, dotCX, dotCY, 18, 5, 1, C.border);
          drawArc(p, dotCX, dotCY, 18, 5, simScore / 100, dotColor);
          p.drawCircle({ x: dotCX, y: dotCY, size: 12, color: C.cardWhite });
          const simStr = `${simScore}`;
          const simW = bold.widthOfTextAtSize(simStr, 8);
          p.drawText(simStr, { x: dotCX - simW / 2, y: dotCY - 4, size: 8, font: bold, color: dotColor });
          p.drawText("%", { x: dotCX + simW / 2 - 1, y: dotCY - 4, size: 5, font: regular, color: dotColor });

          // Mark info (right of donut)
          const infoX = MARGIN_X + 58;
          p.drawText(safeText(f.name).slice(0, 28).toUpperCase(), { x: infoX, y: y - 14, size: 11, font: bold, color: C.textPrimary });
          drawStatusBadge(p, bold, f.status, MARGIN_X + CONTENT_W - 90, y - 14);
          p.drawText(T("Owner: ", "Titular: ") + safeText(f.holder).slice(0, 35), { x: infoX, y: y - 28, size: 8, font: regular, color: C.textSecond });
          const expLine = [
            f.expediente ? `Exp. ${f.expediente}` : "",
            `Class ${f.classNum}`,
            "Mexico",
          ].filter(Boolean).join("  ·  ");
          p.drawText(expLine, { x: infoX, y: y - 40, size: 8, font: regular, color: C.textMuted });

          // Divider
          p.drawRectangle({ x: MARGIN_X + 8, y: y - 52, width: CONTENT_W - 16, height: 0.5, color: C.border });

          // Legal analysis text (use riskSummary or fallback)
          const analysisEN = `This mark "${f.name}" in Class ${f.classNum} presents a direct conflict under Art. 173 Fr. XVIII LFPPI due to phonetic and visual similarity with the applicant's mark. The dominant element creates a likelihood of confusion among consumers. Registration is at risk without mark modification.`;
          const analysisES = `Esta marca "${f.name}" en la Clase ${f.classNum} presenta un conflicto directo bajo el Art. 173 Fr. XVIII LFPPI por similitud fonetica y visual con la marca solicitante. El elemento dominante genera riesgo de confusion. El registro esta en riesgo sin modificacion de la marca.`;

          const enLines = wrapText(useEnglish ? analysisEN : analysisEN, regular, 7.5, CONTENT_W - 20).slice(0, 2);
          const esLines = wrapText(analysisES, italic, 7.5, CONTENT_W - 20).slice(0, 2);
          let ay = y - 60;
          for (const line of enLines) {
            p.drawText(line, { x: MARGIN_X + 10, y: ay, size: 7.5, font: regular, color: C.textPrimary });
            ay -= 11;
          }
          for (const line of esLines) {
            p.drawText(line, { x: MARGIN_X + 10, y: ay, size: 7.5, font: italic, color: C.textSecond });
            ay -= 11;
          }

          y -= cardH + 6;
        }
      }

      // Significant tier
      if (significant.length > 0) {
        if (y < MARGIN_BOT + 60) {
          p = newPage("Conflicting Marks (cont.)");
          drawPageBackground(p);
          addRunningHeader(p, regular, bold, markName, niceClasses);
          y = PAGE_H - 26 - MARGIN_TOP + 26;
        }

        p.drawRectangle({ x: MARGIN_X, y: y - 22, width: CONTENT_W, height: 24, color: rgb(0.996, 0.953, 0.918) });
        p.drawRectangle({ x: MARGIN_X, y: y - 22, width: 4, height: 24, color: C.accentOrange });
        p.drawText(T("SIGNIFICANT — Moderate Obstacles", "SIGNIFICATIVO — Obstaculos Moderados"), { x: MARGIN_X + 12, y: y - 10, size: 8.5, font: bold, color: C.accentOrange });
        y -= 32;

        for (let i = 0; i < Math.min(significant.length, 6); i++) {
          const f = significant[i];
          if (y < MARGIN_BOT + 60) {
            p = newPage("Conflicting Marks (cont.)");
            drawPageBackground(p);
            addRunningHeader(p, regular, bold, markName, niceClasses);
            y = PAGE_H - 26 - MARGIN_TOP + 26;
          }
          const bg = i % 2 === 0 ? C.cardWhite : C.offWhite;
          const cardH2 = 52;
          drawCard(p, MARGIN_X, y, CONTENT_W, cardH2, bg);
          p.drawText(safeText(f.name).slice(0, 28).toUpperCase(), { x: MARGIN_X + 10, y: y - 14, size: 10, font: bold, color: C.textPrimary });
          drawStatusBadge(p, bold, f.status, MARGIN_X + CONTENT_W - 90, y - 14);
          p.drawText(T("Owner: ", "Titular: ") + safeText(f.holder).slice(0, 40), { x: MARGIN_X + 10, y: y - 28, size: 8, font: regular, color: C.textSecond });
          const expLine2 = [f.expediente ? `Exp. ${f.expediente}` : "", `Class ${f.classNum}`, "Mexico"].filter(Boolean).join("  ·  ");
          p.drawText(expLine2, { x: MARGIN_X + 10, y: y - 40, size: 7.5, font: regular, color: C.textMuted });
          y -= cardH2 + 4;
        }
      }

      // Background noise table
      if (background.length > 0) {
        if (y < MARGIN_BOT + 80) {
          p = newPage("Conflicting Marks (cont.)");
          drawPageBackground(p);
          addRunningHeader(p, regular, bold, markName, niceClasses);
          y = PAGE_H - 26 - MARGIN_TOP + 26;
        }
        p.drawText(T("BACKGROUND NOISE", "RUIDO DE FONDO"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 14;

        // Table header
        p.drawRectangle({ x: MARGIN_X, y: y - 16, width: CONTENT_W, height: 18, color: C.midGreen });
        const cols = [{ x: MARGIN_X + 6, w: 130, label: "Mark" }, { x: MARGIN_X + 144, w: 120, label: "Owner" }, { x: MARGIN_X + 272, w: 60, label: "Class" }, { x: MARGIN_X + 340, w: 100, label: "Status" }];
        for (const col of cols) p.drawText(T(col.label, col.label === "Mark" ? "Marca" : col.label === "Owner" ? "Titular" : col.label === "Class" ? "Clase" : "Estado"), { x: col.x, y: y - 10, size: 7.5, font: bold, color: C.white });
        y -= 22;

        for (let i = 0; i < Math.min(background.length, 15) && y > MARGIN_BOT; i++) {
          const f = background[i];
          const rowBg = i % 2 === 0 ? C.offWhite : C.cardWhite;
          p.drawRectangle({ x: MARGIN_X, y: y - 14, width: CONTENT_W, height: 16, color: rowBg });
          p.drawText(safeText(f.name).slice(0, 20), { x: cols[0].x, y: y - 8, size: 8, font: regular, color: C.textPrimary });
          p.drawText(safeText(f.holder).slice(0, 18), { x: cols[1].x, y: y - 8, size: 8, font: regular, color: C.textSecond });
          p.drawText(safeText(f.classNum), { x: cols[2].x, y: y - 8, size: 8, font: regular, color: C.textSecond });
          p.drawText(safeText(f.status).slice(0, 14), { x: cols[3].x, y: y - 8, size: 8, font: regular, color: C.textSecond });
          y -= 18;
        }
      }
    }

    // ── PAGE: LFPPI ANALYSIS ───────────────────────────────────────────
    {
      const flags = result.registrabilityFlags ?? [];
      const p = newPage("LFPPI Analysis");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("LFPPI REGISTRABILITY ANALYSIS", "ANALISIS DE REGISTRABILIDAD LFPPI"),
        T("Evaluation against Mexico's Ley Federal de Proteccion a la Propiedad Industrial", "Evaluacion bajo la Ley Federal de Proteccion a la Propiedad Industrial de Mexico"),
        y,
      );
      y -= 8;

      // Summary box
      const failed = flags.filter(f => f.severity === "high" || f.severity === "medium").length;
      const passed = Math.max(0, 8 - flags.length);
      const summaryStr = `${failed} ${T("grounds failed", "motivos fallidos")}  ·  ${passed} ${T("grounds passed", "motivos aprobados")}  ·  ${Math.max(0, 13 - failed - passed)} ${T("not applicable", "no aplicables")}`;
      p.drawRectangle({ x: MARGIN_X, y: y - 26, width: CONTENT_W, height: 30, color: C.deepGreen });
      const sumW = bold.widthOfTextAtSize(summaryStr, 9);
      p.drawText(summaryStr, { x: (PAGE_W - sumW) / 2, y: y - 12, size: 9, font: bold, color: C.white });
      y -= 42;

      if (flags.length === 0) {
        drawCard(p, MARGIN_X, y, CONTENT_W, 44, rgb(0.918, 0.976, 0.937));
        p.drawRectangle({ x: MARGIN_X, y: y - 44, width: 4, height: 44, color: C.accentGreen });
        p.drawText(T("No absolute grounds for refusal detected under the LFPPI.", "No se detectaron causales absolutas de negativa bajo la LFPPI."), { x: MARGIN_X + 14, y: y - 20, size: 10, font: bold, color: C.accentGreen });
        p.drawText(T("The mark does not appear to conflict with any absolute registrability requirement.", "La marca no parece conflictuarse con ningun requisito absoluto de registrabilidad."), { x: MARGIN_X + 14, y: y - 34, size: 8, font: regular, color: C.textSecond });
        y -= 56;
      } else {
        const sorted = [...flags].sort((a, b) => {
          const sv: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (sv[a.severity] ?? 2) - (sv[b.severity] ?? 2);
        });

        for (const flag of sorted) {
          if (y < MARGIN_BOT + 80) break;
          const sColor = flag.severity === "high" ? C.accentRed : flag.severity === "medium" ? C.accentOrange : C.accentGreen;
          const catLabel = CATEGORY_EN[flag.category] ?? flag.category;
          const explainEN = flag.explanation_en ?? flag.explanation;
          const explainES = flag.explanation;
          const enLines = wrapText(explainEN, regular, 8.5, CONTENT_W - 28).slice(0, 3);
          const esLines = wrapText(explainES, italic, 8, CONTENT_W - 28).slice(0, 2);
          const cardH = 28 + enLines.length * 13 + esLines.length * 12 + 16;
          drawCard(p, MARGIN_X, y, CONTENT_W, cardH);

          // Header bar
          p.drawRectangle({ x: MARGIN_X, y: y - 26, width: CONTENT_W, height: 26, color: sColor });
          const failLabel = T("FAILED", "FALLIDO");
          p.drawText(`${failLabel} — ${safeText(catLabel).slice(0, 35)}`, { x: MARGIN_X + 12, y: y - 12, size: 9.5, font: bold, color: C.white });
          const lfppiRef = getLfppiRef(flag.category);
          p.drawText(lfppiRef, { x: MARGIN_X + CONTENT_W - regular.widthOfTextAtSize(lfppiRef, 8) - 10, y: y - 12, size: 8, font: regular, color: rgb(1, 1, 0.7) });
          const sevLabel = flag.severity.toUpperCase();
          p.drawText(sevLabel, { x: MARGIN_X + CONTENT_W - regular.widthOfTextAtSize(lfppiRef, 8) - 60, y: y - 12, size: 7.5, font: bold, color: C.white });

          let fy = y - 40;
          for (const line of enLines) {
            p.drawText(line, { x: MARGIN_X + 12, y: fy, size: 8.5, font: regular, color: C.textPrimary });
            fy -= 13;
          }
          fy -= 4;
          for (const line of esLines) {
            p.drawText(line, { x: MARGIN_X + 12, y: fy, size: 8, font: italic, color: C.textSecond });
            fy -= 12;
          }

          y -= cardH + 8;
        }
      }

      // Passed grounds compact table
      if (y > MARGIN_BOT + 60) {
        y -= 6;
        p.drawText(T("PASSED GROUNDS", "MOTIVOS APROBADOS"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 12;
        const passedGrounds = PASSED_GROUNDS_EN.filter(g => !flags.find(f => f.category === g.key));
        for (let i = 0; i < Math.min(passedGrounds.length, 8) && y > MARGIN_BOT; i++) {
          const bg = i % 2 === 0 ? C.offWhite : C.cardWhite;
          p.drawRectangle({ x: MARGIN_X, y: y - 14, width: CONTENT_W, height: 16, color: bg });
          p.drawText(safeText(passedGrounds[i].label), { x: MARGIN_X + 8, y: y - 8, size: 8, font: regular, color: C.textPrimary });
          const okStr = T("No issue detected", "Sin problemas detectados");
          p.drawText(okStr, { x: MARGIN_X + CONTENT_W - regular.widthOfTextAtSize(okStr, 8) - 8, y: y - 8, size: 8, font: bold, color: C.accentGreen });
          y -= 18;
        }
      }
    }

    // ── PAGE: DUPONT ANALYSIS ──────────────────────────────────────────
    if (result.dupont && result.dupont.length > 0) {
      const factors = result.dupont;
      const favor = factors.filter(f => f.verdict === "favors_registration").length;
      const against = factors.filter(f => f.verdict === "against_registration").length;
      const neutral = factors.length - favor - against;

      let p = newPage("DuPont Analysis");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("DUPONT LIKELIHOOD-OF-CONFUSION ANALYSIS (13 FACTORS)", "ANALISIS DUPONT DE CONFUSION (13 FACTORES)"),
        T("Adapted for Mexican trademark law under the LFPPI framework", "Adaptado al derecho de marcas mexicano bajo el marco LFPPI"),
        y,
      );
      y -= 8;

      // Summary bar
      const boxW = (CONTENT_W - 8) / 3;
      const summaryBoxes = [
        { label: T(`${favor} Favoring Registration`, `${favor} A Favor del Registro`), color: C.accentGreen },
        { label: T(`${neutral} Neutral`, `${neutral} Neutral`), color: C.textMuted },
        { label: T(`${against} Against Registration`, `${against} En Contra del Registro`), color: C.accentRed },
      ];
      for (let i = 0; i < summaryBoxes.length; i++) {
        const bx = MARGIN_X + i * (boxW + 4);
        p.drawRectangle({ x: bx, y: y - 28, width: boxW, height: 30, color: summaryBoxes[i].color });
        const lw = bold.widthOfTextAtSize(safeText(summaryBoxes[i].label), 8.5);
        p.drawText(safeText(summaryBoxes[i].label).slice(0, 28), { x: bx + (boxW - lw) / 2, y: y - 16, size: 8.5, font: bold, color: C.white });
      }
      y -= 44;

      const COL_W = (CONTENT_W - 8) / 2;
      let col = 0;
      let colY = y;
      let colYRight = y;

      for (let i = 0; i < factors.length; i++) {
        const f = factors[i];
        const vc = f.verdict === "favors_registration" ? C.accentGreen : f.verdict === "against_registration" ? C.accentRed : C.textMuted;
        const verdLabel = f.verdict === "favors_registration" ? T("FAVORS", "FAVORECE") : f.verdict === "against_registration" ? T("AGAINST", "EN CONTRA") : T("NEUTRAL", "NEUTRAL");
        const label = DUPONT_EN[f.factor] ?? f.factor;
        const reasonText = useEnglish ? (f.reasoning_en ?? f.reasoning) : f.reasoning;
        const reasonLines = wrapText(reasonText, regular, 8, COL_W - 22).slice(0, 3);
        const cardH = 28 + reasonLines.length * 12 + 16;

        const isLeft = col % 2 === 0;
        const cx = isLeft ? MARGIN_X : MARGIN_X + COL_W + 8;
        const currentY = isLeft ? colY : colYRight;

        if (currentY - cardH < MARGIN_BOT) {
          p = newPage("DuPont Analysis (cont.)");
          drawPageBackground(p);
          addRunningHeader(p, regular, bold, markName, niceClasses);
          colY = PAGE_H - 26 - MARGIN_TOP + 26;
          colYRight = colY;
          y = colY;
        }

        const useY = isLeft ? colY : colYRight;
        drawCard(p, cx, useY, COL_W, cardH);
        if (f.verdict === "against_registration") {
          p.drawRectangle({ x: cx, y: useY - cardH, width: 4, height: cardH, color: C.accentRed });
        }

        // Factor header
        p.drawText(`${i + 1}. ${safeText(label).slice(0, 30)}`, { x: cx + 10, y: useY - 12, size: 8.5, font: bold, color: C.deepGreen });
        const vl = bold.widthOfTextAtSize(verdLabel, 7);
        p.drawRectangle({ x: cx + COL_W - vl - 14, y: useY - 22, width: vl + 12, height: 14, color: vc });
        p.drawText(verdLabel, { x: cx + COL_W - vl - 8, y: useY - 14, size: 7, font: bold, color: C.white });

        let ry = useY - 28;
        for (const rl of reasonLines) {
          p.drawText(rl, { x: cx + 10, y: ry, size: 8, font: regular, color: C.textPrimary });
          ry -= 12;
        }

        if (isLeft) colY -= cardH + 6;
        else colYRight -= cardH + 6;
        col++;
      }
    }

    // ── PAGE: DISTINCTIVENESS + TRANSLATION ───────────────────────────
    {
      const p = newPage("Distinctiveness & Translation");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("DISTINCTIVENESS & TRANSLATION ANALYSIS", "ANALISIS DE DISTINTIVIDAD Y TRADUCCION"),
        T("Mark strength evaluation and multi-language conflict screening", "Evaluacion de fortaleza de marca y revision de conflictos multilingue"),
        y,
      );
      y -= 8;

      const colW2 = (CONTENT_W - 16) / 2;
      const leftX = MARGIN_X;
      const rightX = MARGIN_X + colW2 + 16;

      // ── Left: Distinctiveness ──
      const dist = result.distinctiveness;
      p.drawText(T("DISTINCTIVENESS / DISTINTIVIDAD", "DISTINTIVIDAD / DISTINCTIVENESS"), { x: leftX, y, size: 7.5, font: bold, color: C.gold });
      y -= 14;

      const tiers = ["Generic", "Descriptive", "Suggestive", "Arbitrary", "Fanciful"];
      const tierColors = [C.accentRed, C.accentOrange, rgb(0.8, 0.65, 0.1), C.accentGreen, C.deepGreen];
      const tierW = (colW2 - 2) / tiers.length;
      const activeTier = dist?.tier ?? "arbitrary";
      const activeIdx = tiers.findIndex(t => t.toLowerCase() === activeTier.toLowerCase());

      for (let ti = 0; ti < tiers.length; ti++) {
        const isActive = ti === activeIdx;
        const tx = leftX + ti * tierW;
        p.drawRectangle({ x: tx, y: y - 20, width: tierW - 1, height: 20, color: isActive ? tierColors[ti] : C.border });
        if (isActive) {
          p.drawRectangle({ x: tx, y: y - 20, width: tierW - 1, height: 20, color: tierColors[ti] });
          // Triangle marker above
          p.drawText("v", { x: tx + tierW / 2 - 3, y: y + 2, size: 8, font: bold, color: tierColors[ti] });
        }
        const label = tiers[ti].slice(0, 4);
        const lw = (isActive ? bold : regular).widthOfTextAtSize(label, 7);
        p.drawText(label, { x: tx + (tierW - lw) / 2, y: y - 14, size: 7, font: isActive ? bold : regular, color: isActive ? C.white : C.textMuted });
      }
      y -= 26;

      // Classification badge
      if (dist) {
        const badgeLabel = `${dist.tier.charAt(0).toUpperCase() + dist.tier.slice(1)} (${dist.score}/5)`;
        const bdW = bold.widthOfTextAtSize(badgeLabel, 9) + 16;
        p.drawRectangle({ x: leftX, y: y - 18, width: bdW, height: 20, color: activeIdx >= 0 ? tierColors[Math.min(activeIdx, tierColors.length - 1)] : C.textMuted });
        p.drawText(badgeLabel, { x: leftX + 8, y: y - 10, size: 9, font: bold, color: C.white });
        y -= 26;

        // Explanation
        const explainText = useEnglish ? (dist.explanation_en ?? dist.explanation) : dist.explanation;
        const expLines = wrapText(explainText, regular, 8, colW2).slice(0, 5);
        for (const line of expLines) {
          p.drawText(line, { x: leftX, y, size: 8, font: regular, color: C.textPrimary });
          y -= 12;
        }
        y -= 8;

        // LFPPI strength meter
        p.drawText(T("Art. 173 LFPPI Strength (0-5)", "Fortaleza Art. 173 LFPPI (0-5)"), { x: leftX, y, size: 7.5, font: bold, color: C.textMuted });
        y -= 14;
        p.drawRectangle({ x: leftX, y: y - 10, width: colW2, height: 10, color: C.border });
        const meterW = (colW2 * dist.score) / 5;
        const mColor = dist.score >= 4 ? C.accentGreen : dist.score >= 3 ? C.accentOrange : C.accentRed;
        p.drawRectangle({ x: leftX, y: y - 10, width: meterW, height: 10, color: mColor });
        for (let si = 0; si <= 5; si++) {
          const sx = leftX + (colW2 * si) / 5;
          p.drawText(String(si), { x: sx - 2, y: y - 22, size: 6.5, font: regular, color: C.textMuted });
        }
        y -= 30;
      }

      // ── Right: Translation Table ──
      let ry = PAGE_H - 26 - MARGIN_TOP + 8;
      p.drawText(T("TRANSLATION ANALYSIS / ANALISIS DE TRADUCCION", "ANALISIS DE TRADUCCION / TRANSLATION ANALYSIS"), { x: rightX, y: ry, size: 7.5, font: bold, color: C.gold });
      ry -= 14;

      const translationFlags = result.translationAnalysis ?? [];

      // Table header
      p.drawRectangle({ x: rightX, y: ry - 16, width: colW2, height: 18, color: C.deepGreen });
      p.drawText(T("Language", "Idioma"), { x: rightX + 6, y: ry - 10, size: 7.5, font: bold, color: C.white });
      p.drawText(T("Form", "Forma"), { x: rightX + 85, y: ry - 10, size: 7.5, font: bold, color: C.white });
      p.drawText(T("Risk", "Riesgo"), { x: rightX + colW2 - 36, y: ry - 10, size: 7.5, font: bold, color: C.white });
      ry -= 22;

      if (translationFlags.length === 0) {
        p.drawRectangle({ x: rightX, y: ry - 30, width: colW2, height: 32, color: rgb(0.918, 0.976, 0.937) });
        p.drawText(T("No conflicting meanings detected", "Sin significados conflictivos detectados"), { x: rightX + 8, y: ry - 16, size: 8.5, font: bold, color: C.accentGreen });
        ry -= 40;
      } else {
        for (let i = 0; i < translationFlags.length && ry > MARGIN_BOT; i++) {
          const tf = translationFlags[i];
          const riskC = tf.risk === "high" ? C.accentRed : tf.risk === "medium" ? C.accentOrange : tf.risk === "low" ? rgb(0.1, 0.35, 0.7) : C.accentGreen;
          const rowBg = i % 2 === 0 ? C.offWhite : C.cardWhite;
          const detailText = useEnglish ? (tf.details_en || tf.details) : tf.details;
          const detailLines = wrapText(detailText, regular, 7, colW2 - 20).slice(0, 2);
          const rowH = Math.max(28, detailLines.length * 11 + 18);
          p.drawRectangle({ x: rightX, y: ry - rowH, width: colW2, height: rowH, color: rowBg });

          if (tf.risk === "medium" || tf.risk === "high") {
            p.drawRectangle({ x: rightX, y: ry - rowH, width: 3, height: rowH, color: riskC });
          }

          p.drawText(safeText(tf.languageName).slice(0, 12), { x: rightX + 6, y: ry - 10, size: 8, font: bold, color: C.textPrimary });
          p.drawText(safeText(tf.translatedForm).slice(0, 12), { x: rightX + 85, y: ry - 10, size: 8, font: regular, color: C.textPrimary });
          const riskStr = tf.risk.toUpperCase().slice(0, 6);
          const rw = bold.widthOfTextAtSize(riskStr, 7) + 8;
          p.drawRectangle({ x: rightX + colW2 - rw - 4, y: ry - 20, width: rw, height: 14, color: riskC });
          p.drawText(riskStr, { x: rightX + colW2 - rw, y: ry - 13, size: 7, font: bold, color: C.white });

          let dy = ry - 22;
          for (const line of detailLines) {
            p.drawText(line, { x: rightX + 6, y: dy, size: 7, font: regular, color: C.textSecond });
            dy -= 11;
          }
          ry -= rowH + 2;
        }
      }

      const conflictsFound = translationFlags.filter(f => f.risk !== "none").length;
      const footnote = conflictsFound > 0
        ? T(`${conflictsFound} potential meaning conflict(s) identified`, `${conflictsFound} posible(s) conflicto(s) de significado identificado(s)`)
        : T("No conflicting meanings detected across analyzed languages", "Sin significados conflictivos detectados en los idiomas analizados");
      p.drawText(safeText(footnote), { x: rightX, y: ry - 8, size: 7, font: italic, color: C.textMuted });
    }

    // ── PAGE: DOMAIN + WEB PRESENCE ────────────────────────────────────
    {
      const p = newPage("Domain & Web Presence");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("DOMAIN AVAILABILITY & WEB PRESENCE", "DISPONIBILIDAD DE DOMINIO Y PRESENCIA WEB"),
        T("Digital brand footprint assessment", "Evaluacion de huella digital de la marca"),
        y,
      );
      y -= 8;

      const colW3 = (CONTENT_W - 16) / 2;
      const leftX = MARGIN_X;
      const rightX = MARGIN_X + colW3 + 16;
      const domains = result.domainResults ?? [];

      // Left: Domains
      p.drawText(T("DOMAIN AVAILABILITY / DISPONIBILIDAD DE DOMINIO", "DISPONIBILIDAD DE DOMINIO / DOMAIN AVAILABILITY"), { x: leftX, y, size: 7.5, font: bold, color: C.gold });
      y -= 12;

      const primaryDomains = domains.filter(d => [".com", ".com.mx", ".mx"].some(ext => d.domain.endsWith(ext)));
      const secondaryDomains = domains.filter(d => !primaryDomains.includes(d));

      const drawDomainPill = (d: DomainResult, px: number, py: number, large: boolean): number => {
        const avail = d.status === "available";
        const pillColor = avail ? C.accentGreen : C.accentRed;
        const symbol = avail ? "+" : "x";
        const text = `${symbol} ${safeText(d.domain)}`;
        const tw = (large ? bold : regular).widthOfTextAtSize(text, large ? 8.5 : 7.5);
        const pH = large ? 20 : 16;
        const pW = Math.min(tw + 16, colW3 - 2);
        p.drawRectangle({ x: px, y: py - pH, width: pW, height: pH, color: pillColor });
        p.drawText(text, { x: px + 8, y: py - (large ? 12 : 10), size: large ? 8.5 : 7.5, font: large ? bold : regular, color: C.white });
        return pH + 4;
      };

      if (primaryDomains.length > 0) {
        p.drawText(T("Primary", "Principales"), { x: leftX, y, size: 7, font: bold, color: C.textMuted });
        y -= 10;
        for (const d of primaryDomains) y -= drawDomainPill(d, leftX, y, true);
        y -= 4;
      }

      if (secondaryDomains.length > 0) {
        p.drawText(T("Secondary", "Secundarios"), { x: leftX, y, size: 7, font: bold, color: C.textMuted });
        y -= 10;
        let px = leftX;
        let rowY = y;
        for (const d of secondaryDomains) {
          const avail = d.status === "available";
          const text = `${avail ? "+" : "x"} ${safeText(d.domain)}`;
          const tw = regular.widthOfTextAtSize(text, 7.5) + 16;
          if (px + tw > leftX + colW3) { px = leftX; rowY -= 22; }
          const pillColor = avail ? C.accentGreen : C.accentRed;
          p.drawRectangle({ x: px, y: rowY - 16, width: tw, height: 16, color: pillColor });
          p.drawText(text, { x: px + 8, y: rowY - 10, size: 7.5, font: regular, color: C.white });
          px += tw + 4;
        }
        y = rowY - 26;
      }

      if (domains.length === 0) {
        p.drawText(T("Domain availability not checked for this report.", "Disponibilidad de dominio no verificada para este informe."), { x: leftX, y, size: 8, font: italic, color: C.textMuted });
        y -= 16;
      }

      const checkDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      p.drawText(T(`Checked ${checkDate} — availability may change`, `Verificado ${checkDate} — disponibilidad puede cambiar`), { x: leftX, y: MARGIN_BOT + 6, size: 7, font: italic, color: C.textMuted });

      // Right: Web Presence
      let ry2 = PAGE_H - 26 - MARGIN_TOP + 8;
      p.drawText(T("WEB PRESENCE / PRESENCIA WEB", "PRESENCIA WEB / WEB PRESENCE"), { x: rightX, y: ry2, size: 7.5, font: bold, color: C.gold });
      ry2 -= 14;

      const webFindings = result.webFindings ?? [];
      if (webFindings.length === 0) {
        drawCard(p, rightX, ry2, colW3, 44, rgb(0.918, 0.976, 0.937));
        p.drawRectangle({ x: rightX, y: ry2 - 44, width: 4, height: 44, color: C.accentGreen });
        p.drawText(T("No significant web presence conflicts detected", "Sin conflictos significativos de presencia web detectados"), { x: rightX + 12, y: ry2 - 22, size: 8.5, font: bold, color: C.accentGreen });
        ry2 -= 54;
      } else {
        for (let i = 0; i < Math.min(webFindings.length, 8) && ry2 > MARGIN_BOT; i++) {
          const finding = webFindings[i];
          const fLines = wrapText(finding, regular, 7.5, colW3 - 24).slice(0, 2);
          const fH = fLines.length * 12 + 14;
          drawCard(p, rightX, ry2, colW3, fH);
          let fy = ry2 - 12;
          for (const line of fLines) {
            p.drawText(line, { x: rightX + 10, y: fy, size: 7.5, font: regular, color: C.textPrimary });
            fy -= 12;
          }
          ry2 -= fH + 6;
        }
      }
    }

    // ── PAGE: STRATEGY & NEXT STEPS ────────────────────────────────────
    {
      const p = newPage("Strategy & Next Steps");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);

      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("STRATEGY RECOMMENDATIONS", "RECOMENDACIONES ESTRATEGICAS"),
        T("Recommended paths to successful trademark registration", "Caminos recomendados para el registro exitoso de la marca"),
        y,
      );
      y -= 10;

      const strategies = buildStrategies(result, markName, useEnglish);

      for (let si = 0; si < Math.min(strategies.length, 3); si++) {
        if (y < MARGIN_BOT + 90) break;
        const strat = strategies[si];
        const pathCardH = 88;
        drawCard(p, MARGIN_X, y, CONTENT_W, pathCardH);

        // Number badge
        const numStr = `${si + 1}`;
        p.drawRectangle({ x: MARGIN_X + 6, y: y - 28, width: 22, height: 22, color: C.gold });
        const nw = bold.widthOfTextAtSize(numStr, 10);
        p.drawText(numStr, { x: MARGIN_X + 6 + (22 - nw) / 2, y: y - 20, size: 10, font: bold, color: C.deepGreen });

        // Title
        p.drawText(safeText(strat.title).slice(0, 55), { x: MARGIN_X + 36, y: y - 16, size: 10, font: bold, color: C.deepGreen });
        if (si === 0) {
          p.drawRectangle({ x: MARGIN_X + CONTENT_W - 70, y: y - 22, width: 64, height: 16, color: C.gold });
          p.drawText(T("RECOMMENDED", "RECOMENDADO"), { x: MARGIN_X + CONTENT_W - 66, y: y - 15, size: 7, font: bold, color: C.deepGreen });
        }

        // Viability bar
        p.drawText(T("Viability:", "Viabilidad:"), { x: MARGIN_X + 36, y: y - 30, size: 7.5, font: bold, color: C.textMuted });
        const barMaxW = 120;
        p.drawRectangle({ x: MARGIN_X + 85, y: y - 35, width: barMaxW, height: 8, color: C.border });
        const barFillColor = strat.viability >= 7 ? C.accentGreen : strat.viability >= 5 ? C.accentOrange : C.accentRed;
        p.drawRectangle({ x: MARGIN_X + 85, y: y - 35, width: barMaxW * strat.viability / 10, height: 8, color: barFillColor });
        p.drawText(`${strat.viability}/10`, { x: MARGIN_X + 210, y: y - 34, size: 7.5, font: bold, color: barFillColor });

        // Description
        const descLines = wrapText(strat.desc, regular, 8, CONTENT_W - 50).slice(0, 2);
        let dy = y - 46;
        for (const line of descLines) {
          p.drawText(line, { x: MARGIN_X + 36, y: dy, size: 8, font: regular, color: C.textPrimary });
          dy -= 12;
        }

        // Spanish translation (italic)
        const esLines = wrapText(strat.descEs, italic, 7.5, CONTENT_W - 50).slice(0, 1);
        for (const line of esLines) {
          p.drawText(line, { x: MARGIN_X + 36, y: dy, size: 7.5, font: italic, color: C.textSecond });
          dy -= 12;
        }

        y -= pathCardH + 8;
      }

      // Alternative names section
      if (y > MARGIN_BOT + 80) {
        y -= 4;
        p.drawText(T("SUGGESTED ALTERNATIVES / ALTERNATIVAS SUGERIDAS", "ALTERNATIVAS SUGERIDAS / SUGGESTED ALTERNATIVES"), { x: MARGIN_X, y, size: 7.5, font: bold, color: C.gold });
        y -= 12;
        const alts = generateAlternatives(markName, result);
        const altW = (CONTENT_W - 16) / 3;
        for (let ai = 0; ai < Math.min(alts.length, 3); ai++) {
          const ax = MARGIN_X + ai * (altW + 8);
          drawCard(p, ax, y, altW, 62);
          const alt = alts[ai];
          p.drawText(safeText(alt.name).slice(0, 16).toUpperCase(), { x: ax + 8, y: y - 16, size: 12, font: bold, color: C.deepGreen });
          const typeW = regular.widthOfTextAtSize(alt.type, 7) + 8;
          p.drawRectangle({ x: ax + 8, y: y - 30, width: typeW, height: 12, color: C.accentGreen });
          p.drawText(alt.type, { x: ax + 12, y: y - 23, size: 7, font: bold, color: C.white });
          const reasonLines = wrapText(alt.reason, regular, 7, altW - 16).slice(0, 2);
          let ary = y - 44;
          for (const rl of reasonLines) {
            p.drawText(rl, { x: ax + 8, y: ary, size: 7, font: regular, color: C.textSecond });
            ary -= 10;
          }
          p.drawText(T("? Search this name", "? Buscar este nombre"), { x: ax + 8, y: y - 58, size: 6.5, font: italic, color: C.gold });
        }
        y -= 74;
      }

      // IMPI Cost & Timeline card
      if (y > MARGIN_BOT + 80) {
        y -= 4;
        const tlH = 104;
        p.drawRectangle({ x: MARGIN_X, y: y - tlH, width: CONTENT_W, height: tlH, color: C.deepGreen });
        p.drawRectangle({ x: MARGIN_X, y: y - tlH, width: CONTENT_W, height: 2, color: C.gold });
        p.drawText(T("FILING TIMELINE & OFFICIAL FEES", "CRONOGRAMA DE TRAMITE Y CUOTAS OFICIALES"), { x: MARGIN_X + 16, y: y - 18, size: 10, font: bold, color: C.white });
        p.drawRectangle({ x: MARGIN_X + 16, y: y - 26, width: CONTENT_W - 32, height: 0.8, color: C.gold });
        const timelineItems = [
          T("12-18 months typical registration timeline", "12-18 meses plazo tipico de registro"),
          T("USD $170 IMPI official filing fee per class", "USD $170 cuota oficial IMPI de presentacion por clase"),
          T("1-month opposition window after publication in Gazette", "Ventana de oposicion de 1 mes tras publicacion en Gaceta"),
          T("Territory: Mexico (IMPI)", "Territorio: Mexico (IMPI)"),
        ];
        let ty = y - 40;
        for (const item of timelineItems) {
          p.drawText(safeText(item), { x: MARGIN_X + 24, y: ty, size: 8.5, font: regular, color: rgb(0.85, 0.9, 0.85) });
          ty -= 14;
        }
        p.drawRectangle({ x: MARGIN_X + 16, y: y - tlH + 22, width: CONTENT_W - 32, height: 0.6, color: rgb(0.4, 0.6, 0.4) });
        p.drawText(T("MexicoTrademarkCenter Filing Service: from USD $299  |  Includes: preparation, filing, prosecution, reporting", "Servicio de registro MexicoTrademarkCenter: desde USD $299  |  Incluye: preparacion, presentacion, gestion, reportes"), { x: MARGIN_X + 16, y: y - tlH + 11, size: 7.5, font: regular, color: C.gold });
        y -= tlH + 8;
      }
    }

    // ── NICE CLASSIFICATION (if present) ───────────────────────────────
    if (niceClasses.length > 0) {
      let p = newPage("Nice Classification");
      drawPageBackground(p);
      addRunningHeader(p, regular, bold, markName, niceClasses);
      let y = PAGE_H - 26 - 8;
      y = addSectionHeader(p, bold,
        T("NICE CLASSIFICATION", "CLASIFICACION NIZA"),
        T("International trademark classification details", "Detalles de clasificacion internacional de marca"),
        y,
      );
      y -= 10;

      for (const nc of niceClasses) {
        if (y < MARGIN_BOT + 80) {
          p = newPage("Nice Classification (cont.)");
          drawPageBackground(p);
          addRunningHeader(p, regular, bold, markName, niceClasses);
          y = PAGE_H - 26 - MARGIN_TOP + 26;
        }
        const className = useEnglish ? (nc.className_en || nc.className) : nc.className;
        const officialHeading = useEnglish ? (nc.officialHeading_en || nc.officialHeading) : nc.officialHeading;
        const items = useEnglish ? (nc.relevantItems_en?.length ? nc.relevantItems_en : nc.relevantItems) : nc.relevantItems;

        p.drawRectangle({ x: MARGIN_X, y: y - 32, width: 44, height: 36, color: C.deepGreen });
        const cnStr = String(nc.classNumber);
        const cnW = bold.widthOfTextAtSize(cnStr, 16);
        p.drawText(cnStr, { x: MARGIN_X + (44 - cnW) / 2, y: y - 20, size: 16, font: bold, color: C.gold });
        p.drawText(safeText(className), { x: MARGIN_X + 52, y: y - 12, size: 10.5, font: bold, color: C.deepGreen });
        p.drawText(safeText(officialHeading).slice(0, 80), { x: MARGIN_X + 52, y: y - 26, size: 7.5, font: regular, color: C.textSecond });
        y -= 42;
        p.drawRectangle({ x: MARGIN_X + 52, y, width: CONTENT_W - 52, height: 1, color: C.gold });
        y -= 12;

        for (const item of items.slice(0, 10)) {
          if (y < MARGIN_BOT) break;
          p.drawRectangle({ x: MARGIN_X + 4, y: y - 3, width: 4, height: 4, color: C.gold });
          y = drawWrappedText(p, safeText(item), MARGIN_X + 14, y, regular, 8.5, CONTENT_W - 14, C.textPrimary, 13);
          y -= 2;
        }
        y -= 16;
      }
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // Render sections
  // ════════════════════════════════════════════════════════════════════
  const searchLangTyped = (result.searchLanguage ?? "en") as Lang;
  if (isBilingual) {
    renderAllSections(searchLangTyped, false);

    // Divider page
    const dp = newPage("Language Divider");
    dp.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.deepGreen });
    const divLabel = "ENGLISH VERSION";
    const divW = bold.widthOfTextAtSize(divLabel, 22);
    dp.drawText(divLabel, { x: (PAGE_W - divW) / 2, y: PAGE_H / 2 + 10, size: 22, font: bold, color: C.gold });
    const subLabel = "MexicoTrademarkCenter.com";
    const subW = regular.widthOfTextAtSize(subLabel, 11);
    dp.drawText(subLabel, { x: (PAGE_W - subW) / 2, y: PAGE_H / 2 - 18, size: 11, font: regular, color: rgb(0.6, 0.75, 0.65) });

    renderAllSections("en", true);
  } else {
    renderAllSections("en", true);
  }

  // ════════════════════════════════════════════════════════════════════
  // FINAL PAGE — DISCLAIMER & BRANDING
  // ════════════════════════════════════════════════════════════════════
  {
    const p = newPage("Disclaimer");
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.deepGreen });

    // Logo centered top
    p.drawText("MEXICO TRADEMARK CENTER", { x: (PAGE_W - bold.widthOfTextAtSize("MEXICO TRADEMARK CENTER", 14)) / 2, y: PAGE_H - 60, size: 14, font: bold, color: C.white });
    p.drawText("MexicoTrademarkCenter.com", { x: (PAGE_W - regular.widthOfTextAtSize("MexicoTrademarkCenter.com", 10)) / 2, y: PAGE_H - 80, size: 10, font: regular, color: C.gold });

    // White disclaimer card
    const cardX = MARGIN_X;
    const cardW = CONTENT_W;
    const cardY = PAGE_H - 110;
    const cardH = 440;
    p.drawRectangle({ x: cardX, y: cardY - cardH, width: cardW, height: cardH, color: C.cardWhite });

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

    let dy = cardY - 20;
    p.drawText("DISCLAIMER", { x: cardX + 20, y: dy, size: 9, font: bold, color: C.deepGreen });
    dy -= 6;
    p.drawRectangle({ x: cardX + 20, y: dy, width: cardW - 40, height: 1, color: C.gold });
    dy -= 14;

    for (const line of disclaimerEN) {
      if (!line) { dy -= 8; continue; }
      p.drawText(line, { x: cardX + 20, y: dy, size: 8.5, font: regular, color: C.textPrimary });
      dy -= 13;
    }

    dy -= 8;
    p.drawRectangle({ x: cardX + 20, y: dy, width: cardW - 40, height: 0.8, color: C.gold });
    dy -= 14;

    p.drawText("AVISO LEGAL", { x: cardX + 20, y: dy, size: 9, font: bold, color: C.deepGreen });
    dy -= 14;

    for (const line of disclaimerES) {
      if (!line) { dy -= 8; continue; }
      p.drawText(line, { x: cardX + 20, y: dy, size: 8.5, font: italic, color: C.textSecond });
      dy -= 13;
    }

    // Bottom metadata
    const metaStr = `Report generated: ${timestamp}${purchaserEmail ? ` | Prepared for: ${purchaserEmail}` : ""}`;
    const meta2Str = "MexicoTrademarkCenter.com  |  Independent Trademark Filing Services for Mexico";
    p.drawText(safeText(metaStr).slice(0, 80), { x: (PAGE_W - regular.widthOfTextAtSize(safeText(metaStr).slice(0, 80), 7.5)) / 2, y: 54, size: 7.5, font: regular, color: C.gold });
    p.drawText(meta2Str, { x: (PAGE_W - regular.widthOfTextAtSize(meta2Str, 7.5)) / 2, y: 40, size: 7.5, font: regular, color: rgb(0.6, 0.75, 0.65) });
  }

  // ── Apply running headers + footers to all body pages ─────────────
  const totalPages = pages.length;
  for (let i = 0; i < pages.length; i++) {
    const sn = sectionNames[i];
    // Skip cover (0) and final disclaimer page — they have their own style
    if (i === 0 || sn === "Disclaimer" || sn === "Language Divider") continue;
    addRunningHeader(pages[i], regular, bold, markName, niceClasses);
    addRunningFooter(pages[i], regular, markName, sn, i + 1, totalPages);
  }

  // Set PDF metadata / filename hint
  pdfDoc.setTitle(`TrademarkClearance-${safeMarkName}-Class${classNum}-${dateStr}`);
  pdfDoc.setAuthor("MexicoTrademarkCenter.com");
  pdfDoc.setSubject("Trademark Clearance Report");
  pdfDoc.setCreator("MexicoTrademarkCenter AI Analysis System");

  return pdfDoc.save();
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const DUPONT_EN: Record<string, string> = {
  similarity_of_marks: "Similarity of the Marks",
  strength_of_marks: "Strength / Fame of the Marks",
  similarity_of_goods: "Similarity of Goods/Services",
  channels_of_trade: "Channels of Trade",
  conditions_of_purchase: "Conditions of Purchase",
  actual_confusion: "Evidence of Actual Confusion",
  concurrent_use: "Length of Concurrent Use Without Confusion",
  variety_of_goods: "Variety of Goods on which Mark is Used",
  market_interface: "Market Interface / Nature of Prior Mark's Use",
  applicant_bad_faith: "Applicant's Bad Faith Intent",
  sophistication_of_buyers: "Sophistication of Buyers / Consumers",
  number_of_similar_marks: "Number of Similar Marks in Field",
  extent_of_potential_confusion: "Extent / Nature of Potential Confusion",
};

const CATEGORY_EN: Record<string, string> = {
  descriptiveness: "Descriptiveness (Art. 173 Fr. II LFPPI)",
  genericness: "Genericness (Art. 173 Fr. I LFPPI)",
  deceptiveness: "Deceptiveness (Art. 173 Fr. III LFPPI)",
  geographic: "Geographic Indicator (Art. 173 Fr. IV LFPPI)",
  official_signs: "Official Signs / Emblems (Art. 173 Fr. VI LFPPI)",
  surname: "Common Surname (Art. 173 Fr. V LFPPI)",
  confusing_similarity: "Confusing Similarity (Art. 173 Fr. XVIII LFPPI)",
  prior_registration: "Prior Registration Conflict (Art. 173 Fr. XVI LFPPI)",
  notorious_mark: "Notorious / Well-Known Mark (Art. 173 Fr. XV LFPPI)",
  public_order: "Public Order / Morality (Art. 173 Fr. VII LFPPI)",
  color_alone: "Color Alone (Art. 173 Fr. XI LFPPI)",
  flag_or_symbol: "National Flag / Symbol (Art. 173 Fr. VIII LFPPI)",
};

function getLfppiRef(category: string): string {
  const refs: Record<string, string> = {
    descriptiveness: "Art. 173 Fr. II LFPPI",
    genericness: "Art. 173 Fr. I LFPPI",
    deceptiveness: "Art. 173 Fr. III LFPPI",
    geographic: "Art. 173 Fr. IV LFPPI",
    official_signs: "Art. 173 Fr. VI LFPPI",
    surname: "Art. 173 Fr. V LFPPI",
    confusing_similarity: "Art. 173 Fr. XVIII LFPPI",
    prior_registration: "Art. 173 Fr. XVI LFPPI",
    notorious_mark: "Art. 173 Fr. XV LFPPI",
    public_order: "Art. 173 Fr. VII LFPPI",
    color_alone: "Art. 173 Fr. XI LFPPI",
    flag_or_symbol: "Art. 173 Fr. VIII LFPPI",
  };
  return refs[category] ?? "Art. 173 LFPPI";
}

const PASSED_GROUNDS_EN = [
  { key: "descriptiveness", label: "Not purely descriptive of goods/services" },
  { key: "genericness", label: "Not a generic term for the goods/services" },
  { key: "deceptiveness", label: "Not deceptive as to nature, quality or origin" },
  { key: "geographic", label: "Not primarily merely a geographic term" },
  { key: "official_signs", label: "Does not reproduce official signs or emblems" },
  { key: "surname", label: "Not primarily merely a surname" },
  { key: "public_order", label: "Does not violate public order or morality" },
  { key: "color_alone", label: "Not a single color without distinctive form" },
];

function isHighSimilarity(f: MarciaFinding, markName: string): boolean {
  const nameMatch = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
  if (f.similarityScore !== undefined) return f.similarityScore >= 80;
  return nameMatch;
}

function isMedSimilarity(f: MarciaFinding, markName: string): boolean {
  const n = f.name.toLowerCase().trim();
  const m = markName.toLowerCase().trim();
  if (f.similarityScore !== undefined) return f.similarityScore >= 50 && f.similarityScore < 80;
  const hasCommonStart = n.slice(0, 3) === m.slice(0, 3) && n !== m;
  return hasCommonStart;
}

function buildKeyFindings(result: ClearanceResult, useEnglish: boolean): Array<{ title: string; desc: string; dataPoint: string; color: ReturnType<typeof rgb> }> {
  const findings: Array<{ title: string; desc: string; dataPoint: string; color: ReturnType<typeof rgb> }> = [];
  const T = (en: string, es: string) => useEnglish ? en : es;

  const marciaFindings = result.marciaFindings ?? [];
  const topConflict = marciaFindings[0];
  if (topConflict) {
    const sim = topConflict.similarityScore ?? (topConflict.name.toLowerCase() === (result.riskSummary ?? "").toLowerCase().slice(0, topConflict.name.length) ? 92 : 75);
    findings.push({
      title: T("Registry Conflict", "Conflicto Registral"),
      desc: T(`Mark "${topConflict.name}" found in IMPI MARCia Class ${topConflict.classNum}. Direct registration obstacle.`, `Marca "${topConflict.name}" encontrada en IMPI MARCia Clase ${topConflict.classNum}. Obstaculo directo al registro.`),
      dataPoint: `${sim}% — ${safeText(topConflict.name).slice(0, 16)}${topConflict.expediente ? ` Exp.${topConflict.expediente}` : ""}`,
      color: C.accentRed,
    });
  }

  const flags = result.registrabilityFlags ?? [];
  const highFlag = flags.find(f => f.severity === "high");
  if (highFlag) {
    findings.push({
      title: T("Legal Barrier", "Barrera Legal"),
      desc: T(`${CATEGORY_EN[highFlag.category] ?? highFlag.category} identified under LFPPI. Must be addressed before filing.`, `${CATEGORY_EN[highFlag.category] ?? highFlag.category} identificado bajo LFPPI. Debe resolverse antes de presentar.`),
      dataPoint: getLfppiRef(highFlag.category),
      color: C.accentOrange,
    });
  } else if (flags.length > 0) {
    findings.push({
      title: T("Registrability Flag", "Indicador de Registrabilidad"),
      desc: T(`${flags.length} registrability issue(s) identified under LFPPI analysis. Review recommended.`, `${flags.length} problema(s) de registrabilidad identificado(s) bajo LFPPI. Se recomienda revision.`),
      dataPoint: getLfppiRef(flags[0].category),
      color: C.accentOrange,
    });
  }

  const dist = result.distinctiveness;
  if (dist) {
    const tierOk = dist.tier === "arbitrary" || dist.tier === "fanciful";
    findings.push({
      title: T("Distinctiveness", "Distintividad"),
      desc: T(
        `Mark classified as ${dist.tier} (${dist.score}/5). ${tierOk ? "Strong distinctiveness supports registration." : "Low distinctiveness increases refusal risk."}`,
        `Marca clasificada como ${dist.tier} (${dist.score}/5). ${tierOk ? "Alta distintividad favorece el registro." : "Baja distintividad aumenta el riesgo de rechazo."}`,
      ),
      dataPoint: T(`Score: ${dist.score}/5 — ${dist.tier}`, `Puntuacion: ${dist.score}/5 — ${dist.tier}`),
      color: tierOk ? C.accentGreen : C.accentOrange,
    });
  }

  return findings;
}

function buildStrategies(result: ClearanceResult, markName: string, useEnglish: boolean): Array<{ title: string; desc: string; descEs: string; viability: number }> {
  const strategies: Array<{ title: string; desc: string; descEs: string; viability: number }> = [];
  const dist = result.distinctiveness;
  const tier = dist?.tier ?? "arbitrary";
  const risk = result.risk;

  if (risk === "low" || tier === "arbitrary" || tier === "fanciful") {
    strategies.push({
      title: useEnglish ? "Path 1: File As-Is — Recommended" : "Opcion 1: Presentar Tal Cual — Recomendado",
      desc: `The mark "${safeText(markName)}" demonstrates sufficient distinctiveness for filing as-is. Proceed with IMPI application supported by evidence of use if available. Timeline: 12-18 months.`,
      descEs: `La marca "${safeText(markName)}" demuestra suficiente distintividad para presentarse tal cual. Proceda con la solicitud ante el IMPI con evidencia de uso si esta disponible. Plazo: 12-18 meses.`,
      viability: 8,
    });
  }

  if (risk === "high" || tier === "descriptive" || tier === "generic") {
    strategies.push({
      title: useEnglish ? "Path 1: Reformulate with Coined Element — Recommended" : "Opcion 1: Reformular con Elemento Acunado — Recomendado",
      desc: `Create a more distinctive version by adding a fanciful or coined prefix/suffix to the mark. This eliminates Fr. XVIII LFPPI confusing similarity issues and improves registrability score significantly.`,
      descEs: `Cree una version mas distintiva agregando un prefijo/sufijo de fantasia o acunado a la marca. Esto elimina problemas de similitud confusoria bajo Fr. XVIII LFPPI y mejora significativamente el puntaje de registrabilidad.`,
      viability: 8,
    });
  } else if (risk === "medium") {
    strategies.push({
      title: useEnglish ? "Path 2: File with Disclaimer — Alternative" : "Opcion 2: Presentar con Disclaimer — Alternativa",
      desc: "File the application with a disclaimer of exclusivity over any descriptive elements. This approach can overcome objections related to descriptiveness while preserving the composite mark protection.",
      descEs: "Presente la solicitud con una renuncia de exclusividad sobre elementos descriptivos. Este enfoque puede superar objeciones por descriptividad mientras preserva la proteccion de la marca compuesta.",
      viability: 6,
    });
  }

  strategies.push({
    title: useEnglish ? "Path 3: Seek Coexistence Agreement" : "Opcion 3: Buscar Acuerdo de Coexistencia",
    desc: "Engage with holders of conflicting marks to negotiate a coexistence agreement. This is particularly effective when the conflicting marks operate in distinct geographic or product sub-markets.",
    descEs: "Contacte a los titulares de marcas conflictivas para negociar un acuerdo de coexistencia. Esto es particularmente efectivo cuando las marcas conflictivas operan en sub-mercados geograficos o de productos distintos.",
    viability: 4,
  });

  return strategies.slice(0, 3);
}

function generateAlternatives(markName: string, result: ClearanceResult): Array<{ name: string; type: string; reason: string }> {
  const safe = safeText(markName).toUpperCase().replace(/[^A-Z]/g, "");
  const prefix = safe.slice(0, Math.min(safe.length, 4));
  const suffix = safe.slice(Math.max(0, safe.length - 3));
  const dist = result.distinctiveness?.tier ?? "suggestive";
  const isFanciful = dist === "fanciful" || dist === "arbitrary";

  return [
    {
      name: `${prefix}IX`,
      type: isFanciful ? "Fanciful" : "Arbitrary",
      reason: "Coined suffix creates new fanciful word with no prior meaning, maximizing distinctiveness under Art. 173 LFPPI.",
    },
    {
      name: `NEO${suffix}`,
      type: "Arbitrary",
      reason: "Arbitrary prefix adds a distinctive element while preserving brand recognition and avoiding existing conflicts.",
    },
    {
      name: `${prefix}NOVA`,
      type: "Suggestive",
      reason: "Suggestive combination suggests innovation without being purely descriptive, balancing distinctiveness and meaning.",
    },
  ];
}

function getAxisInterpretation(label: string, score: number, useEnglish: boolean): string {
  const T = (en: string, es: string) => useEnglish ? en : es;
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const map: Record<string, Record<string, string>> = {
    Distinctiveness: {
      high: T("Strong mark — favorable for registration.", "Marca fuerte — favorable para el registro."),
      medium: T("Moderate strength — consider strengthening the mark.", "Fortaleza moderada — considere reforzar la marca."),
      low: T("Weak mark — high refusal risk under Art. 173 LFPPI.", "Marca debil — alto riesgo de rechazo bajo Art. 173 LFPPI."),
    },
    "DuPont Factors": {
      high: T("Most confusion factors favor registration.", "La mayoria de factores de confusion favorecen el registro."),
      medium: T("Mixed DuPont outlook — strategic filing recommended.", "Panorama DuPont mixto — se recomienda estrategia de presentacion."),
      low: T("Significant confusion factors weigh against registration.", "Factores de confusion significativos pesan en contra del registro."),
    },
    "LFPPI Grounds": {
      high: T("No significant absolute grounds for refusal detected.", "No se detectaron motivos absolutos significativos de rechazo."),
      medium: T("Some LFPPI grounds flagged — review recommended.", "Algunos motivos LFPPI detectados — se recomienda revision."),
      low: T("Multiple absolute grounds for refusal identified.", "Multiples motivos absolutos de rechazo identificados."),
    },
    "MARCia Registry": {
      high: T("Few conflicting marks found in IMPI registry.", "Pocas marcas conflictivas encontradas en el registro IMPI."),
      medium: T("Moderate number of potentially conflicting marks.", "Numero moderado de marcas potencialmente conflictivas."),
      low: T("High number of conflicting marks in IMPI registry.", "Alto numero de marcas conflictivas en el registro IMPI."),
    },
    "Trans. Analysis": {
      high: T("No problematic translations or transliterations detected.", "Sin traducciones o transliteraciones problematicas detectadas."),
      medium: T("Some translation risks identified across languages.", "Algunos riesgos de traduccion identificados en varios idiomas."),
      low: T("Significant translation conflicts detected.", "Conflictos de traduccion significativos detectados."),
    },
  };
  return map[label]?.[level] ?? "";
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
      order.purchaser_email ?? undefined,
    );

    await supabase.storage.createBucket("clearance-reports", { public: false }).catch(() => {/* exists */});

    // Use descriptive filename
    const safeMark = safeText(order.mark_name).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
    const result = order.clearance_result as ClearanceResult;
    const classes = result?.niceClassification ?? [];
    const classNum = classes.length > 0 ? String(classes[0].classNumber) : "X";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `TrademarkClearance-${safeMark}-Class${classNum}-${dateStr}.pdf`;
    const storagePath = `${reportOrderId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("clearance-reports")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      // Fallback to simple path
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
