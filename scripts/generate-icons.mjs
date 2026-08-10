/**
 * Generates minimal PWA PNG icons for NEXUS.
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPng(size) {
  const bg = { r: 5, g: 5, b: 8 };
  const primary = { r: 124, g: 58, b: 237 };
  const secondary = { r: 34, g: 211, b: 238 };

  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const i = rowStart + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = bg.r, g = bg.g, b = bg.b;

      if (dist < radius) {
        r = 12; g = 12; b = 18;
      }
      if (dist < radius && dist > radius - size * 0.02) {
        r = primary.r; g = primary.g; b = primary.b;
      }
      if (Math.abs(dx) < size * 0.08 && Math.abs(dy) < size * 0.22) {
        r = primary.r; g = primary.g; b = primary.b;
      }
      const sdx = x - size * 0.74;
      const sdy = y - size * 0.26;
      if (sdx * sdx + sdy * sdy < (size * 0.04) ** 2) {
        r = secondary.r; g = secondary.g; b = secondary.b;
      }

      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = 255;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = createPng(size);
  const path = join(outDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`Wrote ${path} (${png.length} bytes)`);
}
