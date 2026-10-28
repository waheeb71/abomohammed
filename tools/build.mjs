// ==========================================================================
// مولّد الموقع — يقرأ المقاطع من src/pages ويبني صفحات HTML ثابتة في الجذر.
// التشغيل: node tools/build.mjs
// ==========================================================================
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const PAGES = path.join(SRC, "pages");
const config = JSON.parse(await fs.readFile(path.join(ROOT, "site.config.json"), "utf8"));
const projects = JSON.parse(await fs.readFile(path.join(SRC, "data", "projects.json"), "utf8"));
const services = JSON.parse(await fs.readFile(path.join(SRC, "data", "services.json"), "utf8"));

const BASE_URL = config.domain.replace(/\/$/, "");
const PHONE_DISPLAY = config.phoneDisplay;
const PHONE_E164 = config.phoneE164;
const WA = config.whatsapp;
const WA_LINK = `https://wa.me/${WA}?text=${encodeURIComponent("السلام عليكم، أرغب بعرض سعر لمشروع زجاج/ألمنيوم في الرياض.")}`;

const CATS = {
  railings: "درابزين زجاج",
  balustrades: "حواجز وأسطح",
  facades: "واجهات زجاجية",
  doors: "أبواب ومحلات",
  partitions: "قواطع زجاجية",
  mirrors: "مرايا",
  showers: "شاور زجاج",
  material: "توريد زجاج",
};

const dimCache = new Map();
async function dims(p) {
  if (!dimCache.has(p)) {
    const m = await sharp(path.join(ROOT, p)).metadata();
    dimCache.set(p, { w: m.width, h: m.height });
  }
  return dimCache.get(p);
}

const esc = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const widthCache = new Map();
function availableWidths(p) {
  if (!widthCache.has(p)) {
    const dir = path.posix.dirname(p);
    const base = path.posix.basename(p).replace(/-\d+\.webp$/, "");
    widthCache.set(
      p,
      [480, 960, 1600].filter((w) => fsSync.existsSync(path.join(ROOT, `${dir}/${base}-${w}.webp`)))
    );
  }
  return widthCache.get(p);
}

function srcset(p, widths = availableWidths(p)) {
  const dir = path.posix.dirname(p);
  const base = path.posix.basename(p).replace(/-\d+\.webp$/, "");
  return widths.map((w) => `${dir}/${base}-${w}.webp ${w}w`).join(", ");
}

function pickWidth(p, want = 960) {
  const list = availableWidths(p);
  return list.includes(want) ? want : list[list.length - 1] || 480;
}

async function imgTag(p, { alt, sizes, cls = "", loading = "lazy", w = 960, prefix = "{{BASE}}" } = {}) {
  const width = pickWidth(p, w);
  const { w: iw, h: ih } = await dims(p.replace(/-\d+\.webp$/, `-${width}.webp`));
  const set = srcset(p)
    .split(", ")
    .map((s) => prefix + s)
    .join(", ");
  return `<img src="${prefix}${imgPath(p, width)}" srcset="${set}" sizes="${sizes}" width="${iw}" height="${ih}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ""} loading="${loading}" decoding="async">`;
}

function imgPath(p, suffix = 960) {
  return p.replace(/-\d+\.webp$/, `-${suffix}.webp`);
}

function projectPath(pr, width) {
  return `assets/img/projects/${pr.cat}/${pr.cat}-${String(pr.n).padStart(2, "0")}-${width}.webp`;
}

async function workFigure(pr, { wide = false, sizes = "(max-width: 900px) 100vw, 33vw", loading = "lazy", href = "{{BASE}}works.html" } = {}) {
  const p = projectPath(pr, 960);
  return `<a class="work${wide ? " work--wide" : ""}" href="${href}">
  ${await imgTag(p, { alt: pr.alt, sizes, loading })}
  <figcaption><span class="work__cat">${CATS[pr.cat]}</span>${pr.caption}</figcaption>
</a>`;
}

