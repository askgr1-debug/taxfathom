import type { SectionId } from "./site";

export type FaqItem = { question: string; answer: string };

/**
 * A primary source backing the column. Because the site claims no credential,
 * these citations ARE the authority — every column needs at least one, and the
 * build refuses to run without it (see scripts/check-articles.mjs).
 */
export type Source = {
  /** Human label, e.g. "IRS Publication 535" or "IRC § 199A". */
  label: string;
  /** Link to the primary source itself — irs.gov or law.cornell.edu, not a blog. */
  url: string;
  /** Optional pointer to the exact part used, e.g. "Chapter 4, Business use of car". */
  detail?: string;
};

export type Article = {
  /** Stable publication number, used to break date ties. */
  issueNumber: number;
  title: string;
  slug: string;
  section: SectionId;
  category: string;
  authorName: string;
  authorRole: string | null;
  /** Summary shown on the hub and above the article body. */
  excerpt: string;
  /** The single question this column answers — one column, one question. */
  keyQuestion: string;
  /** Normalized body HTML fragment (no author bio, CTA or analytics markup). */
  bodyHtml: string;
  tags: string[];
  faqItems: FaqItem[];
  /** Primary sources. Required — at least one. */
  sources: Source[];
  /** Tax year the column applies to, e.g. 2026. Null for evergreen procedure. */
  taxYear: number | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  readingTimeMinutes: number;
  featured: boolean;
  /** ISO string. */
  publishedAt: string | null;
  /** ISO string — last time the rules in this column were re-checked. */
  lastReviewed: string | null;
  /** Original draft filename, for tracing back to the writing pipeline. */
  sourceFileName?: string;
};

// Every content JSON is pulled in at build time.
const modules = import.meta.glob<{ default: Article }>("../columns/*.json", {
  eager: true,
});

const allArticles: Article[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => {
    // featured first -> newest published -> highest issue number
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    if (db !== da) return db - da;
    return b.issueNumber - a.issueNumber;
  });

export function getAllArticles(): Article[] {
  return allArticles;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return allArticles.find((a) => a.slug === slug);
}

export function formatDate(value: string | null, long = false): string {
  if (!value) return long ? "Unpublished" : "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return long ? "Unpublished" : "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}
