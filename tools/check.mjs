// فحص سريع: صلاحية JSON-LD، الروابط الداخلية، والصور المشار إليها.
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const htmlFiles = [];

async function walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "image" || e.name === ".tmp" || e.name === "src" || e.name === "tools" || e.name === "assets" || e.name === "docs" || e.name === "dist") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else if (e.name.endsWith(".html")) htmlFiles.push(full);
  }
}
await walk(ROOT);

let errors = 0;
const links = new Set();

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const html = await fs.readFile(file, "utf8");

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      errors++;
      console.log(`JSON-LD ✗ ${rel}: ${e.message}`);
    }
  }

  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(u)) continue;
    links.add(`${rel} -> ${u}`);
  }

  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (!u || /^(https?:|data:|\/\/)/.test(u)) continue;
      links.add(`${rel} -> ${u}`);
    }
  }
}

for (const link of links) {
  const [from, u] = link.split(" -> ");
  const target = path.resolve(path.dirname(path.join(ROOT, from)), u);
  let ok = false;
  try {
    const st = await fs.stat(target);
    ok = st.isFile() || (await fs.stat(path.join(target, "index.html")).isFile());
  } catch {
    try {
      ok = (await fs.stat(path.join(target, "index.html"))).isFile();
    } catch {}
  }
  if (!ok && !u.endsWith("/")) {
    errors++;
    console.log(`LINK ✗ ${from} -> ${u}`);
  } else if (!ok) {
    errors++;
    console.log(`LINK ✗ ${from} -> ${u} (dir)`);
  }
}

console.log(`\nفحص ${htmlFiles.length} صفحة — ${errors} مشكلة.`);
process.exit(errors ? 1 : 0);
