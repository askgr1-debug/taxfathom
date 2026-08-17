/**
 * Generates public/og-default.jpg as a plain branded PNG (renamed .jpg is not
 * OK, so it writes .png and Base.astro points at it). This is a placeholder so
 * social cards are not broken on day one — replace it with a designed image.
 *
 *   node scripts/make-og.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const W = 1200;
const H = 630;
const BG = [0xf6, 0xf5, 0xf1]; // --background
const ACCENT = [0xe8, 0x53, 0x16]; // --accent
const BAR_TOP = H - 96;

// Raw RGB scanlines, each prefixed with a filter byte (0 = none).
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  const rowStart = y * (1 + W * 3);
  raw[rowStart] = 0;
  const color = y >= BAR_TOP ? ACCENT : BG;
  for (let x = 0; x < W; x++) {
    const i = rowStart + 1 + x * 3;
    raw[i] = color[0];
    raw[i + 1] = color[1];
    raw[i + 2] = color[2];
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/og-default.png"
);
writeFileSync(out, png);
console.log(`wrote ${out} (${W}x${H}, ${png.length} bytes)`);
console.log("placeholder only — replace with a designed 1200x630 card before launch");
