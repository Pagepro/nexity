// The Gate 3 review page: one self-contained HTML file in the run folder. It shows the whole
// change (text, metadata, images, checks) and records nothing: approval is the `gate` command,
// bound to the files' hashes, so reading the page can never be mistaken for signing it.
import { diffChunks, markdownChunks } from "./lib.mjs";

const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const STYLE = `
:root{--bg:#fbfbfa;--fg:#1a1a18;--muted:#6b6b66;--line:#e2e2dd;--ins:#e8f5e9;--ins-fg:#1b5e20;--del:#fdecea;--del-fg:#a52714;--accent:#2f5d8a}
@media (prefers-color-scheme:dark){:root{--bg:#17171a;--fg:#eaeae6;--muted:#9a9a94;--line:#34343a;--ins:#12351a;--ins-fg:#8fd79b;--del:#3a1614;--del-fg:#f0a39a;--accent:#8fb8e0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 20px 80px}h1{font-size:22px;margin:0 0 4px}
h2{font-size:14px;margin:32px 0 10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.sub{color:var(--muted);margin:0 0 24px;font-size:13px}.sub a{color:inherit}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:0;padding:0;list-style:none}.stats li{border:1px solid var(--line);border-radius:6px;padding:8px 12px}
.stats b{display:block;font-size:19px}.stats span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.notice{border-left:3px solid var(--accent);padding:10px 14px;margin:20px 0;background:color-mix(in srgb,var(--accent) 8%,transparent);font-size:13px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;word-break:break-all}
table{border-collapse:collapse;width:100%}.meta th,.meta td{border-bottom:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top;font-size:13px}
.meta th{width:170px;color:var(--muted)}.meta tr.changed td:last-child{background:var(--ins);color:var(--ins-fg)}
.chunk{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:6px;overflow:hidden;margin:8px 0}
.chunk>div{background:var(--bg);padding:8px 12px;white-space:pre-wrap;font-size:14px}.chunk .del{background:var(--del);color:var(--del-fg)}.chunk .ins{background:var(--ins);color:var(--ins-fg)}
.chunk .label{grid-column:1/-1;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;padding:4px 12px}
.same{color:var(--muted);font-size:13px;margin:6px 0;padding-left:12px;border-left:2px solid var(--line)}
.blockers{color:var(--del-fg)}.ok{color:var(--ins-fg)}ul{margin:0;padding-left:20px}
.images{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}.images figure{margin:0;border:1px solid var(--line);border-radius:6px;padding:8px}
.images img{width:100%;height:auto;display:block;border-radius:3px}.images figcaption{font-size:12px;color:var(--muted);margin-top:6px}
`;

const preview = (chunk) => {
  const text = chunk.replace(/\s+/g, " ").trim();
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
};

// A new image from this run shows as itself, next to its Markdown.
const cell = (chunk) => {
  if (chunk === undefined) return "";
  const image = chunk.trim().match(/^!\[[^\]]*\]\((images\/[^)\s]+)\)$/);
  return `${escapeHtml(chunk)}${image ? `<img src="${escapeHtml(image[1])}" alt="" style="display:block;max-width:320px;margin-top:8px;border-radius:3px">` : ""}`;
};

const diffSection = (before, candidate) => {
  const out = [];
  let unchanged = [];
  const flush = () => {
    if (unchanged.length) out.push(`<p class="same">${unchanged.length} unchanged: ${escapeHtml(preview(unchanged[0]))}${unchanged.length > 1 ? " …" : ""}</p>`);
    unchanged = [];
  };
  for (const operation of diffChunks(markdownChunks(before), markdownChunks(candidate))) {
    if (operation.type === "same") {
      unchanged.push(operation.before);
      continue;
    }
    flush();
    out.push(
      `<div class="chunk"><div class="label">${operation.type}</div><div class="${operation.before === undefined ? "" : "del"}">${cell(operation.before)}</div><div class="${operation.after === undefined ? "" : "ins"}">${cell(operation.after)}</div></div>`,
    );
  }
  flush();
  return out.join("\n");
};

export const buildReviewPage = ({ title, url, route, before, candidate, candidateHash, metadata, blockers, findings, unchecked = [], images = [], counts, validated }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gate 3: ${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>Gate 3: ${escapeHtml(title)}</h1>
<p class="sub"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a> · route ${escapeHtml(route)}</p>
<ul class="stats">
<li><b>${counts.changed}</b><span>changed</span></li>
<li><b>${counts.added}</b><span>added</span></li>
<li><b>${counts.removed}</b><span>removed</span></li>
<li><b>${counts.formatting}</b><span>formatting or links</span></li>
<li><b>${counts.same}</b><span>unchanged</span></li>
</ul>
<div class="notice"><strong>Reading this page is not approving it.</strong> The approval is recorded by
<code>gate --name=gate3 --by="&lt;your name&gt;"</code> against the files' hashes (candidate.md <code>${escapeHtml(candidateHash.slice(0, 12))}</code>).
A change to the candidate or the metadata afterwards makes it stale.${validated ? "" : " <strong>Validation is missing or older than the candidate: run validate before approving.</strong>"}</div>
<h2>Open blockers</h2>
${blockers.length ? `<ul class="blockers">${blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : '<p class="ok">No open blockers.</p>'}
<h2>Metadata</h2>
<table class="meta"><tr><th></th><th>Before</th><th>After</th></tr>
${metadata.map((field) => `<tr class="${field.before !== field.after ? "changed" : ""}"><th>${escapeHtml(field.label)}</th><td>${escapeHtml(field.before) || "<em>empty</em>"}</td><td>${escapeHtml(field.after) || "<em>empty</em>"}</td></tr>`).join("\n")}
</table>
${images.length ? `<h2>New images (drafts until a person uploads them)</h2>\n<div class="images">${images.map((image) => `<figure><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt ?? "")}"><figcaption><code>${escapeHtml(image.file)}</code>${image.alt ? `<br>alt: ${escapeHtml(image.alt)}` : "<br><strong>no alt text</strong>"}${image.caption ? `<br>caption: ${escapeHtml(image.caption)}` : ""}<br>from ${escapeHtml(image.from)}</figcaption></figure>`).join("\n")}</div>` : ""}
<h2>Text, before and after</h2>
${diffSection(before, candidate)}
<h2>Findings (the editor decides)</h2>
${findings.length ? `<ul>${findings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>No findings.</p>"}
${unchecked.length ? `<h2>Links not checked (verify by hand)</h2><ul>${unchecked.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
</main>
</body>
</html>
`;
