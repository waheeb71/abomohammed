// يبني صورة المشاركة (1200×630) من صورة المشروع + طبقة SVG.
// التشغيل: node tools/make-og.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;

const overlay = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#0b0d0e" stop-opacity="0.97"/>
      <stop offset="0.46" stop-color="#0b0d0e" stop-opacity="0.9"/>
      <stop offset="0.68" stop-color="#0b0d0e" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#0b0d0e" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#0b0d0e" stop-opacity="0"/>
      <stop offset="1" stop-color="#0b0d0e" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#bottom)"/>

  <g transform="translate(1048 66)">
    <rect x="0" y="0" width="88" height="88" fill="none" stroke="#f6f3ec" stroke-width="2"/>
    <rect x="10" y="10" width="30" height="68" fill="none" stroke="#f6f3ec" stroke-width="1.6"/>
    <rect x="48" y="10" width="30" height="68" fill="none" stroke="#f6f3ec" stroke-width="1.6"/>
    <path d="M10 10 78 78" stroke="#c19a55" stroke-width="2.4"/>
  </g>

  <g font-family="Segoe UI, Tahoma, sans-serif" direction="rtl" text-anchor="start">
    <text x="1136" y="212" fill="#c19a55" font-size="23" letter-spacing="0.5">الرياض — تنفيذ وتركيب</text>
    <text x="1136" y="300" fill="#f6f3ec" font-size="66" font-weight="700">زجاج سكريت وواجهات</text>
    <text x="1136" y="382" fill="#f6f3ec" font-size="66" font-weight="700">وألمنيوم على المقاس</text>
    <text x="1136" y="450" fill="#cfc9bd" font-size="24">أبواب · قواطع · درابزين · واجهات محلات · مرايا</text>
    <text x="1136" y="492" fill="#cfc9bd" font-size="24">معاينة وقياس وعرض سعر واضح في الرياض</text>
    <rect x="1072" y="532" width="64" height="3" fill="#c19a55"/>
    <text x="1136" y="584" fill="#f6f3ec" font-size="24" font-weight="600">أبو محمد للزجاج والألمنيوم</text>
  </g>
</svg>`;

const base = await sharp("assets/img/hero/hero-glass-railings-1080.webp")
  .resize(W, H, { fit: "cover", position: "centre" })
  .toBuffer();

// الصورة في الجهة اليسرى: اقلبها أفقيًا حتى يظهر الدرج بعيدًا عن النص.
const flipped = await sharp(base).flop().toBuffer();

await sharp(flipped)
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile("assets/img/og-cover.jpg");

console.log("og-cover.jpg created");
