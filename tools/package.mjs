// يجهّز مجلد dist للنشر: نسخ الصفحات والأصول فقط دون src أو أدوات التطوير.
// التشغيل: node tools/package.mjs
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(DIST, { recursive: true });

const files = ["favicon.svg", "site.webmanifest", "robots.txt", "sitemap.xml"];
const dirs = ["assets", "services", "blog"];

for (const f of files) {
  if (existsSync(path.join(ROOT, f))) await fs.copyFile(path.join(ROOT, f), path.join(DIST, f));
}

for (const d of dirs) {
  if (existsSync(path.join(ROOT, d))) await fs.cp(path.join(ROOT, d), path.join(DIST, d), { recursive: true });
}

for (const entry of await fs.readdir(ROOT)) {
  if (entry.endsWith(".html")) await fs.copyFile(path.join(ROOT, entry), path.join(DIST, entry));
}

// تنظيف ملفات غير مطلوبة داخل assets إن وُجدت.
for (const junk of ["assets/img/og-raw.jpg"]) {
  await fs.rm(path.join(DIST, junk), { force: true });
}

let total = 0;
async function size(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await size(full);
    else total += (await fs.stat(full)).size;
  }
}
await size(DIST);

const zip = path.join(ROOT, "dist.zip");
await fs.rm(zip, { force: true });
if (process.platform === "win32") {
  const r = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Compress-Archive -Path '${DIST}\\*' -DestinationPath '${zip}' -Force`],
    { stdio: "ignore" }
  );
  if (r.status === 0) console.log("dist.zip created");
}

console.log(`dist ready: ${(total / 1024 / 1024).toFixed(1)} MB — ${files.length + dirs.length} elements copied`);
