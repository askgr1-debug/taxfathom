/**
 * Import drafts produced by the writing workflow at D:\TAX_Writing.
 *
 * That workflow emits three files per article into its output/ folder:
 *   <ts>_<slug>.html       standalone preview (this is where the body lives)
 *   <ts>_<slug>.md         portable markdown body
 *   <ts>_<slug>.meta.json  title / slug / excerpt / faq / sources / ...
 *
 * This converts each triple into one src/columns/<slug>.json.
 *
 *   node scripts/import-drafts.mjs                  # import everything new
 *   node scripts/import-drafts.mjs --force          # also overwrite existing
 *   WRITING_DIR="D:/TAX_Writing" node scripts/...   # override source location
 *
 * The body is taken from the .html rather than the .md so that inline SVG
 * infographics survive. Blocks the site renders from structured data instead
 * (FAQ, sources, disclaimer) are stripped out here so they are not duplicated.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "src/columns");
const SRC_DIR = path.join(process.env.WRITING_DIR ?? "D:/TAX_Writing", "output");
const FORCE = process.argv.includes("--force");

/**
 * The writing workflow's category vocabulary mapped onto this site's
 * section + topic axes. Edit here when either side gains a value.
 * A meta.json may override the section directly with a "section" field.
 */
const CATEGORY_MAP = {
  "federal-business": { section: "selfemployed", category: "Deductions" },
  payroll: { section: "selfemployed", category: "Payroll" },
  international: { section: "crossborder", category: "Foreign assets" },
  "federal-individual": { section: "personal", category: "Deductions" },
  state: { section: "personal", category: "Deductions" },
  procedure: { section: "personal", category: "IRS notices" },
};

// Removed from the body: preview chrome, and anything the page renders itself.
const STRIP_SELECTORS = [
  "[data-preview-only]",
  "script",
  "style",
  "p.subtitle", // the page shows `excerpt` in this slot
  "div.stamp", // the page shows tax year + last-reviewed itself
  "section.faq", // rendered from faqItems
  "section.sources", // rendered from sources[]
  "section.disclaimer", // rendered by the Disclaimer component
];

if (!existsSync(SRC_DIR)) {
  console.error(`writing output folder not found: ${SRC_DIR}`);
  console.error("set WRITING_DIR if the workflow lives somewhere else");
  process.exit(1);
}

function nextIssueNumber() {
  let max = 0;
  for (const f of readdirSync(OUT_DIR).filter((f) => f.endsWith(".json"))) {
    try {
      const n = JSON.parse(readFileSync(path.join(OUT_DIR, f), "utf8")).issueNumber;
      if (Number.isFinite(n)) max = Math.max(max, n);
    } catch {
      /* noop */
    }
  }
  return max + 1;
}

function toIso(value, fallback) {
  if (!value) return fallback;
  const d = new Date(`${value}`.length <= 10 ? `${value}T00:00:00.000Z` : value);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function extractBody(html) {
  const $ = cheerio.load(html);
  for (const sel of STRIP_SELECTORS) $(sel).remove();
  const body = $("body");
  return (body.length ? body.html() : $.root().html())?.trim() ?? "";
}

function readingTime(html) {
  const words = cheerio.load(html).root().text().trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function mapSources(list) {
  return (list ?? [])
    .map((s) => {
      const citation = (s.citation ?? "").trim();
      const authority = (s.authority ?? "").trim();
      const label = citation || authority;
      if (!label || !s.url) return null;
      const detail = citation && authority && authority !== citation ? authority : undefined;
      return detail ? { label, url: s.url, detail } : { label, url: s.url };
    })
    .filter(Boolean);
}

const metas = readdirSync(SRC_DIR).filter((f) => f.endsWith(".meta.json"));
if (metas.length === 0) {
  console.log(`no drafts in ${SRC_DIR} — nothing to import`);
  process.exit(0);
}

let issue = nextIssueNumber();
let imported = 0;
let skipped = 0;

for (const metaFile of metas.sort()) {
  const stem = metaFile.replace(/\.meta\.json$/, "");
  const htmlPath = path.join(SRC_DIR, `${stem}.html`);

  let meta;
  try {
    meta = JSON.parse(readFileSync(path.join(SRC_DIR, metaFile), "utf8"));
  } catch (e) {
    console.error(`skip ${metaFile}: invalid JSON — ${e.message}`);
    skipped++;
    continue;
  }

  const slug = (meta.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.error(`skip ${metaFile}: unusable slug "${meta.slug}"`);
    skipped++;
    continue;
  }

  const target = path.join(OUT_DIR, `${slug}.json`);
  if (existsSync(target) && !FORCE) {
    skipped++;
    continue;
  }
  if (!existsSync(htmlPath)) {
    console.error(`skip ${metaFile}: companion html missing (${stem}.html)`);
    skipped++;
    continue;
  }

  const mapped = CATEGORY_MAP[meta.category] ?? {
    section: "selfemployed",
    category: "Deductions",
  };
  if (!CATEGORY_MAP[meta.category]) {
    console.warn(`warn  ${metaFile}: unknown category "${meta.category}" — defaulted`);
  }
  if (Array.isArray(meta.unverified) && meta.unverified.length > 0) {
    console.warn(
      `warn  ${metaFile}: ${meta.unverified.length} claim(s) were cut as unverified upstream`
    );
  }

  const bodyHtml = extractBody(readFileSync(htmlPath, "utf8"));
  if (!bodyHtml) {
    console.error(`skip ${metaFile}: empty body after stripping`);
    skipped++;
    continue;
  }

  // <ts> is yyyyMMdd-HHmmss; use it as the publish date when meta has none.
  const tsMatch = stem.match(/^(\d{4})(\d{2})(\d{2})-/);
  const tsIso = tsMatch
    ? `${tsMatch[1]}-${tsMatch[2]}-${tsMatch[3]}T00:00:00.000Z`
    : new Date().toISOString();

  // Preserve the original publish date when re-importing over an existing file.
  let publishedAt = tsIso;
  if (existsSync(target)) {
    try {
      publishedAt = JSON.parse(readFileSync(target, "utf8")).publishedAt ?? tsIso;
    } catch {
      /* noop */
    }
  }

  const article = {
    issueNumber: issue++,
    title: meta.title ?? "",
    slug,
    section: meta.section ?? mapped.section,
    category: meta.siteCategory ?? mapped.category,
    authorName: meta.author ?? "{{AUTHOR_NAME}}",
    authorRole: null,
    excerpt: meta.excerpt ?? "",
    keyQuestion: meta.targetQuestion ?? "",
    bodyHtml,
    tags: Array.isArray(meta.keywords) ? meta.keywords : [],
    faqItems: (meta.faq ?? [])
      .map((f) => ({ question: f.q ?? "", answer: f.a ?? "" }))
      .filter((f) => f.question && f.answer),
    sources: mapSources(meta.sources),
    taxYear: Number.isFinite(meta.taxYear) ? meta.taxYear : null,
    coverImageUrl: null,
    coverImageAlt: null,
    readingTimeMinutes: readingTime(bodyHtml),
    featured: false,
    publishedAt,
    lastReviewed: toIso(meta.currentAsOf, publishedAt),
    sourceFileName: `${stem}.html`,
  };

  writeFileSync(target, JSON.stringify(article, null, 2) + "\n", "utf8");
  console.log(`imported ${slug}.json  (issue #${article.issueNumber}, ${article.section})`);
  imported++;
}

console.log(`\n${imported} imported, ${skipped} skipped`);
if (imported > 0) console.log("next: npm run check");