function galleryItem(pr) {
  const base = projectPath(pr, 960);
  const full = projectPath(pr, pickWidth(base, 1600));
  const set = srcset(base)
    .split(", ")
    .map((s) => "{{BASE}}" + s)
    .join(", ");
  return `<button type="button" class="gallery__item" data-cat="${pr.cat}" data-full="{{BASE}}${full}" data-caption="${esc(pr.caption)}" aria-label="عرض صورة: ${esc(pr.caption)}">
  <img src="{{BASE}}${projectPath(pr, pickWidth(base, 480))}" srcset="${set}" sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw" width="480" height="600" alt="${esc(pr.alt)}" loading="lazy" decoding="async">
  <span class="gallery__cap">${pr.caption}</span>
</button>`;
}

async function renderWorks(cat, limit = 3, opts = {}) {
  const list = projects.filter((p) => (cat === "all" ? true : p.cat === cat)).slice(0, limit);
  const out = [];
  for (const pr of list) out.push(await workFigure(pr, opts));
  return out.join("\n");
}

function renderGallery() {
  return projects.map(galleryItem).join("\n");
}

function servicesGrid() {
  return services
    .map(
      (s, i) => `<article class="service-card" data-reveal>
  <div class="service-card__top">
    <svg class="service-card__icon" aria-hidden="true"><use href="#${s.icon}"/></svg>
    <span class="service-card__num">${String(i + 1).padStart(2, "0")}</span>
  </div>
  <h3><a href="{{BASE}}services/${s.slug}.html">${s.title}</a></h3>
  <p>${s.short}</p>
  <a class="link-arrow" href="{{BASE}}services/${s.slug}.html">تفاصيل الخدمة <svg width="15" height="15" aria-hidden="true"><use href="#i-arrow"/></svg></a>
</article>`
    )
    .join("\n");
}

function serviceSide(currentSlug) {
  const others = services.filter((s) => s.slug !== currentSlug).slice(0, 6);
  return `<aside class="service-side">
  <div class="side-card">
    <h2>عندك مشروع في الرياض؟</h2>
    <p>أرسل صورة المكان أو المقاس التقريبي، ونعطيك تصورًا واضحًا للسعر والتنفيذ.</p>
    <a class="btn btn--brass" href="{{WA_LINK}}" target="_blank" rel="noopener">
      <svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"/></svg> واتساب مباشر
    </a>
    <a class="btn btn--light" href="tel:{{PHONE_E164}}">
      <svg width="17" height="17" aria-hidden="true"><use href="#i-phone"/></svg> <span dir="ltr">{{PHONE}}</span>
    </a>
    <small>معاينة وقياس داخل الرياض</small>
  </div>

  <div class="side-list">
    <h2>خدمات أخرى</h2>
    <ul>
      ${others
        .map(
          (s) => `<li><a href="{{BASE}}services/${s.slug}.html">${s.title} <svg width="14" height="14" aria-hidden="true"><use href="#i-arrow"/></svg></a></li>`
        )
        .join("\n      ")}
    </ul>
  </div>
</aside>`;
}

function ctaBand() {
  return `<section class="cta-band">
  <div class="wrap cta-band__inner">
    <div>
      <p class="kicker">الخطوة التالية</p>
      <h2>أرسل صورة المكان أو المقاس على واتساب</h2>
      <p>نراجع الطلب، نحدد إن كانت هناك حاجة لمعاينة، ونرسل عرض سعر واضحًا قبل أي التزام.</p>
    </div>
    <div class="cta-band__actions">
      <a class="btn btn--brass" href="{{WA_LINK}}" target="_blank" rel="noopener">
        <svg width="19" height="19" aria-hidden="true"><use href="#i-whatsapp"/></svg> واتساب مباشر
      </a>
      <a class="btn btn--light" href="tel:{{PHONE_E164}}">
        <svg width="18" height="18" aria-hidden="true"><use href="#i-phone"/></svg> <span dir="ltr">{{PHONE}}</span>
      </a>
      <small>أو املأ <a href="{{BASE}}contact.html" style="color:inherit;text-decoration:underline">نموذج طلب العرض</a></small>
    </div>
  </div>
</section>`;
}

