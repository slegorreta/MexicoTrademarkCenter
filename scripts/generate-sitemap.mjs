/**
 * Sitemap generator — writes public/sitemap.xml
 *
 * Run:  node scripts/generate-sitemap.mjs
 * Wired into: "prebuild" in package.json so it runs before every Vite build.
 *
 * To add a new page:
 *   - Append an entry to STATIC_PAGES  (for regular pages), or
 *   - Append an entry to LANG_PAGES    (for language landing pages)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'sitemap.xml');
const BASE = 'https://www.mexicotrademarkcenter.com';

// ISO date used as lastmod — update when content changes significantly
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ─── Static (non-language) pages ─────────────────────────────────────────
const STATIC_PAGES = [
  { path: '/',                  changefreq: 'weekly',  priority: '1.0' },
  { path: '/pricing',           changefreq: 'monthly', priority: '0.8' },
  { path: '/how-it-works',      changefreq: 'monthly', priority: '0.7' },
  { path: '/faq',               changefreq: 'monthly', priority: '0.7' },
  { path: '/contact',           changefreq: 'monthly', priority: '0.5' },
  { path: '/trademark-ideas',   changefreq: 'monthly', priority: '0.8' },
  { path: '/trademark-check',   changefreq: 'monthly', priority: '0.8' },
];

// ─── Language landing pages ───────────────────────────────────────────────
// hreflang: BCP 47 tag used in the alternate link
// slug:     URL path segment (e.g. 'es' → /es/)
const LANG_PAGES = [
  { slug: 'es', hreflang: 'es'      },
  { slug: 'en', hreflang: 'en'      },
  { slug: 'zh', hreflang: 'zh-Hans' },
  { slug: 'pt', hreflang: 'pt'      },
  { slug: 'de', hreflang: 'de'      },
  { slug: 'fr', hreflang: 'fr'      },
  { slug: 'hi', hreflang: 'hi'      },
  { slug: 'ja', hreflang: 'ja'      },
];

// ─── XML helpers ─────────────────────────────────────────────────────────
function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, changefreq, priority, alternates = []) {
  const lines = [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${TODAY}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
  ];
  for (const alt of alternates) {
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alt.hreflang)}" href="${xmlEscape(alt.href)}"/>`
    );
  }
  lines.push('  </url>');
  return lines.join('\n');
}

// ─── Build alternates list for every language page ────────────────────────
// Every language page cross-references all other languages + x-default
function buildAlternates() {
  const alts = LANG_PAGES.map(l => ({
    hreflang: l.hreflang,
    href: `${BASE}/${l.slug}/`,
  }));
  alts.push({ hreflang: 'x-default', href: `${BASE}/` });
  return alts;
}

// ─── Assemble XML ─────────────────────────────────────────────────────────
function buildSitemap() {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    '',
  ];

  for (const page of STATIC_PAGES) {
    lines.push(urlEntry(`${BASE}${page.path}`, page.changefreq, page.priority));
    lines.push('');
  }

  const alternates = buildAlternates();
  for (const lang of LANG_PAGES) {
    lines.push(urlEntry(`${BASE}/${lang.slug}/`, 'monthly', '0.9', alternates));
    lines.push('');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

// ─── Validate: confirm the XML starts and ends correctly ──────────────────
function validate(xml) {
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('Sitemap does not start with valid XML declaration');
  }
  if (!xml.includes('<urlset') || !xml.includes('</urlset>')) {
    throw new Error('Sitemap missing <urlset> root element');
  }
  const locCount = (xml.match(/<loc>/g) || []).length;
  const expected = STATIC_PAGES.length + LANG_PAGES.length;
  if (locCount !== expected) {
    throw new Error(`Expected ${expected} <loc> entries, found ${locCount}`);
  }
  // Confirm every hreflang appears in the alternates section
  for (const lang of LANG_PAGES) {
    if (!xml.includes(`hreflang="${lang.hreflang}"`)) {
      throw new Error(`Missing hreflang="${lang.hreflang}" in sitemap`);
    }
  }
  if (!xml.includes('hreflang="x-default"')) {
    throw new Error('Missing hreflang="x-default" in sitemap');
  }
  console.log(`  ✓  ${locCount} URLs validated`);
  console.log(`  ✓  All ${LANG_PAGES.length} hreflang codes present + x-default`);
  console.log('  ✓  XML declaration present');
  console.log('  ✓  <urlset> root element present');
}

// ─── Main ─────────────────────────────────────────────────────────────────
const xml = buildSitemap();
validate(xml);
fs.writeFileSync(OUT, xml, 'utf8');
console.log(`  ✓  Written to: ${path.relative(process.cwd(), OUT)}`);
console.log(`  ✓  File size: ${(Buffer.byteLength(xml, 'utf8') / 1024).toFixed(1)} KB`);
