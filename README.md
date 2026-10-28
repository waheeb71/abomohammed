# موقع أبو محمد للزجاج والألمنيوم

موقع تعريفي ثابت (HTML/CSS/JS) لخدمات الزجاج والألمنيوم في الرياض. لا قاعدة بيانات، لا خادم، ولا أطر عمل — صفحات تُبنى من مقاطع نصية وتُرفع كما هي.

---

## التشغيل السريع

```bash
npm install
npm run build       # يبني HTML في الجذر + sitemap.xml + robots.txt
npm run serve       # معاينة على http://localhost:4173
```

قبل النشر:

```bash
npm run check       # فحص JSON-LD والروابط والصور
npm run package     # مجلد dist/ وملف dist.zip للنشر
```

---

## الملفات المهمة

| المسار | الوظيفة |
|---|---|
| `site.config.json` | الاسم، الهاتف، واتساب، النطاق، العنوان، الإحداثيات، الساعات. **ابدأ من هنا.** |
| `src/pages/` | محتوى الصفحات (HTML + front matter بسيط). |
| `src/pages/services/` | 9 صفحات خدمات + فهرس الخدمات. |
| `src/pages/blog/` | فهرس المدونة + 4 مقالات. |
| `src/data/projects.json` | بيانات 56 صورة: التصنيف، النص البديل، الوصف. |
| `src/data/services.json` | أسماء الخدمات وأيقوناتها ووصفها المختصر. |
| `src/partials/sprite.svg` | أيقونات SVG مستخدمة في كل الموقع. |
| `assets/css/style.css` | نظام التصميم الكامل والاستجابة. |
| `assets/js/main.js` | القائمة، الظهور التدريجي، المعرض، النموذج، الخريطة. |
| `tools/build.mjs` | المولّد: يقرأ المقاطع ويستبدل الرموز ويبني الصفحات. |
| `tools/check.mjs` | فحص سريع للروابط والصور وJSON-LD. |
| `tools/optimize-images.mjs` | تحويل صور واتساب إلى WebP بأحجام متعددة. |
| `tools/make-og.mjs` | إنشاء صورة المشاركة `assets/img/og-cover.jpg`. |
| `tools/package.mjs` | تجهيز `dist/` للنشر. |
| `docs/` | خطة SEO، حزمة Google Business، قائمة الإطلاق. |

---

## كيف تعدّل المحتوى

كل صفحة في `src/pages` تبدأ بـ front matter:

```yaml
---
title: عنوان الصفحة في البحث
desc: وصف الصفحة (150–160 حرفًا مثاليًا)
nav: services
priority: "0.8"
updated: 2026-10-28
---
```

- `title` و`desc` يظهران في `<title>` و`meta description` وOG.
- `nav` يحدد الرابط النشط في القائمة: `home`، `services`، `works`، `areas`، `blog`، `contact`.
- `type: article` يحوّل OG إلى `article` (للمقالات).
- `image` صورة المشاركة (نسبية لجذر الموقع).
- `robots` و`sitemap` اختياريان (مثال: `404.html`).
- `preload` مسار صورة الهيرو لتحميلها أولًا.

### الرموز المتاحة داخل الصفحات

| الرمز | الناتج |
|---|---|
| `{{BASE}}` | `./` أو `../` حسب عمق الصفحة |
| `{{DOMAIN}}` | النطاق من `site.config.json` |
| `{{PHONE}}` / `{{PHONE_E164}}` | الرقم للعرض / للاتصال |
| `{{WA_LINK}}` / `{{WA_NUMBER}}` | رابط واتساب جاهز / الرقم |
| `{{CITY}}` / `{{ADDRESS}}` / `{{MAPS}}` | من الإعدادات |
| `{{WORK:12}}` | صورة مشروع برقمها (أضف `:wide` للعريضة) |
| `{{WORKS:facades:3}}` | أول 3 صور من تصنيف |
| `{{GALLERY}}` | معرض كامل مع الفلترة |
| `{{SERVICES_GRID}}` | شبكة الخدمات التسع |
| `{{SERVICE_SIDE:slug}}` | الشريط الجانبي لصفحة خدمة |
| `{{CTA_BAND}}` | شريط الدعوة للتواصل |

---

## إضافة صور مشاريع

1. ضع صور JPEG الأصلية في `image/`.
2. أضف عنصرًا لكل صورة في `src/data/projects.json`:

```json
{
  "n": 57,
  "cat": "facades",
  "file": "اسم الملف.jpeg",
  "alt": "وصف دقيق للصورة بالعربية",
  "caption": "وصف قصير يظهر في المعرض"
}
```

3. شغّل:

```bash
npm run images
npm run build
npm run check
```

التصنيفات المتاحة: `railings`، `balustrades`، `facades`، `doors`، `partitions`، `mirrors`، `showers`، `material`.

الصور الأفقية والرأسية تُقصّ تلقائيًا في المعرض، لكن `alt` يجب أن يصف ما يظهر فعلًا.

---

## النشر على GitHub Pages

المستودع: `https://github.com/waheeb71/abomohammed`

النطاق الحالي المضبوط في `site.config.json`:
`https://waheeb71.github.io/abomohammed`

1. ارفع المشروع إلى الفرع `main` (الملفات المبنية موجودة في جذر المشروع).
2. من المستودع: **Settings → Pages → Build and deployment**.
3. اختر **Deploy from a branch** ثم `main` والمجلد `/ (root)`، واحفظ.
4. انتظر دقيقة، ثم افتح `https://waheeb71.github.io/abomohammed/`.

ملف `.nojekyll` موجود حتى لا يعالج GitHub الصفحات بـ Jekyll.

لأي استضافة أخرى: `npm run package` ثم ارفع محتويات `dist/`. التفاصيل الكاملة (DNS، HTTPS، Search Console، إعادة التوجيه) في `docs/LAUNCH-CHECKLIST.md`.

**قبل أي تغيير:** بيانات الاتصال والموقع في `site.config.json` هي المصدر الوحيد. بعد تعديلها شغّل `npm run build && npm run check`.

---

## ملاحظات

- الموقع لا يجمع بيانات: النموذج يكوّن رسالة واتساب فقط.
- الخريطة تُحمَّل بنقرة لتقليل زمن التحميل.
- الصور والخطوط تُقدَّم من نفس النطاق — لا اعتماد على خدمات خارجية.
- المقالات والردود مكتوبة بنبرة عملية بلا أرقام أو وعود غير قابلة للتحقق.