function sprite() {
  return fsSync.readFileSync(path.join(SRC, "partials", "sprite.svg"), "utf8");
}

const NAV = [
  { href: "", label: "الرئيسية", key: "home" },
  { href: "services/", label: "الخدمات", key: "services" },
  { href: "works.html", label: "أعمالنا", key: "works" },
  { href: "areas.html", label: "مناطق الخدمة", key: "areas" },
  { href: "blog/", label: "المدونة", key: "blog" },
  { href: "contact.html", label: "تواصل معنا", key: "contact" },
];

function header(navKey, base) {
  const links = NAV.map(
    (n) =>
      `<li><a href="${base}${n.href}"${n.key === navKey ? ' aria-current="page"' : ""}>${n.label}</a></li>`
  ).join("\n            ");
  return `<header class="site-header" id="top">
  <div class="wrap header-inner">
    <a class="brand" href="${base}" aria-label="${config.brand} — الصفحة الرئيسية">
      ${brandMark()}
      <span class="brand__text">
        <span class="brand__name">${config.brandShort} للزجاج والألمنيوم</span>
        <span class="brand__tag">الرياض — تنفيذ وتركيب</span>
      </span>
    </a>

    <nav class="main-nav" aria-label="القائمة الرئيسية">
      <ul>
            ${links}
      </ul>
    </nav>

    <div class="header-cta">
      <a class="header-phone" href="tel:${PHONE_E164}">
        <svg width="16" height="16" aria-hidden="true"><use href="#i-phone"/></svg>
        <span dir="ltr">${PHONE_DISPLAY}</span>
      </a>
      <a class="btn btn--brass btn--sm" href="${WA_LINK}" target="_blank" rel="noopener">
        <svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"/></svg>
        اطلب عرض سعر
      </a>
    </div>

    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="فتح القائمة">
      <span></span>
    </button>
  </div>
</header>

<div class="mobile-nav" id="mobile-nav" hidden>
  <nav aria-label="قائمة الجوال">
    <ul>
      ${NAV.map((n) => `<li><a href="${base}${n.href}"${n.key === navKey ? ' aria-current="page"' : ""}>${n.label}<svg width="18" height="18" aria-hidden="true"><use href="#i-chevron"/></svg></a></li>`).join("\n      ")}
    </ul>
  </nav>
  <a class="btn btn--brass" href="${WA_LINK}" target="_blank" rel="noopener">
    <svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"/></svg> راسلنا على واتساب
  </a>
  <a class="btn btn--ghost" href="tel:${PHONE_E164}">
    <svg width="18" height="18" aria-hidden="true"><use href="#i-phone"/></svg> <span dir="ltr">${PHONE_DISPLAY}</span>
  </a>
  <p class="mobile-nav__meta">${config.city} — كافة الأحياء، على مدار الساعة ٢٤/٧</p>
</div>`;
}

function brandMark() {
  return `<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
    <rect x="1" y="1" width="46" height="46" fill="none" stroke="#0b0d0e" stroke-width="1.5"/>
    <rect x="9" y="9" width="14" height="30" fill="none" stroke="#0b0d0e" stroke-width="1.2"/>
    <rect x="25" y="9" width="14" height="30" fill="none" stroke="#0b0d0e" stroke-width="1.2"/>
    <path d="M9 9 39 39" stroke="#c19a55" stroke-width="1.4"/>
  </svg>`;
}

