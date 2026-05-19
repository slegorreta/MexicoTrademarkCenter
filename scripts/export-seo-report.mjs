import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, TableOfContents,
  PageBreak, Header, Footer, PageNumber, NumberFormat, convertInchesToTwip,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'SEO_Audit_Report_MexicoTrademarkCenter.docx');

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  navy:       '1B2B4B',
  gold:       'B8860B',
  lightBlue:  'E8F0FE',
  lightGold:  'FFF8E1',
  tableHead:  '1B2B4B',
  tableAlt:   'F8F9FA',
  white:      'FFFFFF',
  border:     'D0D7E2',
  green:      '2E7D32',
  amber:      'E65100',
  red:        'C62828',
  bodyText:   '1A1A2E',
  subText:    '4A5568',
  codeBack:   'F4F6F8',
};

// ─── Helper builders ───────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: C.border };
const headBorder = { style: BorderStyle.SINGLE, size: 6, color: C.navy };

function p(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 80, before: opts.spaceBefore || 0 },
    alignment: opts.align || AlignmentType.LEFT,
    ...opts,
    children: Array.isArray(runs) ? runs : [runs],
  });
}

function h(text, level, opts = {}) {
  const sizes = { 1: 40, 2: 32, 3: 26, 4: 22 };
  const colors = { 1: C.navy, 2: C.navy, 3: C.navy, 4: C.gold };
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1
            : level === 2 ? HeadingLevel.HEADING_2
            : level === 3 ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4,
    spacing: { before: level <= 2 ? 300 : 200, after: 120 },
    children: [new TextRun({
      text,
      bold: true,
      size: sizes[level],
      color: colors[level],
      font: 'Calibri',
    })],
    ...opts,
  });
}

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: opts.mono ? 'Courier New' : 'Calibri',
    size: opts.size || (opts.mono ? 16 : 20),
    bold: opts.bold || false,
    italic: opts.italic || false,
    color: opts.color || C.bodyText,
    ...opts,
  });
}

function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      spacing: { after: 0, before: 0 },
      shading: { type: ShadingType.SOLID, color: C.codeBack },
      indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
      children: [new TextRun({ text: line, font: 'Courier New', size: 16, color: '2D3748' })],
    })
  );
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: opts.level || 0 },
    spacing: { after: 60 },
    children: [run(text, { size: 19, ...opts })],
  });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () =>
    new Paragraph({ spacing: { after: 0, before: 0 }, children: [run('')] })
  );
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.border } },
    spacing: { before: 160, after: 160 },
    children: [run('')],
  });
}

// ─── Table helpers ─────────────────────────────────────────────────────────
function makeCell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.SOLID, color: opts.shade } : undefined,
    borders: {
      top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder,
    },
    verticalAlign: 'center',
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 0 },
      children: [new TextRun({
        text,
        bold: opts.bold || false,
        color: opts.color || (opts.shade === C.tableHead ? C.white : C.bodyText),
        size: opts.size || 18,
        font: opts.mono ? 'Courier New' : 'Calibri',
      })],
    })],
  });
}

function headerRow(cols) {
  return new TableRow({
    tableHeader: true,
    children: cols.map(c =>
      makeCell(typeof c === 'string' ? c : c.text, {
        shade: C.tableHead, bold: true, color: C.white, size: 18,
        width: typeof c === 'object' ? c.width : undefined,
        center: typeof c === 'object' ? c.center : false,
      })
    ),
  });
}

function dataRow(cells, shade) {
  return new TableRow({
    children: cells.map((c, i) => {
      if (typeof c === 'object' && c.runs) {
        return new TableCell({
          shading: shade ? { type: ShadingType.SOLID, color: shade } : undefined,
          borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ spacing: { after: 0 }, children: c.runs })],
        });
      }
      return makeCell(typeof c === 'string' ? c : c.text, {
        shade,
        mono: typeof c === 'object' ? c.mono : false,
        center: typeof c === 'object' ? c.center : false,
        color: typeof c === 'object' ? c.color : undefined,
        bold: typeof c === 'object' ? c.bold : false,
        size: typeof c === 'object' ? c.size : 18,
      });
    }),
  });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(headers),
      ...rows.map((r, i) => dataRow(r, i % 2 === 0 ? C.white : C.tableAlt)),
    ],
  });
}

