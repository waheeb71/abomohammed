// Builds numbered contact sheets from the source photos so they can be
// reviewed and categorised quickly. Output goes to .tmp/sheets/.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = "image";
const OUT = ".tmp/sheets";
const PER_SHEET = 12;
const COLS = 4;
const CELL_W = 480;
const CELL_H = 340;

await fs.mkdir(OUT, { recursive: true });

const files = (await fs.readdir(SRC))
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort();

const index = [];
const cells = [];

for (let i = 0; i < files.length; i++) {
  const n = String(i + 1).padStart(2, "0");
  index.push({ n, file: files[i] });
  const buf = await sharp(path.join(SRC, files[i]))
    .resize(CELL_W - 16, CELL_H - 40, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
  const meta = await sharp(buf).metadata();
  cells.push({ n, buf, w: meta.width, h: meta.height, i });
}

const sheets = Math.ceil(cells.length / PER_SHEET);
for (let s = 0; s < sheets; s++) {
  const batch = cells.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const rows = Math.ceil(batch.length / COLS);
  const W = COLS * CELL_W;
  const H = rows * CELL_H;
  const comps = batch.map((c, k) => {
    const col = k % COLS;
    const row = Math.floor(k / COLS);
    return {
      input: c.buf,
      left: col * CELL_W + Math.round((CELL_W - c.w) / 2),
      top: row * CELL_H + 34 + Math.round((CELL_H - 44 - c.h) / 2),
    };
  });
  const labels = batch
    .map((c, k) => {
      const col = k % COLS;
      const row = Math.floor(k / COLS);
      return `<text x="${col * CELL_W + 12}" y="${row * CELL_H + 25}" font-family="Arial" font-size="20" fill="#e6b86a">#${c.n}</text>`;
    })
    .join("");
  await sharp({
    create: { width: W, height: H, channels: 3, background: "#101314" },
  })
    .composite([...comps, { input: Buffer.from(`<svg width="${W}" height="${H}">${labels}</svg>`), left: 0, top: 0 }])
    .jpeg({ quality: 72 })
    .toFile(path.join(OUT, `sheet-${s + 1}.jpg`));
}

await fs.writeFile(path.join(OUT, "index.json"), JSON.stringify(index, null, 2));
console.log(`sheets: ${sheets}, photos: ${files.length}`);
console.log(index.map((x) => `${x.n} ${x.file}`).join("\n"));