function footer(base) {
  const services = [
    ["services/glass-sikurit.html", "زجاج سكريت"],
    ["services/glass-railings.html", "درابزين وحواجز زجاجية"],
    ["services/glass-facades.html", "واجهات زجاجية"],
    ["services/aluminum.html", "أعمال الألمنيوم"],
    ["services/mirrors.html", "مرايا ديكور"],
    ["services/cladding.html", "كلادينج وواجهات"],
    ["services/stainless-steel.html", "ستانلس ستيل"],
    ["services/shop-fitout.html", "ديكورات المحلات"],
    ["services/supermarket-fitout.html", "تجهيز سوبر ماركت"],
  ];
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="brand" href="${base}">
          ${brandMark()}
          <span class="brand__text">
            <span class="brand__name">${config.brandShort} للزجاج والألمنيوم</span>
            <span class="brand__tag">الرياض — تنفيذ وتركيب</span>
          </span>
        </a>
        <p class="footer-note">تنفيذ وتركيب الزجاج السكريت، الواجهات، الألمنيوم، المرايا، الكلادينج، الستانلس ستيل، وتجهيز المحلات والسوبر ماركت في الرياض.</p>
      </div>

      <div>
        <h3>الخدمات</h3>
        <ul>
          ${services.slice(0, 6).map(([h, l]) => `<li><a href="${base}${h}">${l}</a></li>`).join("\n          ")}
        </ul>
      </div>

      <div>
        <h3>روابط سريعة</h3>
        <ul>
          <li><a href="${base}works.html">معرض الأعمال</a></li>
          <li><a href="${base}areas.html">مناطق الخدمة في الرياض</a></li>
          <li><a href="${base}blog/">المدونة والأدلة</a></li>
          <li><a href="${base}about.html">من نحن</a></li>
          <li><a href="${base}contact.html">طلب عرض سعر</a></li>
        </ul>
      </div>

      <div>
        <h3>تواصل</h3>
        <div class="footer-contact">
          <a href="tel:${PHONE_E164}"><svg width="16" height="16" aria-hidden="true"><use href="#i-phone"/></svg> <span class="tel">${PHONE_DISPLAY}</span></a>
          <a href="${WA_LINK}" target="_blank" rel="noopener"><svg width="16" height="16" aria-hidden="true"><use href="#i-whatsapp"/></svg> واتساب مباشر</a>
          <a href="${config.mapsUrl}" target="_blank" rel="noopener"><svg width="16" height="16" aria-hidden="true"><use href="#i-pin"/></svg> ${config.city} — موقع العمل</a>
          <span><svg width="16" height="16" aria-hidden="true"><use href="#i-clock"/></svg> على مدار الساعة ٢٤/٧</span>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <span>© <span data-year>2026</span> ${config.brand}. جميع الحقوق محفوظة.</span>
      <nav aria-label="روابط التذييل">
        <a href="${base}services/">كل الخدمات</a>
        <a href="${base}faq.html">الأسئلة الشائعة</a>
        <a href="${base}contact.html">تواصل</a>
      </nav>
    </div>
  </div>
</footer>

<div class="mobile-bar">
  <a href="tel:${PHONE_E164}"><svg width="18" height="18" aria-hidden="true"><use href="#i-phone"/></svg> اتصال</a>
  <a href="${WA_LINK}" target="_blank" rel="noopener"><svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"/></svg> واتساب</a>
</div>`;
}

function businessSchema() {
  const address = {
    "@type": "PostalAddress",
    streetAddress: config.address.street,
    addressLocality: config.city,
    addressRegion: config.address.region,
    addressCountry: "SA",
  };
  if (config.address.postalCode) address.postalCode = config.address.postalCode;

  const hours = config.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days,
    opens: h.open,
    closes: h.close,
  }));

  const sameAs = [config.gbpUrl, ...(config.social || [])].filter(Boolean);

  return `<script type="application/ld+json">
${JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
          "@id": `${BASE_URL}/#business`,
          name: config.brand,
          alternateName: config.brandShort,
          url: `${BASE_URL}/`,
          telephone: PHONE_E164,
          image: `${BASE_URL}/assets/img/og-cover.jpg`,
          logo: `${BASE_URL}/assets/img/logo-512.png`,
          description:
            "تنفيذ وتركيب زجاج السكريت والواجهات الزجاجية وأعمال الألمنيوم والمرايا والكلادينج والستانلس ستيل في الرياض، مع تجهيز وديكور المحلات والسوبر ماركت.",
          address,
          geo: { "@type": "GeoCoordinates", latitude: config.geo.lat, longitude: config.geo.lng },
          hasMap: config.mapsUrl,
          areaServed: [
            { "@type": "City", name: "الرياض" },
            { "@type": "AdministrativeArea", name: "منطقة الرياض" },
          ],
          openingHoursSpecification: hours,
          priceRange: config.priceRange,
          currenciesAccepted: "SAR",
          paymentAccepted: "نقدًا، تحويل بنكي، شبكة",
          knowsLanguage: ["ar", "en"],
          ...(sameAs.length ? { sameAs } : {}),
        },
        {
          "@type": "WebSite",
          "@id": `${BASE_URL}/#website`,
          url: `${BASE_URL}/`,
          name: config.brand,
          inLanguage: "ar-SA",
          publisher: { "@id": `${BASE_URL}/#business` },
        },
      ],
    },
    null,
    2
  )}
