/**
 * Generates public/og-default.png — the 1200x630 social card.
 *
 *   node scripts/make-og.mjs
 *
 * An editorial "newsroom" card in the site's own palette. No photograph,
 * nothing copyrighted: just the wordmark, the tagline, and the fathom
 * sounding-line motif from the favicon, so the link preview reads as
 * TaxFathom and nothing else. Re-run after changing the name or tagline.
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The site's serif is Source Serif 4; Georgia is its documented fallback and
// is present on this box, so the card stays on-brand without shipping a font.
const FONTS = "C:/Windows/Fonts";
GlobalFonts.registerFromPath(`${FONTS}/georgia.ttf`, "OG Serif");
GlobalFonts.registerFromPath(`${FONTS}/georgiab.ttf`, "OG Serif Bold");
GlobalFonts.registerFromPath(`${FONTS}/georgiai.ttf`, "OG Serif Italic");
GlobalFonts.registerFromPath(`${FONTS}/consola.ttf`, "OG Mono");

const W = 1200;
const H = 630;

// Palette — lifted straight from src/styles/global.css.
const PAPER = "#f6f5f1";
const INK = "#171917";
const MUTE = "#535650";
const BORDER = "#d5d6cf";
const ACCENT = "#e85316";

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Paper
ctx.fillStyle = PAPER;
ctx.fillRect(0, 0, W, H);

// Masthead top rule (thick ink bar, the way a newspaper nameplate sits)
ctx.fillStyle = INK;
ctx.fillRect(0, 0, W, 12);

// Inset hairline frame
ctx.strokeStyle = BORDER;
ctx.lineWidth = 1;
ctx.strokeRect(48.5, 48.5, W - 97, H - 97);

const PAD = 96;

// Eyebrow — mono, tracked, muted (the label voice used across the site)
ctx.fillStyle = MUTE;
ctx.font = "22px 'OG Mono'";
ctx.textBaseline = "alphabetic";
letterspaced(ctx, "U.S. FEDERAL TAX — EXPLAINED, WITH THE SOURCE", PAD, 168, 3.5);

// Wordmark
ctx.fillStyle = INK;
ctx.font = "112px 'OG Serif Bold'";
ctx.fillText("TaxFathom", PAD - 4, 300);

// Accent rule under the wordmark
ctx.fillStyle = ACCENT;
ctx.fillRect(PAD, 330, 132, 5);

// Tagline — serif italic, ink-soft
ctx.fillStyle = "#2c2f2b";
ctx.font = "italic 44px 'OG Serif Italic'";
ctx.fillText("U.S. tax rules, read at the source.", PAD, 410);

// Supporting line — the actual promise of the site
ctx.fillStyle = MUTE;
ctx.font = "26px 'OG Serif'";
ctx.fillText(
  "Every claim cited to an IRS publication or the Internal Revenue Code.",
  PAD,
  456
);

// Footer: domain (left) + sounding-line motif (right)
ctx.fillStyle = INK;
ctx.font = "24px 'OG Mono'";
letterspaced(ctx, "taxfathom.com", PAD, H - 96, 2);

drawSoundings(ctx, W - PAD - 150, H - 200, 150);

const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/og-default.png"
);
writeFileSync(out, canvas.toBuffer("image/png"));
console.log(`wrote ${out} (${W}x${H})`);

// --- helpers ---

/** Draw text with manual letter spacing (canvas has no tracking). */
function letterspaced(ctx, text, x, y, spacing) {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
}

/** The favicon's motif: a surface line, then soundings fading into depth. */
function drawSoundings(ctx, x, y, w) {
  const rows = [
    { dy: 0, color: PAPER === PAPER ? "#171917" : "#171917", alpha: 1, wr: 1.0 },
    { dy: 26, color: ACCENT, alpha: 1.0, wr: 0.82 },
    { dy: 50, color: ACCENT, alpha: 0.72, wr: 0.64 },
    { dy: 74, color: ACCENT, alpha: 0.45, wr: 0.46 },
  ];
  ctx.save();
  ctx.lineCap = "square";
  for (const r of rows) {
    ctx.globalAlpha = r.alpha;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 6;
    const rw = w * r.wr;
    const cx = x + (w - rw) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, y + r.dy);
    ctx.lineTo(cx + rw, y + r.dy);
    ctx.stroke();
  }
  ctx.restore();
}
