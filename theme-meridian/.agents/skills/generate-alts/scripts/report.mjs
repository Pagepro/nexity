import { cachedProposal } from "./lib.mjs";

const escapeHtml = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const embedJson = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, " ");

export const reportRows = (manifest, cache, imageSrc) =>
  manifest.usages.map((usage) => {
    const asset = manifest.assets[usage.assetId] ?? {};
    const proposal = cachedProposal(cache, usage);
    return {
      key: usage.key,
      documentId: usage.documentId,
      documentType: usage.documentType,
      docTitle: usage.docTitle,
      slug: usage.slug,
      where: usage.where,
      path: usage.path,
      altPath: usage.altPath,
      hint: usage.hint,
      studio: usage.studio,
      status: usage.status,
      writable: usage.writable,
      currentAlt: usage.alt,
      assetId: usage.assetId,
      image: imageSrc(usage.assetId),
      fullUrl: asset.url ?? null,
      asset: {
        title: asset.title ?? null,
        description: asset.description ?? null,
        altText: asset.altText ?? null,
        creditLine: asset.creditLine ?? null,
        originalFilename: asset.originalFilename ?? null,
        size: asset.width && asset.height ? `${asset.width}×${asset.height}` : null,
      },
      context: usage.context,
      proposal: proposal
        ? {
            alt: proposal.alt,
            decorative: proposal.decorative,
            reason: proposal.reason,
            sources: proposal.sources,
            problems: proposal.problems ?? [],
          }
        : null,
    };
  });

const STYLE = `
*{box-sizing:border-box}body{margin:0;font:14px/1.45 system-ui,sans-serif;color:#1b1b1f;background:#f4f4f6}
header{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #ddd;padding:12px 20px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
header h1{font-size:16px;margin:0 12px 0 0}header .meta{color:#666;font-size:12px}
select,input[type=search],button{font:inherit;padding:5px 9px;border:1px solid #bbb;border-radius:6px;background:#fff}
button.primary{background:#1b1b1f;color:#fff;border-color:#1b1b1f}
main{padding:16px 20px;display:grid;gap:12px}
.card{display:grid;grid-template-columns:220px 1fr;gap:16px;background:#fff;border:1px solid #ddd;border-radius:10px;padding:14px}
.card.approved{border-color:#2f7d4f;box-shadow:inset 4px 0 0 #2f7d4f}
.thumb{background:repeating-conic-gradient(#e7e7ea 0 25%,#fff 0 50%) 0 0/16px 16px;border-radius:6px;display:flex;align-items:center;justify-content:center;min-height:120px;align-self:start}
.thumb img{max-width:100%;max-height:220px;display:block}
.top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}.top b{font-size:15px}
.tag{font-size:11px;padding:1px 7px;border-radius:99px;background:#eceef2;color:#444}
.tag.missing{background:#fde8e8;color:#9b1c1c}.tag.has-alt{background:#e6f4ea;color:#1e6b3a}.tag.decorative{background:#efe9fb;color:#5b3a9c}
.warn{color:#9a5b00;font-size:12px}.muted{color:#666;font-size:12px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:8px 0;font-size:12px}dt{color:#666}dd{margin:0}
textarea{width:100%;font:inherit;padding:6px 8px;border:1px solid #bbb;border-radius:6px;resize:vertical;min-height:44px}
.row{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin-top:6px}
`;