// ─── Page break ────────────────────────────────────────────────────────────
function pageBreak() {
  return new Paragraph({ children: [new TextRun({ break: 1 })] });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════
const LANGS = [
  { code: 'es', path: '/es/', lang: 'es',      ogLocale: 'es_MX', title: 'Registro de Marca Asequible en México | IMPI Online — MexicoTrademarkCenter',             desc: 'Registro de marca asequible en México ante el IMPI, 100% en línea. Desde USD $299 por clase, todo incluido. Presentación en 24 horas hábiles.',                                                                                           imgAlt: 'Registro de marca asequible en México — MexicoTrademarkCenter' },
  { code: 'en', path: '/en/', lang: 'en',      ogLocale: 'en_US', title: 'Affordable Trademark Registration in Mexico | IMPI Filing — MexicoTrademarkCenter',        desc: 'Affordable trademark registration in Mexico with IMPI — all fees included from USD $299 per class. AI-powered classification, 24-hour filing, no hidden charges.',                                                                      imgAlt: 'Affordable trademark registration in Mexico — MexicoTrademarkCenter' },
  { code: 'zh', path: '/zh/', lang: 'zh-Hans', ogLocale: 'zh_CN', title: '墨西哥商标注册低价全包 | IMPI在线申请 — MexicoTrademarkCenter',                            desc: '墨西哥商标注册费用低廉，每类仅USD $299全包含官费，IMPI官方在线申请，24工作小时内提交。AI智能分类，中文服务。',                                                                                                             imgAlt: '墨西哥商标注册低价全包 — MexicoTrademarkCenter' },
  { code: 'pt', path: '/pt/', lang: 'pt',      ogLocale: 'pt_BR', title: 'Registro de Marca Acessível no México | Protocolo IMPI Online — MexicoTrademarkCenter',    desc: 'Registro de marca acessível no México junto ao IMPI — a partir de USD $299 por classe, tudo incluído. Protocolo em 24 horas úteis, classificação por IA, sem taxas ocultas.',                                                         imgAlt: 'Registro de marca acessível no México — MexicoTrademarkCenter' },
  { code: 'de', path: '/de/', lang: 'de',      ogLocale: 'de_DE', title: 'Günstige Markenanmeldung in Mexiko | IMPI Online — MexicoTrademarkCenter',                 desc: 'Günstige Markenanmeldung in Mexiko beim IMPI — Komplettpreis ab USD $299 pro Klasse, alle Gebühren inklusive. Einreichung innerhalb von 24 Geschäftsstunden, vollständig online.',                                                      imgAlt: 'Günstige Markenanmeldung in Mexiko — MexicoTrademarkCenter' },
  { code: 'fr', path: '/fr/', lang: 'fr',      ogLocale: 'fr_FR', title: 'Enregistrement de Marque Abordable au Mexique | Dépôt IMPI — MexicoTrademarkCenter',       desc: "Enregistrement de marque abordable au Mexique auprès de l'IMPI — à partir de USD $299 par classe, tous frais inclus. Dépôt en 24 heures ouvrées, sans frais cachés.",                                                                  imgAlt: 'Enregistrement de marque abordable au Mexique — MexicoTrademarkCenter' },
  { code: 'hi', path: '/hi/', lang: 'hi',      ogLocale: 'hi_IN', title: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण | IMPI ऑनलाइन — MexicoTrademarkCenter',         desc: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण — USD $299 प्रति वर्ग, सभी शुल्क सहित। IMPI के साथ 24 व्यावसायिक घंटों में दाखिल। Amazon Brand Registry के लिए मान्य।',                                                                imgAlt: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण — MexicoTrademarkCenter' },
  { code: 'ja', path: '/ja/', lang: 'ja',      ogLocale: 'ja_JP', title: 'メキシコ商標登録 低価格・全費用込み | IMPI オンライン申請 — MexicoTrademarkCenter',          desc: 'メキシコ商標登録が低価格・全費用込みでUSD $299/区分から。IMPIにオンラインで申請、AIによる区分分類、24営業時間以内の提出。Amazon Brand Registryにも対応。',                                                                       imgAlt: 'メキシコ商標登録 低価格・全費用込み — MexicoTrademarkCenter' },
];

const BASE = 'https://www.mexicotrademarkcenter.com';
const IMG  = `${BASE}/IMG_2221_2.jpg`;

const HREFLANG_CODES = ['es', 'en', 'zh-Hans', 'pt', 'de', 'fr', 'hi', 'ja', 'x-default'];

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

// ── Cover page ──────────────────────────────────────────────────────────
const coverSection = [
  ...spacer(6),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: 'SEO AUDIT REPORT', bold: true, size: 56, color: C.navy, font: 'Calibri' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'MexicoTrademarkCenter', size: 36, color: C.gold, font: 'Calibri', bold: true })],
  }),
  divider(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: 'International Language Landing Pages — 8 Languages', size: 24, color: C.subText, font: 'Calibri' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: `Site: ${BASE}`, size: 22, color: C.navy, font: 'Calibri' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: 'Audit Date: 2026-05-10', size: 22, color: C.subText, font: 'Calibri' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: 'Stack: React 18 + Vite, Static Pre-rendering, Supabase', size: 20, color: C.subText, font: 'Calibri', italic: true })],
  }),
  ...spacer(4),
  pageBreak(),
];

