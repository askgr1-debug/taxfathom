# TaxAtlas

Plain-English columns on U.S. federal tax rules. Astro static site, deployed to
Cloudflare Pages from GitHub.

**Domain:** taxatlas.com (verify it is still unregistered and clear the name at
[USPTO TESS](https://tmsearch.uspto.gov/) before buying).

## Structure

```
src/
  columns/*.json          # one column = one JSON file (the build source, committed)
  data/
    site.ts              # site identity, author, the four sections, topic list
    articles.ts          # Article type + loader + date formatting
    cta.ts               # newsletter CTA per section
  layouts/ components/   # Base layout, header, footer, Sources, Disclaimer
  pages/
    index.astro          # hub: lead column, section/topic filters, search
    columns/[slug].astro  # column page (Article + FAQPage + Breadcrumb JSON-LD)
    about / disclaimer / privacy / 404
    rss.xml.ts llms.txt.ts
  styles/global.css      # newsroom design system
scripts/
  import-drafts.mjs      # D:\TAX_Writing output -> src/columns/*.json
  new-article.mjs        # scaffold a column JSON by hand
  check-articles.mjs     # build guard — schema, sources, forbidden claims
  make-og.mjs            # regenerate the placeholder OG image
publish.ps1              # import -> validate -> commit -> push -> Cloudflare
```

## Where the writing happens

Drafts are written by the workflow at `D:\TAX_Writing`, which emits three files
per article into its `output/` folder (`<ts>_<slug>.html` / `.md` /
`.meta.json`). `npm run import` turns each triple into one column JSON:

- body comes from the `.html` so inline SVG infographics survive;
- preview chrome and the FAQ / sources / disclaimer sections are stripped,
  because this site renders those from structured data instead;
- `meta.category` maps to a section + topic via the table at the top of
  `scripts/import-drafts.mjs` — edit there when either side gains a value;
- existing columns are skipped unless you pass `--force`, and a re-import keeps
  the original `publishedAt`.

Unresolved `{{TOKEN}}` values from the writing workflow's `config/brand.md`
survive into the JSON on purpose, and `npm run check` warns about them.

## The one rule that runs the site

No professional credential is claimed here, so **the citations are the
authority**. `scripts/check-articles.mjs` fails the build if a column has no
`sources[]`, if a source points anywhere other than a primary host (irs.gov,
law.cornell.edu, ecfr.gov, govinfo.gov, federalregister.gov, congress.gov,
ssa.gov, fincen.gov), or if any text claims a CPA/EA/attorney title.

## Workflow

```bash
npm install
npm run import                                                 # pull new drafts
npm run new -- "s-corp-election-deadline-2026" selfemployed    # or scaffold by hand
npm run check                                                  # validate
npm run dev                                                    # http://localhost:4321
npm run build                                                  # validate + build to dist/
```

Publishing: `powershell -ExecutionPolicy Bypass -File D:\TAX_BLOG\publish.ps1`
— imports, validates, commits, pushes; Cloudflare deploys in 1–3 minutes.

## Deploy (Cloudflare Pages)

- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Set the custom domain after DNS is pointed at Cloudflare.

## Before the first publish

- [ ] Buy the domain; confirm the trademark is clear.
- [ ] Confirm the LinkedIn profile's display name matches `author.name`
      exactly. `sameAs` only corroborates the byline if a crawler following
      the link finds the same name. Changing the vanity URL again means
      updating `author.sameAs` in `src/data/site.ts` to match.
- [ ] Point `NEWSLETTER_ACTION` in `src/data/cta.ts` at a real provider endpoint.
- [ ] Replace `public/og-default.png` with a designed 1200×630 card
      (`node scripts/make-og.mjs` only paints a branded placeholder).
- [ ] Rewrite `src/pages/privacy.astro` to match the analytics, ad network and
      newsletter provider you actually use.
- [ ] `git init`, push to GitHub, connect Cloudflare Pages.
- [ ] Verify the site in Google Search Console and Bing Webmaster Tools.

## Content plan

Sections launch in order, narrow first — a new domain in a YMYL category cannot
win broad personal-tax queries on day one.

1. **Self-Employed** — year-round demand, real affiliate inventory, least
   crowded of the high-value clusters.
2. **Cross-Border** — FBAR/FATCA/treaty; low competition, defensible.
3. **Property** — high value, needs accumulated authority first.
4. **Personal** — the most contested segment; enter last.