const SCRIPT = `
const data = JSON.parse(document.getElementById("data").textContent);
const storeKey = "alts:" + data.meta.dataset + ":" + data.meta.generatedAt;
const saved = JSON.parse(localStorage.getItem(storeKey) || "{}");
const state = {};
for (const row of data.rows) {
  state[row.key] = saved[row.key] || {
    alt: row.proposal ? row.proposal.alt : "",
    decorative: row.proposal ? row.proposal.decorative : false,
    approved: Boolean(row.proposal && row.writable && !row.currentAlt.trim() && !(row.proposal.problems || []).length),
  };
}
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
const pairs = (entries) => {
  const list = entries.filter(([, value]) => value);
  return list.length ? el("dl", null, list.flatMap(([label, value]) => [el("dt", null, label), el("dd", null, value)])) : null;
};
const contextPairs = (context) => [
  ["Section", context.section ? [context.section.type, context.section.heading].filter(Boolean).join(": ") : null],
  ...Object.entries(context.parent || {}).map(([key, value]) => ["Near: " + key, value]),
  ["Text before", context.before], ["Text after", context.after], ["Caption", context.caption],
];
const card = (row) => {
  const current = state[row.key];
  const textarea = el("textarea", { rows: 2, disabled: current.decorative || !row.writable, oninput: (event) => { current.alt = event.target.value; length.textContent = current.alt.length + " chars"; save(); } });
  textarea.value = current.alt;
  const length = el("span", { class: "muted" }, current.alt.length + " chars");
  const node = el("article", { class: "card" + (current.approved ? " approved" : "") },
    el("a", { class: "thumb", href: row.fullUrl, target: "_blank", rel: "noopener" }, row.image ? el("img", { src: row.image, alt: "", loading: "lazy" }) : el("span", { class: "muted" }, "not fetched")),
    el("div", null,
      el("div", { class: "top" },
        el("b", null, row.docTitle || row.documentId),
        el("span", { class: "tag" }, row.documentType),
        el("span", { class: "tag " + row.status }, row.status),
        row.studio ? el("a", { href: row.studio, target: "_blank", rel: "noopener" }, "Open in Studio") : null,
        row.slug ? el("span", { class: "muted" }, "/" + String(row.slug).replace(/^\\/+/, "")) : null),
      el("div", { class: "muted" }, row.where),
      row.hint ? el("div", { class: "muted" }, "Field: " + row.hint) : null,
      pairs([
        ["Current alt", row.currentAlt || "(empty)"],
        ["Asset title", row.asset.title], ["Asset description", row.asset.description], ["Asset alt text", row.asset.altText],
        ["Credit", row.asset.creditLine], ["File", [row.asset.originalFilename, row.asset.size].filter(Boolean).join(", ")],
        ...contextPairs(row.context),
        ["Reason", row.proposal && row.proposal.reason], ["Sources", row.proposal && row.proposal.sources.join(", ")],
      ]),
      !row.writable ? el("div", { class: "warn" }, "This field has no alt field in the schema; it cannot be written.") : null,
      ...(row.proposal ? row.proposal.problems : []).map((problem) => el("div", { class: "warn" }, "Check: " + problem)),
      current.decorative && row.asset.altText ? el("div", { class: "warn" }, "An empty alt falls back to the asset's alt text on the site, so this image will not render as decorative.") : null,
      row.currentAlt.trim() ? el("div", { class: "warn" }, "Approving replaces the current alt.") : null,
      textarea,
      el("div", { class: "row" },
        length,
        el("label", null, el("input", { type: "checkbox", checked: current.decorative, disabled: !row.writable, onchange: (event) => { current.decorative = event.target.checked; render(); save(); } }), " Decorative (empty alt)"),
        el("label", null, el("input", { type: "checkbox", checked: current.approved, disabled: !row.writable, onchange: (event) => { current.approved = event.target.checked; node.classList.toggle("approved", current.approved); save(); } }), " Approve"))));
  return node;
};
const visible = () => {
  const filter = document.getElementById("filter").value;
  const query = document.getElementById("search").value.toLowerCase();
  return data.rows.filter((row) =>
    (filter === "all" || (filter === "proposals" ? Boolean(row.proposal) : filter === "approved" ? state[row.key].approved : row.status === filter)) &&
    (!query || JSON.stringify([row.docTitle, row.where, row.currentAlt, state[row.key].alt, row.documentType]).toLowerCase().includes(query)));
};
const render = () => { const main = document.querySelector("main"); main.replaceChildren(...visible().map(card)); count(); };
const count = () => { document.getElementById("count").textContent = Object.values(state).filter((entry) => entry.approved).length + " approved of " + data.rows.length; };
const approvedItems = () => data.rows.filter((row) => row.writable && state[row.key].approved).map((row) => ({
  key: row.key, documentId: row.documentId, documentType: row.documentType, path: row.path, altPath: row.altPath, assetId: row.assetId,
  currentAlt: row.currentAlt, alt: state[row.key].decorative ? "" : state[row.key].alt.trim(), decorative: state[row.key].decorative,
  overwrite: Boolean(row.currentAlt.trim()),
}));
const exportJson = () => JSON.stringify({ dataset: data.meta.dataset, projectId: data.meta.projectId, manifestGeneratedAt: data.meta.generatedAt, exportedAt: new Date().toISOString(), items: approvedItems() }, null, 2);
document.getElementById("filter").addEventListener("change", render);
document.getElementById("search").addEventListener("input", render);
document.getElementById("approve-visible").addEventListener("click", () => { for (const row of visible()) if (row.writable && (state[row.key].alt.trim() || state[row.key].decorative)) state[row.key].approved = true; save(); render(); });
document.getElementById("download").addEventListener("click", () => {
  const link = el("a", { href: URL.createObjectURL(new Blob([exportJson()], { type: "application/json" })), download: "approved.json" });
  document.body.append(link); link.click(); link.remove();
});
document.getElementById("copy").addEventListener("click", async (event) => { await navigator.clipboard.writeText(exportJson()); event.target.textContent = "Copied"; });
render();
`;

export const buildReport = (manifest, cache, { imageSrc = () => null } = {}) => {
  const rows = reportRows(manifest, cache, imageSrc);
  const meta = {
    dataset: manifest.dataset,
    projectId: manifest.projectId,
    generatedAt: manifest.generatedAt,
  };
  const counts = manifest.counts;
  const lang = manifest.lang ? ` lang="${escapeHtml(manifest.lang)}"` : "";

  return `<!doctype html>
<html${lang}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Alt text review: ${escapeHtml(manifest.dataset)}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
<h1>Alt text review</h1>
<span class="meta">dataset ${escapeHtml(manifest.dataset)} · scanned ${escapeHtml(manifest.generatedAt)} · ${counts.usages} images (${counts.missing} missing, ${counts.hasAlt} with alt, ${counts.decorative} decorative)</span>
<select id="filter">
<option value="proposals">With a proposal</option>
<option value="missing">Missing alt</option>
<option value="has-alt">Has alt</option>
<option value="decorative">Decorative</option>
<option value="approved">Approved</option>
<option value="all">All</option>
</select>
<input id="search" type="search" placeholder="Search">
<button id="approve-visible">Approve visible</button>
<span id="count" class="meta"></span>
<button id="copy">Copy JSON</button>
<button id="download" class="primary">Download approved.json</button>
</header>
<main></main>
<script id="data" type="application/json">${embedJson({ meta, rows })}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
};
