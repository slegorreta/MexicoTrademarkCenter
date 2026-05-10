import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  darkGreen: rgb(0.102, 0.18, 0.102),   // #1a2e1a
  gold: rgb(0.788, 0.659, 0.298),        // #c9a84c
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.92, 0.92, 0.90),
  red: rgb(0.78, 0.18, 0.18),
  amber: rgb(0.85, 0.55, 0.1),
  green: rgb(0.15, 0.55, 0.15),
  blue: rgb(0.1, 0.35, 0.7),
};

const PAGE_W = 612;  // US Letter
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Types ───────────────────────────────────────────────────────────────────
interface DupontFactor { factor: string; verdict: string; reasoning: string; }
interface DistinctivenessAssessment { tier: string; score: number; explanation: string; }
interface RegistrabilityFlag { category: string; severity: string; explanation: string; }
interface MarciaFinding { name: string; status: string; classNum: string; holder: string; }
interface DomainResult { domain: string; status: string; }

interface ClearanceResult {
  risk: "low" | "medium" | "high";
  riskSummary?: string;
  distinctiveness?: DistinctivenessAssessment;
  dupont?: DupontFactor[];
  registrabilityFlags?: RegistrabilityFlag[];
  marciaFindings?: MarciaFinding[];
  marciaTotalCount?: number;
  marciaUrl?: string;
  webFindings?: string[];
  domainResults?: DomainResult[];
  disclaimer?: string;
}

// ─── Label maps ──────────────────────────────────────────────────────────────
const DUPONT_EN: Record<string, string> = {
  similarity_of_marks: "Similarity of Marks",
  relatedness_of_goods: "Relatedness of Goods/Services",
  channels_of_trade: "Channels of Trade",
  purchasing_conditions: "Purchaser Sophistication",
  strength_of_cited_mark: "Strength of Cited Mark",
  actual_confusion: "Actual Confusion",
  number_of_similar_marks: "Crowding of Similar Marks",
  length_of_use: "Length of Use",
  variety_of_goods: "Variety of Goods Covered",
  market_interface: "Market Interface / Consent",
  right_to_exclude: "Right to Exclude Others",
  extent_of_confusion: "Extent of Potential Confusion",
  other_factors: "Other Relevant Factors",
};

const CATEGORY_EN: Record<string, string> = {
  generic_descriptive: "Generic or Descriptive",
  functional_shape: "Functional Shape",
  deceptive: "Deceptive or Misleading",
  official_emblems: "Official Emblems / Flags",
  personal_identity: "Personal Identity Without Consent",
  confusingly_similar: "Confusingly Similar to Existing Mark",
  famous_mark: "Famous or Notorious Mark",
  protected_characters: "Protected Characters / Titles",
  geographic_indication: "Protected Geographic Indication",
  immoral_offensive: "Contrary to Public Order / Morality",
  isolated_color: "Isolated Color (Not Distinctive)",
  non_distinctive_nontrad: "Non-Distinctive Non-Traditional Mark",
  bad_faith: "Bad Faith Filing",
};

// ─── Text helpers ─────────────────────────────────────────────────────────────

// Helvetica (WinAnsi encoding) cannot render characters outside Latin-1 supplement.
// Normalize to closest ASCII equivalent to prevent pdf-lib from throwing.
function safeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '?')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
    .replace(/[()[\]]/g, ' ')
    .replace(/  +/g, ' ')
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
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color = C.black,
  lineHeight = size * 1.5,
): number {
  const lines = wrapText(safeText(text), font, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

// ─── Page scaffold ────────────────────────────────────────────────────────────

function addFooter(page: PDFPage, font: PDFFont, orderId: string, pageNum: number, totalPages: number, timestamp: string) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_W - MARGIN, y: 42 }, thickness: 0.5, color: C.lightGray });
  page.drawText(`Mexico Trademark Center | NOT LEGAL ADVICE | Order: ${shortId} | ${timestamp}`, { x: MARGIN, y: 28, size: 7, font, color: C.gray });
  page.drawText(`Page ${pageNum} of ${totalPages}`, { x: PAGE_W - MARGIN - 48, y: 28, size: 7, font, color: C.gray });
}

function addSectionHeader(page: PDFPage, bold: PDFFont, title: string, y: number): number {
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 22, color: C.darkGreen });
  page.drawText(title.toUpperCase(), { x: MARGIN + 10, y: y + 3, size: 9, font: bold, color: C.gold });
  return y - 32;
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