</script>`;
}

function pageShell({ title, desc, canonical, base, body, navKey, ogImage, ogType = "website", preload = [], robots = "index, follow, max-image-preview:large" }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#0b0d0e">
<meta name="author" content="${config.brand}">
<meta name="geo.region" content="SA-01">
<meta name="geo.placename" content="${config.city}">

<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="ar_SA">
<meta property="og:site_name" content="${config.brand}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="أعمال زجاج وألمنيوم في الرياض">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">

<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}assets/img/apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preload" href="${base}assets/fonts/alexandria-arabic-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}assets/fonts/alexandria-arabic-800.woff2" as="font" type="font/woff2" crossorigin>
${preload.map((p) => `<link rel="preload" as="image" href="${base}${p}" fetchpriority="high">`).join("\n")}
<link rel="stylesheet" href="${base}assets/css/style.css">
<script>document.documentElement.classList.add("js");</script>
${businessSchema()}
</head>
<body>
<a class="skip-link" href="#main">تخطَّ إلى المحتوى</a>
${sprite()}
${header(navKey, base)}
${body}
${footer(base)}
<script src="${base}assets/js/main.js" defer></script>
</body>
</html>`;
}

// ---------- تنظيف مراجع الصور غير الموجودة ----------
function cleanImageReferences(html, outDir) {
  const exists = (url) => {
    if (/^(https?:|data:|\/\/)/.test(url)) return true;
    return fsSync.existsSync(path.resolve(outDir, url));
  };

  // srcset: احذف أي مقاس غير موجود بدل إرسال طلب 404.
  html = html.replace(/srcset="([^"]*)"/g, (full, value) => {
    const parts = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const kept = parts.filter((p) => exists(p.split(/\s+/)[0]));
    if (!kept.length) return full;
    return `srcset="${kept.join(", ")}"`;
  });

  // src: بدّل المقاس المفقود بأقرب مقاس موجود.
  html = html.replace(/src="([^"]*assets\/img\/projects\/[^"]*)"/g, (full, url) => {
    if (exists(url)) return full;
    for (const w of [960, 480, 1600]) {
      const alt = url.replace(/-\d+\.webp$/, `-${w}.webp`);
      if (exists(alt)) return `src="${alt}"`;
    }
    return full;
  });

  return html;
}

// ---------- قراءة الصفحات ----------
function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: raw.slice(m[0].length) };
}

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = await walk(PAGES);
const built = [];

