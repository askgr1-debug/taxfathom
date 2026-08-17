# TaxAtlas — working rules

Astro static site publishing plain-English columns on **U.S. federal tax** rules.
Audience: U.S. readers, in English. Revenue: display ads, affiliate links,
newsletter. Not a lead generator for any firm.

## Hard rules — never break these

1. **No credential may be claimed.** The author, Jaehyung Ahn, is not a CPA,
   enrolled agent or tax attorney. Never write "as your CPA", "our tax
   advisors", "we can review your return", or anything implying representation
   before the IRS. `scripts/check-articles.mjs` fails the build on these.

   The author works at a tax accounting firm in South Korea, as an employee —
   not as a licensed Korean tax accountant. That fact is stated once on the
   About page and nowhere else. In columns: never render it as a title
   ("tax accountant", "tax professional"), never name the firm, and never
   claim practice experience ("in my practice", "my clients"). Korean
   employment confers no standing in U.S. tax, and any mention must say so.
2. **Every factual claim traces to a primary source.** `sources[]` is required
   and must point at irs.gov, law.cornell.edu, ecfr.gov, govinfo.gov,
   federalregister.gov, congress.gov, ssa.gov or fincen.gov. Never cite another
   blog, and never invent a publication number, Code section or dollar figure.
   If a number cannot be verified at the source, leave it out.
3. **Federal by default.** If a column touches state law, say so explicitly.
4. **No advice framing.** Describe what the rule is, not what the reader should
   do with their own return. "The deadline is X" — not "you should elect X".
5. **Year-specific columns carry `taxYear` and `lastReviewed`.** Update
   `lastReviewed` whenever the rules are re-checked, not on cosmetic edits.

## One column, one question

`keyQuestion` is the unit that AI answer engines match a user query against.
It must be a single real question a filer would type, ending in "?". The
`excerpt` answers it in under 160 characters. The first paragraph of
`bodyHtml` answers it again, in full, before any explanation — an engine that
reads only the opening should still get the right answer.

Do not write a column that answers three questions. Write three columns and link
them; that is how the topic cluster gets built.

## Getting a column into the site

Most columns arrive from the writing workflow at `D:\TAX_Writing`:

```bash
npm run import        # output/<ts>_<slug>.{html,md,meta.json} -> src/columns/<slug>.json
npm run check
```

To write one by hand instead:

```bash
npm run new -- "<slug>" <selfemployed|crossborder|property|personal>
# fill in the JSON, then:
npm run check
```

Never hand-edit an imported column's `bodyHtml` and leave the upstream draft
behind — fix it in `D:\TAX_Writing\output` and re-import with `--force`, or the
next import silently diverges from what the workflow believes it published.

Fields that matter most:

| Field | Rule |
|---|---|
| `title` | Under 60 chars. Specific. Include the year when the answer is year-bound. |
| `keyQuestion` | One question, ends in "?". |
| `excerpt` | Answers the question. Under 160 chars. |
| `bodyHtml` | Answer first. Available blocks: `.highlight-box`, `.warning-box`, `.source-box` + `.source-label`, `.table-wrap`. |
| `faqItems` | At least 2, ideally 4. These become FAQPage structured data — the highest-value AI-citation surface on the page. |
| `sources` | At least 1, primary hosts only, with `detail` naming the exact chapter or subsection used. |
| `category` | Must be one of the list in `src/data/site.ts`. |

## Voice

Direct and specific. Short sentences. Lead with the answer, then the mechanism,
then the edge cases. State uncertainty plainly rather than hedging everything —
"the rule is X; whether it applies to a partnership is unsettled" beats
"generally, it may be the case that...". No filler openers, no "in today's
complex tax landscape".

## Structure and deploy

- Column JSON lives in `src/columns/*.json` (filename must equal `slug`).
- `npm run build` runs the validator first and refuses to build on failure.
- `publish.ps1` validates → commits → pushes; Cloudflare Pages deploys.
- Never commit `dist/` or `node_modules/`.