// ── Section 1: Architecture ──────────────────────────────────────────────
const architectureSection = [
  h('1. Architecture Overview', 1),
  p(run('Each language landing page operates across three independent layers that must remain consistent with one another. This architecture is a deliberate design choice: it ensures that search engine crawlers, social media scrapers, and end users all receive accurate, localized metadata regardless of JavaScript execution state.', { size: 20 })),
  ...spacer(1),
  simpleTable(
    [{ text: 'Layer', width: 22 }, { text: 'File', width: 45 }, { text: 'Served To', width: 33 }],
    [
      ['Static shell', { text: 'public/{lang}/index.html', mono: true }, 'Browsers (pre-hydration) + social scrapers'],
      ['Prerendered HTML', { text: 'dist/{lang}/index.html  (built at deploy)', mono: true }, 'Search engine crawlers (Googlebot, Bingbot)'],
      ['React runtime', { text: 'src/components/SEOHead.tsx  via react-helmet-async', mono: true }, 'Browsers (after JS hydration)'],
    ]
  ),
  ...spacer(1),
  p(run('All three layers share the same source data. The React runtime reads from src/data/landingPages.ts. The build script scripts/prerender.mjs mirrors that data inline and applies it during the Vite postbuild step.', { size: 20, italic: true, color: C.subText })),
  pageBreak(),
];

