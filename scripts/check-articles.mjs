/**
 * Build guard for src/columns/*.json.
 *
 * The site claims no professional credential, so the citations are the
 * authority. A column without a primary source is not publishable, and the
 * build fails rather than shipping one. Run automatically by `npm run build`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "src/columns");

const SECTIONS = new Set(["selfemployed", "crossborder", "property", "personal"]);

// Sources must point at primary law/guidance, not at commentary.
//
// Keep this in sync with the writing workflow's Tier 1 list
// (D:\TAX_Writing\instructions\04-sources.md). A host the workflow tells the
// agent to cite but that is missing here does not produce a bad column — it
// stops the build outright, which is a worse failure than it looks.
//
// Federal primary sources only. State revenue departments are deliberately
// absent: there are ~50 of them, allow-listing that surface would weaken the
// guarantee this check exists to make, and the site is federal-scope for now.
const ALLOWED_SOURCE_HOSTS = [
  "www.irs.gov",
  "irs.gov",
  "www.law.cornell.edu",
  "law.cornell.edu",
  "www.ecfr.gov",
  "ecfr.gov",
  "www.govinfo.gov",
  "govinfo.gov",
  "www.federalregister.gov",
  "federalregister.gov",
  "www.congress.gov",
  "congress.gov",
  "www.ssa.gov",
  "ssa.gov",
  "fincen.gov",
  "www.fincen.gov",
  "bsaefiling.fincen.treas.gov",
  // The U.S. Code as published by the House — the statute itself, and the
  // citation the writing workflow reaches for on Code sections.
  "uscode.house.gov",
  "www.uscode.house.gov",
  // Tax Court opinions. Primary law, and the only place some holdings appear.
  "ustaxcourt.gov",
  "www.ustaxcourt.gov",
  "dawson.ustaxcourt.gov",
];

// Titles and experience this site must never claim. See src/data/site.ts.
// These match SELF-REFERENTIAL claims only — a column may of course tell the
// reader to consult a CPA, and must be able to say so.
const FORBIDDEN_CLAIMS = [
  /\bI am (?:a|an) (?:CPA|certified public accountant|enrolled agent|tax attorney|tax accountant|tax advis[eo]r|tax professional)\b/i,
  /\bour (?:CPAs|attorneys|tax advis[eo]rs|clients)\b/i,
  /\bas your (?:CPA|tax advis[eo]r|accountant)\b/i,
  // Fabricated practice experience — the author has no U.S. tax practice, and
  // the Korean day job is employment, not a practice of their own.
  /\b(?:in|from) my practice\b/i,
  /\bmy (?:clients|clientele)\b/i,
  /\bI (?:prepare|file|review|sign) (?:your |their |clients'? )?returns?\b/i,
  /\bwe represent taxpayers\b/i,
];

const errors = [];
const warnings = [];

function fail(file, msg) {
  errors.push(`${file}: ${msg}`);
}
function warn(file, msg) {
  warnings.push(`${file}: ${msg}`);
}

if (!existsSync(DIR)) {
  console.error(`content directory not found: ${DIR}`);
  process.exit(1);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("no columns found in src/columns — nothing to build");
  process.exit(1);
}

const seenSlugs = new Map();
const seenIssues = new Map();

for (const file of files) {
  let a;
  try {
    a = JSON.parse(readFileSync(path.join(DIR, file), "utf8"));
  } catch (e) {
    fail(file, `invalid JSON — ${e.message}`);
    continue;
  }

  const required = [
    "issueNumber",
    "title",
    "slug",
    "section",
    "category",
    "authorName",
    "excerpt",
    "keyQuestion",
    "bodyHtml",
    "tags",
    "faqItems",
    "sources",
    "readingTimeMinutes",
    "publishedAt",
  ];
  for (const key of required) {
    if (a[key] === undefined) fail(file, `missing required field "${key}"`);
  }

  if (a.slug && `${a.slug}.json` !== file) {
    fail(file, `slug "${a.slug}" does not match filename`);
  }
  if (a.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)) {
    fail(file, `slug "${a.slug}" must be lowercase kebab-case`);
  }
  if (a.slug && seenSlugs.has(a.slug)) {
    fail(file, `duplicate slug, also used by ${seenSlugs.get(a.slug)}`);
  } else if (a.slug) {
    seenSlugs.set(a.slug, file);
  }

  if (a.issueNumber !== undefined) {
    if (seenIssues.has(a.issueNumber)) {
      warn(file, `issueNumber ${a.issueNumber} reused from ${seenIssues.get(a.issueNumber)}`);
    } else {
      seenIssues.set(a.issueNumber, file);
    }
  }

  if (a.section && !SECTIONS.has(a.section)) {
    fail(file, `unknown section "${a.section}" (expected one of ${[...SECTIONS].join(", ")})`);
  }

  // --- the rule that matters most on this site ---
  if (!Array.isArray(a.sources) || a.sources.length === 0) {
    fail(file, "no primary sources — every column must cite at least one IRS/IRC source");
  } else {
    a.sources.forEach((s, i) => {
      if (!s || typeof s.label !== "string" || !s.label.trim()) {
        fail(file, `sources[${i}] has no label`);
      }
      let host = null;
      try {
        host = new URL(s?.url ?? "").host.toLowerCase();
      } catch {
        fail(file, `sources[${i}] has an invalid url`);
      }
      if (host && !ALLOWED_SOURCE_HOSTS.includes(host)) {
        fail(file, `sources[${i}] points at "${host}" — cite a primary source, not commentary`);
      }
    });
  }

  if (!Array.isArray(a.faqItems) || a.faqItems.length < 2) {
    warn(file, "fewer than 2 FAQ items — FAQPage markup is a main AI-citation surface");
  }
  if (a.keyQuestion && !a.keyQuestion.trim().endsWith("?")) {
    warn(file, "keyQuestion should be phrased as an actual question");
  }
  if (a.excerpt && a.excerpt.length > 200) {
    warn(file, `excerpt is ${a.excerpt.length} chars — meta descriptions get cut near 160`);
  }
  if (a.title && a.title.length > 70) {
    warn(file, `title is ${a.title.length} chars — search results cut near 60`);
  }
  if (a.taxYear !== undefined && a.taxYear !== null && !a.lastReviewed) {
    warn(file, "year-specific column has no lastReviewed date");
  }

  const haystack = `${a.title ?? ""} ${a.excerpt ?? ""} ${a.bodyHtml ?? ""} ${a.authorRole ?? ""}`;
  const serialized = JSON.stringify(a);
  if (/TODO/.test(serialized)) {
    warn(file, "still contains TODO placeholders");
  }
  // The writing workflow leaves {{TOKEN}} in place rather than inventing a
  // value — those must be resolved before the column goes live.
  const tokens = [...new Set(serialized.match(/\{\{[A-Z_]+\}\}/g) ?? [])];
  if (tokens.length) {
    warn(file, `unresolved template token(s): ${tokens.join(", ")}`);
  }
  for (const re of FORBIDDEN_CLAIMS) {
    if (re.test(haystack)) {
      fail(file, `claims a credential the site does not hold (matched ${re})`);
    }
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\n${errors.length} blocking problem(s) — build stopped.`);
  process.exit(1);
}
console.log(`checked ${files.length} column(s): OK${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
