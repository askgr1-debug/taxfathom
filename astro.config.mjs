// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Production domain — canonical URLs, sitemap and RSS are all built from this.
const SITE = "https://taxfathom.com";

// Tax rules change; a column's lastReviewed date is the honest lastmod signal.
const contentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src/columns");
const lastmodBySlug = new Map();
if (existsSync(contentDir)) {
  for (const f of readdirSync(contentDir).filter((f) => f.endsWith(".json"))) {
    try {
      const a = JSON.parse(readFileSync(path.join(contentDir, f), "utf8"));
      const stamp = a.lastReviewed ?? a.publishedAt;
      if (a.slug && stamp) lastmodBySlug.set(a.slug, stamp);
    } catch {
      /* noop */
    }
  }
}

export default defineConfig({
  site: SITE,
  trailingSlash: "ignore",
  integrations: [
    sitemap({
      serialize(item) {
        const m = item.url.match(/\/columns\/([^/]+)\/?$/);
        const slug = m ? decodeURIComponent(m[1]) : null;
        const lastmod = slug ? lastmodBySlug.get(slug) : null;
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  build: {
    format: "directory",
  },
});
