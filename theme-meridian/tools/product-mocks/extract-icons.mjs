import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pulls lucide icon bodies out of the web package's lucide-react (same version the site renders).
// Usage: node tools/product-mocks/extract-icons.mjs <icon-name> [...]  — merges into icons.json.
const here = path.dirname(fileURLToPath(import.meta.url));
const dir =
  path.join(
    here,
    "..",
    "..",
    "web",
    "node_modules",
    "lucide-react",
    "dist",
    "esm",
    "icons",
  ) + path.sep;
const names = process.argv.slice(2);
const outPath = path.join(here, "icons.json");
const out = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
for (const name of names) {
  const src = fs.readFileSync(dir + name + ".js", "utf8");
  const m = src.match(/const __iconNode = (\[[\s\S]*?\]);\n/);
  if (!m) {
    console.error("no node for", name);
    continue;
  }
  const nodes = new Function("return " + m[1])();
  const inner = nodes
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  out[name] = inner;
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.info(Object.keys(out).length, "icons");