for (const file of files) {
  const rel = path.relative(PAGES, file).split(path.sep).join("/");
  const depth = rel.split("/").length - 1;
  const base = depth === 0 ? "./" : "../".repeat(depth);
  const outPath = path.join(ROOT, rel);
  const raw = await fs.readFile(file, "utf8");
  let { data, body } = parseFrontMatter(raw);

  // {{WORKS:cat:limit}} و {{WORK:n[:wide]}} و {{GALLERY}} قبل استبدال الرموز حتى تُعالج مسارات {{BASE}}
  body = body.replaceAll("{{GALLERY}}", renderGallery());
  body = body.replaceAll("{{SERVICES_GRID}}", servicesGrid());
  body = body.replaceAll("{{CTA_BAND}}", ctaBand());
  body = body.replace(/\{\{SERVICE_SIDE:([a-z-]+)\}\}/g, (_, slug) => serviceSide(slug));
  const workTokens = [...body.matchAll(/\{\{WORKS:([a-z]+):(\d+)\}\}/g)];
  for (const t of workTokens) {
    const html = await renderWorks(t[1], Number(t[2]));
    body = body.replace(t[0], html);
  }
  const singleTokens = [...body.matchAll(/\{\{WORK:(\d+)(?::(wide))?\}\}/g)];
  for (const t of singleTokens) {
    const pr = projects.find((p) => p.n === Number(t[1]));
    if (!pr) continue;
    body = body.replace(t[0], await workFigure(pr, { wide: t[2] === "wide" }));
  }

  body = body
    .replaceAll("{{BASE}}", base)
    .replaceAll("{{DOMAIN}}", BASE_URL)
    .replaceAll("{{BRAND}}", config.brand)
    .replaceAll("{{CITY}}", config.city)
    .replaceAll("{{PHONE}}", PHONE_DISPLAY)
    .replaceAll("{{PHONE_E164}}", PHONE_E164)
    .replaceAll("{{WA_LINK}}", WA_LINK)
    .replaceAll("{{WA_NUMBER}}", WA)
    .replaceAll("{{MAPS}}", config.mapsUrl)
    .replaceAll("{{ADDRESS}}", `${config.address.street} — ${config.city}`)
    .replaceAll("{{YEAR}}", new Date().getFullYear().toString());

  body = cleanImageReferences(body, path.dirname(outPath));

  const urlPath =
    rel === "index.html"
      ? "/"
      : rel.endsWith("/index.html")
        ? `/${rel.slice(0, -"index.html".length)}`
        : `/${rel}`;
  const canonical = `${BASE_URL}${urlPath}`;
  const title = data.title || config.brand;
  const desc = data.desc || config.tagline;
  const ogImage =
    data.image && data.image.startsWith("http")
      ? data.image
      : `${BASE_URL}/${data.image || "assets/img/og-cover.jpg"}`;

  const html = pageShell({
    title,
    desc,
    canonical,
    base,
    body,
    navKey: data.nav || "",
    ogImage,
    ogType: data.type === "article" ? "article" : "website",
    preload: data.preload ? [data.preload] : [],
    robots: data.robots || "index, follow, max-image-preview:large",
  });

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, "utf8");
  if (data.sitemap !== "false") {
    built.push({ rel, urlPath, title, desc, updated: data.updated || new Date().toISOString().slice(0, 10), priority: data.priority || "0.7" });
  }
  console.log("built", rel);
}

// ---------- sitemap + robots ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${built
  .map(
    (p) => `  <url>
    <loc>${BASE_URL}${p.urlPath}</loc>
    <lastmod>${p.updated}</lastmod>
    <changefreq>${p.urlPath === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${p.urlPath === "/" ? "1.0" : p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
await fs.writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");

await fs.writeFile(
  path.join(ROOT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`,
  "utf8"
);

console.log(`\n✔ ${built.length} صفحة + sitemap.xml + robots.txt`);
