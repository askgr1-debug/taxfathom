/**
 * Scaffold a new column:
 *   npm run new -- "s-corp-election-deadline" selfemployed
 *
 * Writes src/columns/<slug>.json with the right shape and the next
 * issue number, then you (or the writing agent) fill in the body.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "src/columns");

const [slugArg, sectionArg] = process.argv.slice(2);
if (!slugArg) {
  console.error('usage: npm run new -- "<slug>" [selfemployed|crossborder|property|personal]');
  process.exit(1);
}

const slug = slugArg.trim().toLowerCase();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug must be lowercase kebab-case: "${slug}"`);
  process.exit(1);
}

const SECTIONS = ["selfemployed", "crossborder", "property", "personal"];
const section = sectionArg ?? "selfemployed";
if (!SECTIONS.includes(section)) {
  console.error(`unknown section "${section}" (expected: ${SECTIONS.join(", ")})`);
  process.exit(1);
}

const target = path.join(DIR, `${slug}.json`);
if (existsSync(target)) {
  console.error(`already exists: ${target}`);
  process.exit(1);
}

let maxIssue = 0;
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  try {
    const n = JSON.parse(readFileSync(path.join(DIR, f), "utf8")).issueNumber;
    if (Number.isFinite(n)) maxIssue = Math.max(maxIssue, n);
  } catch {
    /* noop */
  }
}

const today = new Date().toISOString().slice(0, 10);

const stub = {
  issueNumber: maxIssue + 1,
  title: "TODO: one specific question, under 60 characters",
  slug,
  section,
  category: "TODO: see categories in src/data/site.ts",
  authorName: "TODO: your name",
  authorRole: null,
  excerpt: "TODO: the answer in one or two sentences, under 160 characters.",
  keyQuestion: "TODO: the single question this column answers?",
  bodyHtml: "<p>TODO: answer the question in the first paragraph, then explain.</p>",
  tags: [],
  faqItems: [
    { question: "TODO", answer: "TODO" },
    { question: "TODO", answer: "TODO" },
  ],
  sources: [
    {
      label: "TODO: e.g. IRS Publication 334",
      url: "https://www.irs.gov/",
      detail: "TODO: the exact chapter or section used",
    },
  ],
  taxYear: null,
  coverImageUrl: null,
  coverImageAlt: null,
  readingTimeMinutes: 6,
  featured: false,
  publishedAt: `${today}T00:00:00.000Z`,
  lastReviewed: `${today}T00:00:00.000Z`,
};

writeFileSync(target, JSON.stringify(stub, null, 2) + "\n", "utf8");
console.log(`created ${path.relative(ROOT, target)} (issue #${stub.issueNumber}, section ${section})`);
console.log("fill in the TODOs, then run: npm run check");
