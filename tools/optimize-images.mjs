// Optimises the WhatsApp photos into responsive WebP files.
// Run: node tools/optimize-images.mjs
// Output: assets/img/projects/<category>/<category>-<n>-<width>.webp
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = "image";
const OUT = "assets/img/projects";
const WIDTHS = [480, 960, 1600];
const projects = JSON.parse(await fs.readFile("src/data/projects.json", "utf8"));

let count = 0;
let bytes = 0;

for (const p of projects) {
  const src = path.join(SRC, p.file);
  const dir = path.join(OUT, p.cat);
  await fs.mkdir(dir, { recursive: true });

  const meta = await sharp(src).metadata();
  for (const w of WIDTHS) {
    if (w > meta.width + 40) continue; // never upscale
    const width = Math.min(w, meta.width);
    const dest = path.join(dir, `${p.cat}-${String(p.n).padStart(2, "0")}-${w}.webp`);
    const info = await sharp(src)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 74, effort: 5, smartSubsample: true })
      .toFile(dest);
    count++;
    bytes += info.size;
  }
}

// Homepage hero: the warm curved glass staircase photo, cropped tall.
await fs.mkdir("assets/img/hero", { recursive: true });
for (const w of [720, 1080, 1440]) {
  await sharp(path.join(SRC, projects.find((p) => p.n === 51).file))
    .rotate()
    .resize({ width: w, height: Math.round(w * 1.22), fit: "cover", position: "centre" })
    .webp({ quality: 78, effort: 5 })
    .toFile(`assets/img/hero/hero-glass-railings-${w}.webp`);
}

// Open Graph cover (photo + dark scrim is added on the page, text is real HTML).
await sharp(path.join(SRC, projects.find((p) => p.n === 20).file))
  .rotate()
  .resize({ width: 1200, height: 630, fit: "cover", position: "centre" })
  .jpeg({ quality: 82 })
  .toFile("assets/img/og-raw.jpg");

console.log(`images: ${count}, total ${(bytes / 1024 / 1024).toFixed(1)} MB`);