// ── Section 2: Per-language details ──────────────────────────────────────
function langDetailSection(l) {
  const flagMap = { es: 'Spanish (ES)', en: 'English (EN)', zh: 'Chinese Simplified (ZH)', pt: 'Portuguese (PT)', de: 'German (DE)', fr: 'French (FR)', hi: 'Hindi (HI)', ja: 'Japanese (JA)' };

  const hreflangLinks = HREFLANG_CODES.map(hc => {
    const href = hc === 'x-default' ? `${BASE}/` : `${BASE}/${hc === 'zh-Hans' ? 'zh' : hc}/`;
    return `    hreflang="${hc}"  →  ${href}`;
  });

  return [
    h(`2.${LANGS.indexOf(l) + 1}  ${flagMap[l.code]}  —  /${l.code}/`, 2),

    h('Head Tag Values', 3),
    simpleTable(
      [{ text: 'Tag', width: 28 }, { text: 'Value', width: 72 }],
      [
        [{ text: 'html[lang]',               mono: true }, l.lang],
        [{ text: '<title>',                  mono: true }, l.title],
        [{ text: 'meta[name=description]',   mono: true }, l.desc],
        [{ text: 'og:title',                 mono: true }, l.title],
        [{ text: 'og:description',           mono: true }, l.desc],
        [{ text: 'og:type',                  mono: true }, 'website'],
        [{ text: 'og:url',                   mono: true }, `${BASE}${l.path}`],
        [{ text: 'og:locale',                mono: true }, l.ogLocale],
        [{ text: 'og:image',                 mono: true }, IMG],
        [{ text: 'og:image:width',           mono: true }, '1200'],
        [{ text: 'og:image:height',          mono: true }, '630'],
        [{ text: 'og:image:alt',             mono: true }, l.imgAlt],
        [{ text: 'og:site_name',             mono: true }, 'MexicoTrademarkCenter'],
        [{ text: 'twitter:card',             mono: true }, 'summary_large_image'],
        [{ text: 'twitter:title',            mono: true }, l.title],
        [{ text: 'twitter:description',      mono: true }, l.desc],
        [{ text: 'twitter:image',            mono: true }, IMG],
        [{ text: 'twitter:image:alt',        mono: true }, l.imgAlt],
        [{ text: 'canonical',                mono: true }, `${BASE}${l.path}`],
        [{ text: 'LCP image preload',        mono: true }, '/IMG_2221_2.jpg'],
      ]
    ),
    ...spacer(1),

    h('Hreflang Block (9 links)', 3),
    ...codeBlock(hreflangLinks),
    ...spacer(1),

    h('JSON-LD Schemas Injected', 3),
    bullet('Organization + LegalService schema (shared across all pages)'),
    bullet('Service + Offer schema with USD $299 pricing (shared across all pages)'),
    bullet('FAQPage schema — 4 Q&A pairs, localized in ' + flagMap[l.code]),
    ...spacer(1),
    pageBreak(),
  ];
}