async function buildPdf(
  markName: string,
  goodsServices: string,
  orderId: string,
  result: ClearanceResult,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const shortId = orderId.slice(0, 8).toUpperCase();
  const riskColor = result.risk === "high" ? C.red : result.risk === "medium" ? C.amber : C.green;
  const riskLabel = result.risk === "high" ? "HIGH RISK" : result.risk === "medium" ? "MEDIUM RISK" : "LOW RISK";

  // We'll collect pages then add footers at the end
  const pages: PDFPage[] = [];

  const newPage = () => {
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(p);
    return p;
  };

  // ── PAGE 1: Cover ──────────────────────────────────────────────────────────
  {
    const p = newPage();
    // Dark header band
    p.drawRectangle({ x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: C.darkGreen });
    p.drawText("MEXICO TRADEMARK CENTER", { x: MARGIN, y: PAGE_H - 60, size: 11, font: bold, color: C.gold });
    p.drawText("TRADEMARK CLEARANCE REPORT", { x: MARGIN, y: PAGE_H - 88, size: 22, font: bold, color: C.white });
    p.drawText("AI-Assisted Preliminary Clearance Analysis", { x: MARGIN, y: PAGE_H - 112, size: 11, font: regular, color: rgb(0.75, 0.85, 0.75) });

    // Gold rule
    p.drawRectangle({ x: MARGIN, y: PAGE_H - 208, width: CONTENT_W, height: 3, color: C.gold });

    let y = PAGE_H - 260;

    // Mark name box
    p.drawRectangle({ x: MARGIN, y: y - 40, width: CONTENT_W, height: 60, color: C.lightGray, borderColor: C.gold, borderWidth: 1 });
    p.drawText("PROPOSED TRADEMARK", { x: MARGIN + 16, y: y + 4, size: 8, font: bold, color: C.gray });
    p.drawText(safeText(markName).slice(0, 60), { x: MARGIN + 16, y: y - 18, size: 20, font: bold, color: C.darkGreen });
    y -= 72;

    // Goods/services
    if (goodsServices) {
      p.drawText("GOODS / SERVICES COVERED", { x: MARGIN, y, size: 8, font: bold, color: C.gray });
      y -= 16;
      y = drawWrappedText(p, goodsServices.slice(0, 300), MARGIN, y, regular, 11, CONTENT_W, C.black) + 4;
    }

    y -= 20;

    // Risk badge
    p.drawRectangle({ x: MARGIN, y: y - 28, width: 140, height: 40, color: riskColor });
    p.drawText("OVERALL RISK LEVEL", { x: MARGIN + 10, y: y - 8, size: 7, font: bold, color: C.white });
    p.drawText(riskLabel, { x: MARGIN + 10, y: y - 22, size: 13, font: bold, color: C.white });

    y -= 64;

    // Meta table
    const metaRows = [
      ["Report Generated", timestamp],
      ["Order Reference", shortId],
      ["Report Type", "AI-Assisted Preliminary Clearance"],
    ];
    for (const [label, val] of metaRows) {
      p.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: C.gray });
      p.drawText(val, { x: MARGIN + 160, y, size: 9, font: regular, color: C.black });
      y -= 18;
    }
  }

  // ── PAGE 2: Disclaimer ─────────────────────────────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;

    y = addSectionHeader(p, bold, "Important Disclaimer", y);
    y -= 10;

    const disclaimerText = [
      "NOT LEGAL ADVICE - This report is generated by artificial intelligence and is provided for informational purposes only. It does not constitute legal advice, a formal trademark clearance opinion, or an attorney-client relationship.",
      "",
      "PRELIMINARY SCREENING ONLY - The analysis contained in this report is a preliminary automated screening. It is not a substitute for a comprehensive clearance search conducted by a qualified trademark attorney.",
      "",
      "AI LIMITATIONS - Artificial intelligence systems may produce incomplete, inaccurate, or outdated information. The trademark landscape changes continuously as new marks are filed and registered. This report reflects conditions at the time of generation.",
      "",
      "IMPI DATABASE - MARCia database results are sourced directly from the Instituto Mexicano de la Propiedad Industrial (IMPI) public database. Mexico Trademark Center does not guarantee the completeness or accuracy of this data.",
      "",
      "DUPONT ANALYSIS - The DuPont likelihood-of-confusion analysis applies the 13 factors from In re E.I. DuPont DeNemours & Co. (1973) as adapted for Mexican trademark law context. Results are AI-generated assessments and not legal conclusions.",
      "",
      "CONSULT AN ATTORNEY - Before filing any trademark application, you should consult with a qualified trademark attorney licensed in Mexico and/or the relevant jurisdiction. Mexico Trademark Center offers professional trademark filing services.",
      "",
      "Contact: tm@mexicotrademarkcenter.com | mexicotrademarkcenter.com",
    ];

    for (const para of disclaimerText) {
      if (!para) { y -= 10; continue; }
      y = drawWrappedText(p, para, MARGIN, y, regular, 10, CONTENT_W, C.black, 16);
      y -= 4;
    }
  }

  // ── PAGE 3: Executive Summary ──────────────────────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;

    y = addSectionHeader(p, bold, "Executive Summary", y);
    y -= 10;

    // Risk level banner
    p.drawRectangle({ x: MARGIN, y: y - 28, width: CONTENT_W, height: 40, color: riskColor });
    p.drawText("OVERALL RISK LEVEL", { x: MARGIN + 16, y: y - 8, size: 8, font: bold, color: C.white });
    p.drawText(riskLabel, { x: MARGIN + 16, y: y - 22, size: 14, font: bold, color: C.white });
    y -= 56;

    // Risk summary paragraph
    if (result.riskSummary) {
      p.drawText("Risk Assessment Summary", { x: MARGIN, y, size: 11, font: bold, color: C.darkGreen });
      y -= 20;
      y = drawWrappedText(p, result.riskSummary, MARGIN, y, regular, 11, CONTENT_W, C.black);
      y -= 10;
    }

    // Quick scorecard
    y -= 10;
    p.drawText("Quick Scorecard", { x: MARGIN, y, size: 11, font: bold, color: C.darkGreen });
    y -= 20;

    const scoreItems: Array<[string, string]> = [];
    if (result.distinctiveness) {
      scoreItems.push(["Distinctiveness Tier", result.distinctiveness.tier.charAt(0).toUpperCase() + result.distinctiveness.tier.slice(1) + ` (${result.distinctiveness.score}/5)`]);
    }
    if (result.dupont) {
      const favor = result.dupont.filter(f => f.verdict === "favors_registration").length;
      const against = result.dupont.filter(f => f.verdict === "against_registration").length;
      const neutral = result.dupont.filter(f => f.verdict === "neutral").length;
      scoreItems.push(["DuPont Outlook (13 factors)", `${favor} favoring | ${neutral} neutral | ${against} against`]);
    }
    if (result.registrabilityFlags !== undefined) {
      const high = result.registrabilityFlags.filter(f => f.severity === "high").length;
      const med = result.registrabilityFlags.filter(f => f.severity === "medium").length;
      scoreItems.push(["LFPPI Registrability Issues", result.registrabilityFlags.length === 0 ? "None detected" : `${result.registrabilityFlags.length} issue(s) - ${high} high, ${med} medium severity`]);
    }
    scoreItems.push(["IMPI MARCia Matches", String(result.marciaTotalCount ?? result.marciaFindings?.length ?? 0)]);

    for (const [label, val] of scoreItems) {
      p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 26, color: C.lightGray });
      p.drawText(label, { x: MARGIN + 10, y: y - 4, size: 9, font: bold, color: C.darkGreen });
      p.drawText(val, { x: MARGIN + 10, y: y - 15, size: 9, font: regular, color: C.black });
      y -= 32;
    }
  }

  // ── PAGE 4: Distinctiveness ────────────────────────────────────────────────
  if (result.distinctiveness) {
    const p = newPage();
    let y = PAGE_H - MARGIN;
    const d = result.distinctiveness;

    y = addSectionHeader(p, bold, "Section 1 - Distinctiveness Assessment", y);
    y -= 10;

    // Spectrum bar (text-based)
    const tiers = ["Generic", "Descriptive", "Suggestive", "Arbitrary", "Fanciful"];
    const tierColors = [C.red, C.amber, rgb(0.8, 0.6, 0.1), C.green, C.darkGreen];
    const tierW = CONTENT_W / 5;
    for (let i = 0; i < 5; i++) {
      const isActive = tiers[i].toLowerCase() === d.tier.toLowerCase();
      p.drawRectangle({ x: MARGIN + i * tierW, y: y - 24, width: tierW - 2, height: 28, color: isActive ? tierColors[i] : C.lightGray });
      const label = tiers[i].slice(0, 10);
      const lw = regular.widthOfTextAtSize(label, 8);
      p.drawText(label, { x: MARGIN + i * tierW + (tierW - lw) / 2, y: y - 12, size: 8, font: isActive ? bold : regular, color: isActive ? C.white : C.gray });
    }
    y -= 44;

    // Score bar
    p.drawText(`Distinctiveness Score: ${d.score}/5`, { x: MARGIN, y, size: 11, font: bold, color: C.darkGreen });
    y -= 18;
    p.drawRectangle({ x: MARGIN, y: y - 10, width: CONTENT_W, height: 10, color: C.lightGray });
    const scoreColor = d.score <= 1 ? C.red : d.score <= 2 ? C.amber : d.score <= 3 ? rgb(0.8, 0.6, 0.1) : d.score <= 4 ? C.green : C.darkGreen;
    p.drawRectangle({ x: MARGIN, y: y - 10, width: (d.score / 5) * CONTENT_W, height: 10, color: scoreColor });
    y -= 24;

    p.drawText("What this means:", { x: MARGIN, y, size: 10, font: bold, color: C.darkGreen });
    y -= 16;
    y = drawWrappedText(p, d.explanation || "", MARGIN, y, regular, 10, CONTENT_W, C.black);
    y -= 20;

    // Tier explanations
    const tierExplanations = [
      ["Generic", "The word is the common name for the goods/services. Virtually impossible to register."],
      ["Descriptive", "Describes a characteristic of the goods/services. Requires acquired distinctiveness (secondary meaning) to register."],
      ["Suggestive", "Suggests a quality without directly describing it. Registrable, but weaker protection."],
      ["Arbitrary", "A real word with no logical connection to the goods/services. Strong protection."],
      ["Fanciful", "An invented word with no prior meaning. Strongest possible trademark protection."],
    ];

    p.drawText("Trademark Distinctiveness Spectrum", { x: MARGIN, y, size: 10, font: bold, color: C.darkGreen });
    y -= 16;
    for (const [tier, exp] of tierExplanations) {
      const isActive = tier.toLowerCase() === d.tier.toLowerCase();
      if (isActive) {
        p.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 36, color: rgb(0.9, 0.96, 0.9) });
        p.drawText(">> " + tier + " (Your mark)", { x: MARGIN + 8, y: y + 8, size: 9, font: bold, color: C.darkGreen });
      } else {
        p.drawText("  " + tier, { x: MARGIN + 8, y: y + 8, size: 9, font: bold, color: C.gray });
      }
      y = drawWrappedText(p, "   " + exp, MARGIN + 8, y - 4, regular, 9, CONTENT_W - 16, isActive ? C.darkGreen : C.gray);
      y -= 4;
    }
  }

  // ── PAGES 5–6: DuPont Analysis ─────────────────────────────────────────────
  if (result.dupont && result.dupont.length > 0) {
    let p = newPage();
    let y = PAGE_H - MARGIN;
    y = addSectionHeader(p, bold, "Section 2 - DuPont Likelihood-of-Confusion Analysis (13 Factors)", y);
    y -= 6;
    p.drawText("Based on In re E.I. DuPont DeNemours & Co. (1973) - adapted to Mexican trademark law context.", { x: MARGIN, y, size: 8, font: regular, color: C.gray });
    y -= 24;

    for (let i = 0; i < result.dupont.length; i++) {
      const f = result.dupont[i];
      const verdictColor = f.verdict === "favors_registration" ? C.green : f.verdict === "against_registration" ? C.red : C.amber;
      const verdictLabel = f.verdict === "favors_registration" ? "FAVORS" : f.verdict === "against_registration" ? "AGAINST" : "NEUTRAL";
      const label = DUPONT_EN[f.factor] ?? f.factor;

      // Check if we need a new page
      if (y < 120) {
        p = newPage();
        y = PAGE_H - MARGIN;
        y = addSectionHeader(p, bold, "Section 2 - DuPont Analysis (continued)", y);
        y -= 10;
      }

      const rowLines = wrapText(f.reasoning || "", regular, 9, CONTENT_W - 90);
      const rowH = Math.max(38, rowLines.length * 14 + 18);

      p.drawRectangle({ x: MARGIN, y: y - rowH + 10, width: CONTENT_W, height: rowH, color: i % 2 === 0 ? C.lightGray : C.white });
      p.drawText(`${i + 1}. ${label}`, { x: MARGIN + 8, y: y - 4, size: 9, font: bold, color: C.darkGreen });
      p.drawRectangle({ x: PAGE_W - MARGIN - 60, y: y - 20, width: 56, height: 16, color: verdictColor });
      p.drawText(verdictLabel, { x: PAGE_W - MARGIN - 56, y: y - 14, size: 7, font: bold, color: C.white });

      let ry = y - 18;
      for (const line of rowLines) {
        p.drawText(line, { x: MARGIN + 8, y: ry, size: 9, font: regular, color: C.black });
        ry -= 13;
      }
      y -= rowH + 4;
    }
  }

  // ── PAGE 7: LFPPI Registrability ──────────────────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;
    y = addSectionHeader(p, bold, "Section 3 - LFPPI Registrability Analysis", y);
    y -= 8;
    p.drawText("Evaluation against Mexico's Ley Federal de Proteccion a la Propiedad Industrial (LFPPI)", { x: MARGIN, y, size: 8, font: regular, color: C.gray });
    y -= 24;

    const flags = result.registrabilityFlags ?? [];
    if (flags.length === 0) {
      p.drawRectangle({ x: MARGIN, y: y - 30, width: CONTENT_W, height: 40, color: rgb(0.9, 0.97, 0.9) });
      p.drawText("No absolute grounds for refusal detected under the LFPPI.", { x: MARGIN + 16, y: y - 8, size: 11, font: bold, color: C.green });
      p.drawText("The mark does not appear to trigger any of the 13 LFPPI absolute refusal grounds.", { x: MARGIN + 16, y: y - 22, size: 9, font: regular, color: C.green });
    } else {
      const sorted = [...flags].sort((a, b) => {
        const sv = { high: 0, medium: 1, low: 2 };
        return (sv[a.severity as "high" | "medium" | "low"] ?? 2) - (sv[b.severity as "high" | "medium" | "low"] ?? 2);
      });
      for (const flag of sorted) {
        const sColor = flag.severity === "high" ? C.red : flag.severity === "medium" ? C.amber : C.blue;
        const sLabel = flag.severity.toUpperCase();
        const catLabel = CATEGORY_EN[flag.category] ?? flag.category;
        const flagLines = wrapText(flag.explanation || "", regular, 9, CONTENT_W - 90);
        const flagH = Math.max(38, flagLines.length * 14 + 20);

        if (y - flagH < 80) break; // stop if no space (handled by footer)

        p.drawRectangle({ x: MARGIN, y: y - flagH, width: CONTENT_W, height: flagH + 4, color: rgb(0.99, 0.97, 0.96), borderColor: sColor, borderWidth: 1 });
        p.drawRectangle({ x: MARGIN, y: y - 18, width: 56, height: 18, color: sColor });
        p.drawText(sLabel, { x: MARGIN + 10, y: y - 12, size: 8, font: bold, color: C.white });
        p.drawText(catLabel, { x: MARGIN + 64, y: y - 10, size: 9, font: bold, color: C.black });

        let ry = y - 24;
        for (const line of flagLines) {
          p.drawText(line, { x: MARGIN + 8, y: ry, size: 9, font: regular, color: C.black });
          ry -= 13;
        }
        y -= flagH + 12;
      }
    }
  }

  // ── PAGE 8: Conflicting Registrations (MARCia) ────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;
    y = addSectionHeader(p, bold, "Section 4 - Conflicting Registrations (IMPI MARCia)", y);
    y -= 8;

    const total = result.marciaTotalCount ?? result.marciaFindings?.length ?? 0;
    p.drawText(`Total matches found in IMPI MARCia database: ${total}`, { x: MARGIN, y, size: 9, font: bold, color: C.darkGreen });
    if (result.marciaUrl) {
      p.drawText(`Source: ${result.marciaUrl}`, { x: MARGIN, y: y - 14, size: 8, font: regular, color: C.blue });
      y -= 14;
    }
    y -= 24;

    const findings = result.marciaFindings ?? [];
    if (findings.length === 0) {
      p.drawText("No matching marks found in the MARCia database for the searched classes.", { x: MARGIN, y, size: 10, font: regular, color: C.gray });
    } else {
      // Table header
      p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 20, color: C.darkGreen });
      p.drawText("Mark Name", { x: MARGIN + 6, y: y - 8, size: 8, font: bold, color: C.white });
      p.drawText("Class", { x: MARGIN + 230, y: y - 8, size: 8, font: bold, color: C.white });
      p.drawText("Status", { x: MARGIN + 280, y: y - 8, size: 8, font: bold, color: C.white });
      p.drawText("Holder", { x: MARGIN + 360, y: y - 8, size: 8, font: bold, color: C.white });
      y -= 26;

      for (let i = 0; i < findings.length && y > 80; i++) {
        const f = findings[i];
        const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
        p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 18, color: isExact ? rgb(0.99, 0.92, 0.92) : i % 2 === 0 ? C.lightGray : C.white });
        if (isExact) p.drawRectangle({ x: MARGIN, y: y - 14, width: 3, height: 18, color: C.red });
        p.drawText(safeText(f.name).slice(0, 32), { x: MARGIN + 6, y: y - 8, size: 8, font: isExact ? bold : regular, color: isExact ? C.red : C.black });
        p.drawText(safeText(f.classNum).slice(0, 8), { x: MARGIN + 230, y: y - 8, size: 8, font: regular, color: C.black });
        p.drawText(safeText(f.status).slice(0, 14), { x: MARGIN + 280, y: y - 8, size: 8, font: regular, color: C.black });
        p.drawText(safeText(f.holder).slice(0, 22), { x: MARGIN + 360, y: y - 8, size: 8, font: regular, color: C.black });
        y -= 20;
      }
    }
  }

  // ── PAGE 9: Web Findings ───────────────────────────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;
    y = addSectionHeader(p, bold, "Section 5 - Web Presence Findings", y);
    y -= 10;

    const webFindings = result.webFindings ?? [];
    if (webFindings.length === 0) {
      p.drawText("No significant web presence findings for this mark.", { x: MARGIN, y, size: 10, font: regular, color: C.gray });
    } else {
      for (const finding of webFindings) {
        if (y < 80) break;
        p.drawText("-", { x: MARGIN, y, size: 10, font: bold, color: C.darkGreen });
        y = drawWrappedText(p, finding, MARGIN + 14, y, regular, 10, CONTENT_W - 14, C.black);
        y -= 6;
      }
    }
  }

  // ── PAGE 10: Domain Availability ──────────────────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;
    y = addSectionHeader(p, bold, "Section 6 - Domain Availability", y);
    y -= 10;

    const domains = result.domainResults ?? [];
    if (domains.length === 0) {
      p.drawText("Domain availability check was not performed.", { x: MARGIN, y, size: 10, font: regular, color: C.gray });
    } else {
      // Table header
      p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 20, color: C.darkGreen });
      p.drawText("Domain", { x: MARGIN + 6, y: y - 8, size: 8, font: bold, color: C.white });
      p.drawText("Status", { x: MARGIN + 300, y: y - 8, size: 8, font: bold, color: C.white });
      y -= 26;

      for (let i = 0; i < domains.length && y > 80; i++) {
        const d = domains[i];
        const statusColor = d.status === "available" ? C.green : d.status === "taken" ? C.red : C.gray;
        const statusLabel = d.status === "available" ? "Available" : d.status === "taken" ? "Taken" : "Unknown";
        p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 18, color: i % 2 === 0 ? C.lightGray : C.white });
        p.drawText(safeText(d.domain), { x: MARGIN + 6, y: y - 8, size: 9, font: regular, color: C.black });
        p.drawRectangle({ x: MARGIN + 298, y: y - 14, width: 72, height: 18, color: statusColor });
        p.drawText(statusLabel, { x: MARGIN + 308, y: y - 8, size: 8, font: bold, color: C.white });
        y -= 20;
      }
    }
  }

  // ── Add footers to all pages ───────────────────────────────────────────────
  const totalPages = pages.length;
  for (let i = 0; i < pages.length; i++) {
    addFooter(pages[i], regular, orderId, i + 1, totalPages, timestamp);
  }

  return pdfDoc.save();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    // Generate PDF
    const pdfBytes = await buildPdf(
      order.mark_name,
      order.goods_services,
      order.id,
      order.clearance_result as ClearanceResult,
    );

    // Ensure storage bucket exists
    await supabase.storage.createBucket("clearance-reports", { public: false }).catch(() => {/* already exists */});

    // Upload to Storage
    const storagePath = `${reportOrderId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("clearance-reports")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to store PDF" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update order with storage path
    await supabase
      .from("clearance_report_orders")
      .update({ pdf_storage_path: storagePath })
      .eq("id", reportOrderId);

    // Send email
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
