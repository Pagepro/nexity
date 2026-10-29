const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const embedJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, " ");

const STYLE = `
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;color:#1b1b1f;background:#f4f4f6}
header{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #ddd;padding:12px 20px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
header h1{font-size:16px;margin:0 12px 0 0}.meta{color:#666;font-size:12px}
button,input[type=search]{font:inherit;padding:5px 9px;border:1px solid #bbb;border-radius:6px;background:#fff}
button.primary{background:#1b1b1f;color:#fff;border-color:#1b1b1f}
main{padding:16px 20px;display:grid;gap:18px}
section h2{font-size:15px;margin:0 0 6px}section h2 a{color:inherit}
.card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:12px 14px;margin-top:8px}
.card.approved{border-color:#2f7d4f;box-shadow:inset 4px 0 0 #2f7d4f}
.sentence{font-size:15px}.sentence mark{background:#ffe58a;padding:0 2px;border-radius:3px}
.row{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-top:6px;font-size:12px;color:#555}
.tag{font-size:11px;padding:1px 7px;border-radius:99px;background:#eceef2;color:#444}
.rejected{font-size:12px;color:#9a5b00;margin-top:6px}
`;

const SCRIPT = `
const data = JSON.parse(document.getElementById("data").textContent);
const storeKey = "internal-links:" + data.meta.site + ":" + data.meta.generatedAt;
const saved = JSON.parse(localStorage.getItem(storeKey) || "{}");
const state = {};
for (const item of data.items) state[item.id] = saved[item.id] ?? false;
const save = () => { localStorage.setItem(storeKey, JSON.stringify(state)); count(); };
const el = (tag, attrs, ...children) => {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (name === "class") node.className = value; else if (name.startsWith("on")) node.addEventListener(name.slice(2), value); else node.setAttribute(name, value === true ? "" : value);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) node.append(child);
  return node;
};
const sentence = (item) => {
  const text = item.sentence.text;
  const from = item.start - item.sentence.offset;
  const to = item.end - item.sentence.offset;
  return el("div", { class: "sentence" }, text.slice(0, from), el("mark", null, text.slice(from, to)), text.slice(to));
};
const card = (item) => {
  const node = el("article", { class: "card" + (state[item.id] ? " approved" : "") },
    sentence(item),
    el("div", { class: "row" },
      el("span", null, "→ ", el("a", { href: item.targetUrl, target: "_blank", rel: "noopener" }, item.targetTitle || item.targetPath), " ", item.targetPath),
      el("span", { class: "tag" }, item.kind === "candidate" ? "name match" : "agent"),
      item.reason ? el("span", null, item.reason) : null,
      el("label", null, el("input", { type: "checkbox", checked: state[item.id], onchange: (event) => { state[item.id] = event.target.checked; node.classList.toggle("approved", state[item.id]); save(); } }), " Approve")));
  return node;
};
const render = () => {
  const query = document.getElementById("search").value.toLowerCase();
  const main = document.querySelector("main");
  main.replaceChildren(...data.sources.map((source) => {
    const items = data.items.filter((item) => item.sourceId === source.id && (!query || JSON.stringify(item).toLowerCase().includes(query)));
    const rejected = data.rejected.filter((entry) => entry.sourceId === source.id);
    if (query && !items.length) return null;
    return el("section", null,
      el("h2", null, el("a", { href: source.url, target: "_blank", rel: "noopener" }, source.title || source.path), " ",
        el("span", { class: "meta" }, source.path, " · ", items.length + " proposed")),
      items.length ? items.map(card) : el("div", { class: "meta" }, source.note || "No link proposed."),
      rejected.length ? el("details", { class: "rejected" }, el("summary", null, rejected.length + " rejected by the checks"), rejected.map((entry) => el("div", null, '"' + (entry.anchor || "") + '" → ' + (entry.target || "") + ": " + entry.reason))) : null);
  }).filter(Boolean));
  count();
};
const count = () => { document.getElementById("count").textContent = Object.values(state).filter(Boolean).length + " approved of " + data.items.length; };
const exportJson = () => JSON.stringify({ site: data.meta.site, generatedAt: data.meta.generatedAt, exportedAt: new Date().toISOString(),
  items: data.items.filter((item) => state[item.id]).map(({ id, sourcePath, sourceTitle, sourceUrl, block, start, end, anchor, sentence, target, targetPath, targetTitle, targetUrl }) => ({ id, sourcePath, sourceTitle, sourceUrl, block, start, end, anchor, sentence, target, targetPath, targetTitle, targetUrl })) }, null, 2);
document.getElementById("search").addEventListener("input", render);
document.getElementById("approve-all").addEventListener("click", () => { for (const item of data.items) state[item.id] = true; save(); render(); });
document.getElementById("download").addEventListener("click", () => {
  const link = el("a", { href: URL.createObjectURL(new Blob([exportJson()], { type: "application/json" })), download: "approved.json" });
  document.body.append(link); link.click(); link.remove();
});
document.getElementById("copy").addEventListener("click", async (event) => { await navigator.clipboard.writeText(exportJson()); event.target.textContent = "Copied"; });
render();
`;

export const buildReport = ({ meta, sources, items, rejected }) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Internal links review: ${escapeHtml(meta.site)}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
<h1>Internal links review</h1>
<span class="meta">${escapeHtml(meta.site)} · ${escapeHtml(meta.generatedAt)} · ${sources.length} articles · ${items.length} proposals</span>
<input id="search" type="search" placeholder="Search">
<button id="approve-all">Approve all</button>
<span id="count" class="meta"></span>
<button id="copy">Copy JSON</button>
<button id="download" class="primary">Download approved.json</button>
</header>
<main></main>
<script id="data" type="application/json">${embedJson({ meta, sources, items, rejected })}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