// ── Section 3: Coverage matrix ───────────────────────────────────────────
const tick = '✓';
const matrixSection = [
  h('3. Tag Coverage Matrix', 1),
  p(run('The following matrix shows the presence and values of every SEO signal across all 8 language pages. All checks passed.', { size: 20 })),
  ...spacer(1),
  simpleTable(
    [
      { text: 'Tag / Signal',    width: 26 },
      ...LANGS.map(l => ({ text: l.code.toUpperCase(), width: 9, center: true })),
    ],
    [
      ['html[lang]',            ...LANGS.map(l => ({ text: l.lang,      mono: true, center: true, size: 15 }))],
      ['og:locale',             ...LANGS.map(l => ({ text: l.ogLocale,  mono: true, center: true, size: 15 }))],
      ['<title>',               ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['meta description',      ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:title',              ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:description',        ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:type = website',     ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:url (unique)',       ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:locale (unique)',    ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:image',              ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:image:width 1200',   ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:image:height 630',   ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:image:alt (local.)', ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['og:site_name',          ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['twitter:card',          ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['twitter:title',         ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['twitter:description',   ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['twitter:image',         ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['twitter:image:alt',     ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['canonical (unique)',    ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['hreflang (9 links)',    ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['hreflang x-default',   ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['LCP image preload',     ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['FAQPage JSON-LD',       ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['Org/LegalService LD',   ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
      ['Service/Offer LD',      ...LANGS.map(() => ({ text: tick, color: C.green, bold: true, center: true }))],
    ]
  ),
  pageBreak(),
];

// ── Section 4: Structured data detail ────────────────────────────────────
const orgSchema = `{
  "@context": "https://schema.org",
  "@type": ["Organization", "LegalService"],
  "name": "MexicoTrademarkCenter",
  "url": "https://www.mexicotrademarkcenter.com",
  "logo": "https://www.mexicotrademarkcenter.com/IMG_2221_2.jpg",
  "description": "Affordable trademark registration in Mexico with IMPI —
    AI-powered classification, 24-hour filing, all fees included
    from USD $299 per class.",
  "areaServed": { "@type": "Country", "name": "Mexico" },
  "serviceType": "Trademark Registration",
  "priceRange": "$",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://www.mexicotrademarkcenter.com/contact",
    "availableLanguage": [
      "English","Spanish","Chinese","Portuguese",
      "German","French","Hindi","Japanese"
    ]
  }
}`;

const offerSchema = `{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Trademark Registration in Mexico",
  "provider": {
    "@type": "Organization",
    "name": "MexicoTrademarkCenter",
    "url": "https://www.mexicotrademarkcenter.com"
  },
  "areaServed": { "@type": "Country", "name": "Mexico" },
  "offers": {
    "@type": "Offer",
    "price": "299",
    "priceCurrency": "USD",
    "description": "All-inclusive price per Nice class — covers service fees
      and official IMPI government fees. No hidden charges.",
    "availability": "https://schema.org/InStock",
    "url": "https://www.mexicotrademarkcenter.com/apply"
  }
}`;

const faqSchemaExample = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can foreign companies file a trademark in Mexico?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Foreign individuals and companies of any nationality
                 can file directly with IMPI without a Mexican subsidiary."
      }
    },
    {
      "@type": "Question",
      "name": "How much does it cost to register a trademark in Mexico?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "USD $299 per class, all-inclusive: service fee USD $129
                 plus IMPI government fees USD $170."
      }
    },
    {
      "@type": "Question",
      "name": "How long does Mexico trademark registration take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "12 to 24 months depending on IMPI's workload."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use the IMPI filing receipt for Amazon Brand Registry?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The official IMPI receipt is accepted by Amazon
                 to activate Amazon Brand Registry Mexico."
      }
    }
  ]
}`;

const structuredDataSection = [
  h('4. Structured Data (JSON-LD)', 1),
  p(run('Three JSON-LD schemas are present on every language page. They are injected at both build time (by prerender.mjs into dist/{lang}/index.html) and at runtime (by SEOHead.tsx via react-helmet-async). This dual-injection ensures crawlers that do not execute JavaScript still receive the structured data.', { size: 20 })),
  ...spacer(1),

  h('Schema 1 — Organization + LegalService', 3),
  p(run('Scope: site-wide identity signal. Identical across all 8 pages.', { size: 19, italic: true, color: C.subText })),
  ...codeBlock(orgSchema.split('\n')),
  ...spacer(1),

  h('Schema 2 — Service + Offer (Pricing)', 3),
  p(run('Scope: pricing signal. USD $299 per Nice class, InStock availability. Identical across all 8 pages.', { size: 19, italic: true, color: C.subText })),
  ...codeBlock(offerSchema.split('\n')),
  ...spacer(1),

  h('Schema 3 — FAQPage (Localized)', 3),
  p(run('Scope: FAQ rich result eligibility. 4 Q&A pairs per page, fully localized. Example below is the English version.', { size: 19, italic: true, color: C.subText })),
  ...codeBlock(faqSchemaExample.split('\n')),
  pageBreak(),
];

// ── Section 5: Sitemap ───────────────────────────────────────────────────
const sitemapSection = [
  h('5. Sitemap', 1),
  p(run('File: public/sitemap.xml  —  15 <url> entries total.', { mono: true, size: 19, color: C.subText })),
  ...spacer(1),

  h('Language Landing Pages', 3),
  p(run('All 8 language pages carry the full 9-link xhtml:link alternate block.', { size: 20 })),
  ...spacer(1),
  simpleTable(
    [{ text: 'URL', width: 45 }, { text: 'Priority', width: 15 }, { text: 'changefreq', width: 20 }, { text: 'lastmod', width: 20 }],
    LANGS.map(l => [
      { text: `${BASE}${l.path}`, mono: true },
      { text: '0.9', center: true },
      'monthly',
      '2026-05-09',
    ])
  ),
  ...spacer(1),

  h('Hreflang Alternates in Sitemap (per language URL entry)', 3),
  ...codeBlock([
    '<xhtml:link rel="alternate" hreflang="es"      href="https://www.mexicotrademarkcenter.com/es/"/>',
    '<xhtml:link rel="alternate" hreflang="en"      href="https://www.mexicotrademarkcenter.com/en/"/>',
    '<xhtml:link rel="alternate" hreflang="zh-Hans" href="https://www.mexicotrademarkcenter.com/zh/"/>',
    '<xhtml:link rel="alternate" hreflang="pt"      href="https://www.mexicotrademarkcenter.com/pt/"/>',
    '<xhtml:link rel="alternate" hreflang="de"      href="https://www.mexicotrademarkcenter.com/de/"/>',
    '<xhtml:link rel="alternate" hreflang="fr"      href="https://www.mexicotrademarkcenter.com/fr/"/>',
    '<xhtml:link rel="alternate" hreflang="hi"      href="https://www.mexicotrademarkcenter.com/hi/"/>',
    '<xhtml:link rel="alternate" hreflang="ja"      href="https://www.mexicotrademarkcenter.com/ja/"/>',
    '<xhtml:link rel="alternate" hreflang="x-default" href="https://www.mexicotrademarkcenter.com/"/>',
  ]),
  ...spacer(1),

  h('Main Site Pages', 3),
  simpleTable(
    [{ text: 'URL', width: 55 }, { text: 'Priority', width: 15 }, { text: 'changefreq', width: 30 }],
    [
      [`${BASE}/`,                    { text: '1.0', center: true }, 'weekly'],
      [`${BASE}/pricing`,             { text: '0.8', center: true }, 'monthly'],
      [`${BASE}/how-it-works`,        { text: '0.7', center: true }, 'monthly'],
      [`${BASE}/faq`,                 { text: '0.7', center: true }, 'monthly'],
      [`${BASE}/contact`,             { text: '0.5', center: true }, 'monthly'],
      [`${BASE}/trademark-ideas`,     { text: '0.8', center: true }, 'monthly'],
      [`${BASE}/trademark-check`,     { text: '0.8', center: true }, 'monthly'],
    ]
  ),
  pageBreak(),
];

// ── Section 6: Robots.txt ────────────────────────────────────────────────
const robotsSection = [
  h('6. Robots.txt', 1),
  p(run('File: public/robots.txt', { mono: true, size: 19, color: C.subText })),
  ...spacer(1),
  ...codeBlock([
    'User-agent: *',
    'Allow: /',
    '',
    '# Transactional & private pages — not for indexing',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /dashboard',
    'Disallow: /dashboard/',
    'Disallow: /login',
    'Disallow: /staff',
    'Disallow: /apply',
    '',
    '# Sitemap',
    'Sitemap: https://www.mexicotrademarkcenter.com/sitemap.xml',
  ]),
  pageBreak(),
];

// ── Section 7: Build pipeline ─────────────────────────────────────────────
const buildSection = [
  h('7. Prerender Build Pipeline', 1),
  p(run('The scripts/prerender.mjs postbuild script runs automatically after every npm run build via the package.json "postbuild" hook. It transforms dist/index.html (the Vite SPA shell) into 8 language-specific static HTML files at dist/{lang}/index.html.', { size: 20 })),
  ...spacer(1),

  h('Transformation Steps (buildPage function)', 3),
  simpleTable(
    [{ text: 'Step', width: 8 }, { text: 'Operation', width: 40 }, { text: 'Detail', width: 52 }],
    [
      ['1',  'Set html[lang]',             'Regex replace → BCP 47 tag per language'],
      ['2',  'Replace <title>',            'HTML-entity-escaped localized title'],
      ['3',  'Replace meta description',   'HTML-entity-escaped localized description'],
      ['4',  'Replace og:title/og:desc',   'Localized values with &quot; escaping'],
      ['5',  'Replace og:url',             `${BASE}/{lang}/`],
      ['5a', 'Inject/replace og:locale',   'Inserted after og:url tag if not present'],
      ['5b', 'Inject/replace og:image:alt','Inserted after og:image:height if not present'],
      ['5c', 'Inject/replace twitter:image:alt', 'Inserted after twitter:image if not present'],
      ['6',  'Replace twitter:title/desc', 'Localized values'],
      ['7',  'Inject hreflang block',      'Removes any existing, injects full 9-link block'],
      ['8',  'Inject canonical',           `${BASE}/{lang}/`],
      ['9',  'Inject 3 JSON-LD scripts',   'Organization+LegalService, Service+Offer, FAQPage'],
      ['10', 'Inject body content',        'Pre-rendered H1, H2s, bullets, testimonials, FAQs into #root'],
    ]
  ),
  ...spacer(1),

  h('Smoke Test on Each Generated File', 3),
  p(run('After writing each dist/{lang}/index.html the script verifies three assertions before reporting success:', { size: 20 })),
  bullet('H1 text is present in the output HTML'),
  bullet('Page title is present in the output HTML'),
  bullet('hreflang="es" link is present in the output HTML'),
  p(run('Build output: Pre-rendered 8/8 pages successfully.', { size: 19, bold: true, color: C.green })),
  pageBreak(),
];

// ── Section 8: Open items ─────────────────────────────────────────────────
const openItemsSection = [
  h('8. Known Open Items', 1),
  p(run('The following signals are absent from the current implementation. None are blocking for indexation or ranking. They are listed for completeness so the auditor can assess priority.', { size: 20 })),
  ...spacer(1),
  simpleTable(
    [{ text: 'Item', width: 38 }, { text: 'Impact', width: 14 }, { text: 'Notes', width: 48 }],
    [
      ['No <meta name="robots"> explicit tag',         { text: 'Low',    color: C.green,  bold: true }, 'Defaults to index, follow. robots.txt handles exclusions. No action required.'],
      ['No og:locale:alternate tags',                  { text: 'Low',    color: C.green,  bold: true }, 'Optional OG multi-locale annotation. Facebook does not require it.'],
      ['sameAs array in Organization schema is empty', { text: 'Low',    color: C.green,  bold: true }, 'Social profile URLs (LinkedIn, Facebook, etc.) not yet populated.'],
      ['No BreadcrumbList JSON-LD',                    { text: 'Medium', color: C.amber,  bold: true }, 'Would improve SERP display with breadcrumb trail in search results.'],
      ['No WebSite schema with SearchAction',          { text: 'Low',    color: C.green,  bold: true }, 'Would enable Google Sitelinks Searchbox if applicable to the product.'],
      ['No apple-touch-icon / PWA manifest.json',      { text: 'Low',    color: C.green,  bold: true }, 'Not an SEO ranking factor. Affects mobile home-screen UX only.'],
      ['OG image filename not descriptive',            { text: 'Low',    color: C.green,  bold: true }, 'Currently /IMG_2221_2.jpg. Renaming to trademark-mexico-og.jpg is a minor best practice.'],
      ['hreflang="pt" vs "pt-BR"',                     { text: 'Note',   color: C.subText, bold: false }, 'pt is generic Portuguese. If targeting Brazil specifically, pt-BR is more precise per Googlebot documentation.'],
      ['hreflang="hi" (no subtag)',                    { text: 'Note',   color: C.subText, bold: false }, 'hi has no commonly used subtag. hi is correct per Google\'s published hreflang guidance.'],
      ['Language pages not cross-linked in main nav',  { text: 'Medium', color: C.amber,  bold: true }, 'Internal linking from non-language pages to language landing pages not confirmed. Crawl budget and PageRank distribution may be affected.'],
    ]
  ),
  pageBreak(),
];

// ── Section 9: SEOHead component spec ─────────────────────────────────────
const seoHeadSection = [
  h('9. SEOHead React Component Specification', 1),
  p(run('File: src/components/SEOHead.tsx', { mono: true, size: 19, color: C.subText })),
  ...spacer(1),

  h('Props Interface', 3),
  ...codeBlock([
    'interface SEOHeadProps {',
    '  title:               string;',
    '  description:         string;',
    '  canonicalPath:       string;',
    '  lang:                string;',
    '  ogLocale:            string;',
    '  ogImageAlt:          string;',
    '  hreflangAlternates:  HreflangAlternate[];',
    '  faqs?:               FaqItem[];',
    '  ogImage?:            string;   // default: /IMG_2221_2.jpg',
    '}',
  ]),
  ...spacer(1),

  h('Output Tags', 3),
  simpleTable(
    [{ text: 'Tag', width: 35 }, { text: 'Source', width: 65 }],
    [
      [{ text: 'htmlAttributes { lang }',             mono: true }, 'lang prop'],
      [{ text: '<title>',                             mono: true }, 'title prop'],
      [{ text: 'meta[name=description]',              mono: true }, 'description prop'],
      [{ text: 'link[rel=canonical]',                 mono: true }, 'BASE_URL + canonicalPath'],
      [{ text: 'link[rel=alternate][hreflang] × 9',  mono: true }, 'hreflangAlternates prop + x-default'],
      [{ text: 'og:title',                            mono: true }, 'title prop'],
      [{ text: 'og:description',                      mono: true }, 'description prop'],
      [{ text: 'og:type',                             mono: true }, '"website" (hardcoded)'],
      [{ text: 'og:url',                              mono: true }, 'BASE_URL + canonicalPath'],
      [{ text: 'og:locale',                           mono: true }, 'ogLocale prop'],
      [{ text: 'og:image',                            mono: true }, 'ogImage prop (default: /IMG_2221_2.jpg)'],
      [{ text: 'og:image:width',                      mono: true }, '"1200" (hardcoded)'],
      [{ text: 'og:image:height',                     mono: true }, '"630" (hardcoded)'],
      [{ text: 'og:image:alt',                        mono: true }, 'ogImageAlt prop'],
      [{ text: 'og:site_name',                        mono: true }, '"MexicoTrademarkCenter" (hardcoded)'],
      [{ text: 'twitter:card',                        mono: true }, '"summary_large_image" (hardcoded)'],
      [{ text: 'twitter:title',                       mono: true }, 'title prop'],
      [{ text: 'twitter:description',                 mono: true }, 'description prop'],
      [{ text: 'twitter:image',                       mono: true }, 'ogImage prop'],
      [{ text: 'twitter:image:alt',                   mono: true }, 'ogImageAlt prop'],
      [{ text: 'script[type=application/ld+json] ×3', mono: true }, 'ORGANIZATION_SCHEMA + OFFER_SCHEMA + faqSchema (conditional)'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════

const allChildren = [
  ...coverSection,
  ...architectureSection,
  ...LANGS.flatMap(l => langDetailSection(l)),
  ...matrixSection,
  ...structuredDataSection,
  ...sitemapSection,
  ...robotsSection,
  ...buildSection,
  ...openItemsSection,
  ...seoHeadSection,
];

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullet-list', levels: [{ level: 0, format: 'bullet', text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] },
    ],
  },
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: C.bodyText },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(1.0),
          right:  convertInchesToTwip(1.0),
          bottom: convertInchesToTwip(1.0),
          left:   convertInchesToTwip(1.0),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border } },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: 'SEO Audit Report — MexicoTrademarkCenter', size: 16, color: C.subText, font: 'Calibri' }),
              new TextRun({ text: '          2026-05-10', size: 16, color: C.subText, font: 'Calibri' }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border } },
            spacing: { before: 80 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 16, color: C.subText, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.subText, font: 'Calibri' }),
              new TextRun({ text: ' of ', size: 16, color: C.subText, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.subText, font: 'Calibri' }),
            ],
          }),
        ],
      }),
    },
    children: allChildren,
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`\nReport written to: ${OUT}`);
console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
