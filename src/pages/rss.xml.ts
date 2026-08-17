import type { APIRoute } from "astro";
import { getAllArticles } from "../data/articles";
import { site, getSection } from "../data/site";

function escapeXml(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c
  );
}

export const GET: APIRoute = ({ site: astroSite }) => {
  const base = (astroSite?.toString() ?? site.url).replace(/\/$/, "");
  const items = getAllArticles()
    .slice(0, 30)
    .map(
      (a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${base}/columns/${a.slug}/</link>
      <guid isPermaLink="true">${base}/columns/${a.slug}/</guid>
      <description>${escapeXml(a.excerpt)}</description>
      <category>${escapeXml(getSection(a.section).label)}</category>
      <category>${escapeXml(a.category)}</category>${
        a.publishedAt ? `\n      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ""
      }
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${base}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en-US</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
