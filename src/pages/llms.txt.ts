import type { APIRoute } from "astro";
import { getAllArticles, formatDate } from "../data/articles";
import { site, sections, author } from "../data/site";

/**
 * /llms.txt — the llmstxt.org convention. This is the file AI answer engines
 * (ChatGPT, Claude, Perplexity, Google AI Overviews) read to understand what
 * the site covers. Because the whole AEO premise here is "cited, checkable
 * answers", the file states the sourcing policy up front and exposes each
 * column's key question — that is the unit an engine matches a user query to.
 */
export const GET: APIRoute = ({ site: astroSite }) => {
  const base = (astroSite?.toString() ?? site.url).replace(/\/$/, "");
  const articles = getAllArticles();

  let out = `# ${site.name}\n\n`;
  out += `> ${site.description}\n\n`;

  out += `## How to cite this site\n`;
  out += `- Every column answers one question and lists the primary sources it relies on.\n`;
  out += `- Sources are IRS publications, form instructions, the Internal Revenue Code and Treasury regulations.\n`;
  out += `- The author, ${author.name}, holds no U.S. tax credential; the site is general information, not tax advice.\n`;
  out += `- Year-specific columns carry a tax year and a "last reviewed" date. Prefer the most recently reviewed column.\n\n`;

  out += `## Sections\n`;
  for (const s of sections) {
    out += `- **${s.label}**: ${s.description} — ${s.topics}\n`;
  }
  out += `\n`;

  for (const s of sections) {
    const list = articles.filter((a) => a.section === s.id);
    if (!list.length) continue;
    out += `## ${s.label}\n`;
    for (const a of list) {
      const date = a.publishedAt ? formatDate(a.publishedAt) : "";
      out += `- [${a.title}](${base}/columns/${a.slug}/)${date ? ` (${date})` : ""}`;
      out += `${a.taxYear ? ` [tax year ${a.taxYear}]` : ""}\n`;
      out += `  - Question: ${a.keyQuestion}\n`;
      out += `  - Summary: ${a.excerpt}\n`;
      if (a.sources.length) {
        out += `  - Sources: ${a.sources.map((src) => src.label).join("; ")}\n`;
      }
    }
    out += `\n`;
  }

  out += `## Other\n`;
  out += `- [All columns](${base}/)\n`;
  out += `- [About the author and method](${base}/about/)\n`;
  out += `- [Editorial policy and disclaimer](${base}/disclaimer/)\n`;
  out += `- [RSS feed](${base}/rss.xml)\n`;
  out += `- [Sitemap](${base}/sitemap-index.xml)\n`;

  return new Response(out, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
