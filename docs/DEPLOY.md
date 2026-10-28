# النشر على استضافة خارجية

الموقع ثابت بالكامل، والمجلد `dist/` جاهز للرفع. المستودع `waheeb71/abomohammed` يبقى **خاصًا** — لا حاجة لتغيير خصوصيته.

## ما الذي جُهّز؟

- `dist/` — الموقع كاملًا (HTML + CSS + JS + الصور + الخطوط).
- `dist.zip` — نفس المجلد مضغوطًا للرفع المباشر.
- `netlify.toml` — إعداد جاهز لـ Netlify (أمر البناء ومجلد النشر).
- `_headers` — تخزين مؤقت ورؤوس أمان (مدعوم في Netlify وCloudflare Pages).
- `SITE_DOMAIN` — متغير بيئة يضبط الـ canonical وsitemap وSchema تلقائيًا.

## مهم: النطاق قبل النشر

كل روابط canonical و`sitemap.xml` و`og:url` تُبنى من `domain` في `site.config.json`.
إذا نشرت على نطاق مختلف يجب تحديثه، وإلا أشارت الصفحات إلى عنوان غير موجود.

**يجب أن تكون قيمة `SITE_DOMAIN` رابطًا كاملًا** مثل:

```
SITE_DOMAIN=https://abo-mohammeed.netlify.app
```

ولا تكتب اسم الموقع وحده (`abo-mohammeed`) — هذا ينتج روابط بلا `https://` ولا نطاق، وترفضها Google Search Console كعناوين غير صالحة. البناء الآن يتحقق من القيمة: إن كانت غير صالحة يتجاهلها ويستخدم `domain` من `site.config.json` مع تحذير في السجل.

الطريقة الأسهل: اضبط `SITE_DOMAIN` عند البناء:

```bash
SITE_DOMAIN=https://abo-mohammeed.netlify.app npm run build
npm run package
```

أو في PowerShell:

```powershell
$env:SITE_DOMAIN = "https://abo-mohammeed.netlify.app"
npm run build
npm run package
```

بعد الحصول على الرابط النهائي أرسله لي، أو نفّذ الأمرين أعلاه وأعد الرفع.

---

## الخيار ١ — Netlify (الأسهل مع مستودع خاص)

### أ. ربط المستودع (نشر تلقائي عند كل تحديث)

1. افتح [app.netlify.com](https://app.netlify.com) وسجّل الدخول بحساب GitHub.
2. **Add new site → Import an existing project → GitHub**.
3. امنح Netlify صلاحية الوصول للمستودع الخاص، واختر `waheeb71/abomohammed`.
4. اترك الإعدادات كما هي — `netlify.toml` يحدد:
   - أمر البناء: `npm run build && npm run package`
   - مجلد النشر: `dist`
5. اضغط **Deploy site** وانتظر انتهاء البناء.
6. من **Site configuration → Change site name** اختر اسمًا، مثل `abomohammed-glass`.
7. من **Site configuration → Environment variables** أضف:
   - `SITE_DOMAIN` = `https://abomohammed-glass.netlify.app`
8. من **Deploys → Trigger deploy → Clear cache and deploy site**.
9. افتح الرابط وتأكد أن الصفحة الرئيسية و`/sitemap.xml` تعملان.

### ب. رفع مباشر بدون ربط المستودع (أسرع)

1. افتح [app.netlify.com/drop](https://app.netlify.com/drop).
2. اسحب `dist.zip` أو مجلد `dist/` إلى الصفحة.
3. سجّل الدخول لتحتفظ بالموقع، وانسخ الرابط.
4. اضبط `SITE_DOMAIN` بالرابط، ثم:

```bash
npm run build
npm run package
```

5. اسحب `dist.zip` الجديد مرة أخرى فوق نفس الموقع.

> الرفع المباشر لا يُحدّث نفسه عند تعديل المستودع؛ الربط في الخيار (أ) أفضل على المدى الطويل.

---

## الخيار ٢ — Cloudflare Pages

1. افتح [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. اختر المستودع `waheeb71/abomohammed` (امنح Cloudflare صلاحية الوصول).
3. الإعدادات:
   - Framework preset: **None**
   - Build command: `npm run build && npm run package`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `20`
4. بعد أول نشر انسخ الرابط (`https://abomohammed.pages.dev` مثلًا).
5. أضف متغير البيئة `SITE_DOMAIN` بالرابط، ثم **Retry deployment**.
6. `_headers` يعمل تلقائيًا في Cloudflare Pages.

---

## الخيار ٣ — أي استضافة ملفات (cPanel / FTP)

1. `npm run package`.
2. ارفع محتويات `dist/` إلى `public_html`.
3. تأكد من وجود `index.html` في الجذر، وفعّل SSL.
4. إن كان النطاق مختلفًا، أعد البناء مع `SITE_DOMAIN` قبل الرفع.

---

## بعد النشر — تحقق سريع

- [ ] الصفحة الرئيسية تفتح عبر HTTPS.
- [ ] `/sitemap.xml` يبدأ بالنطاق الصحيح وعدد الروابط 21.
- [ ] `/robots.txt` يشير إلى نفس الخريطة.
- [ ] زر الاتصال يفتح `0579305750`.
- [ ] زر واتساب يفتح المحادثة على `966579305750`.
- [ ] قائمة الجوال تفتح وتبقى قابلة للتمرير على شاشة صغيرة.
- [ ] الخريطة لا تُحمَّل قبل الضغط على «إظهار الخريطة».
- [ ] أضف الموقع إلى Google Search Console وأرسل `sitemap.xml`.

## ملاحظة عن GitHub Pages

GitHub Pages المجاني لا يعمل مع المستودعات الخاصة. إذا رقّيت الحساب إلى Pro لاحقًا فيمكن تفعيله من
**Settings → Pages → Deploy from a branch → main / (root)**، لكن في هذه الحالة استخدم
`SITE_DOMAIN=https://abo-mohammeed.netlify.app` أو أعد `domain` في `site.config.json` إلى رابط GitHub.
