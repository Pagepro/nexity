// oxlint-disable no-console
// Reads the published post over HTTP and Google's read-only APIs; writes only to its run folder.

import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { GoogleError, accessToken, authMode, authorise, ga4LandingPage, gscQuery, listGa4Properties, listGscSites } from "./google.mjs";
import { USER_AGENT, fetchPage, hostOf, ownPath, parseSitemap, readPage, robotsRules, toMarkdown } from "./html.mjs";
import {
  appliedChanges,
  compareWindows,
  comparisonMarkdown,
  diffChunks,
  extractLinks,
  foldPages,
  gateStatus,
  gscWindowFromRows,
  markdownChunks,
  mentions,
  rankCandidates,
  sha256,
  staticChecks,
  windowRange,
} from "./lib.mjs";
import { buildReviewPage } from "./review.mjs";
import { findBrowser, parseVisualPlan, renderVisuals } from "./visuals.mjs";

const HELP = `Usage (from the folder where .blog-updates/ should live, usually the project root):
  node <skill>/scripts/blog-post-update.mjs <command> [options]

Setup
  setup                        What is configured: Google (service account / OAuth / none), GSC_SITE, GA4_PROPERTY
  google-auth                  One-time OAuth login (read-only) when GOOGLE_OAUTH_CLIENT_FILE is set

Pick and start
  candidates [--months=3] [--prefix=/blog/]  Posts worth opening, from Search Console (needs Google access)
  start --url=<published URL> [--file=<html|md>] [--content=<selector>]  Snapshot one post; prints --run=<dir>

Diagnose (each takes --run=<dir>)
  gsc --window=current|previous|year-ago [--months=3] [--end=YYYY-MM-DD] [--as=<name>] [--page=<url>]
  ga4 --window=current|previous|year-ago [--months=3] [--end=YYYY-MM-DD]
  diagnose [--current=<name> --baseline=<name>]  Compare windows: what moved and what kind of move it was
  mentions --term=<text> [--version=before|candidate]

Decide, write, check, hand off (each takes --run=<dir>)
  gate --name=gate1|gate2|gate3|no-change --by="<name>" [--route=…] [--rationale=… --revisit=YYYY-MM-DD]
  visuals [--only=id,id] [--browser=path]  Render visual-plan.md into images/ (Chrome or Edge, Node 22+)
  validate [--links]           Checks candidate.md and metadata.json; writes comparison.md, checks.json
  review                       The Gate 3 page: review.html (the whole change, images, checks)
  handoff                      The approved change list for the editor -> handoff.md (needs gate3)
  verify                       After the editor published: is every approved change on the live page?
  status                       Where the run is and what comes next

Options
  --dir=<path>     Working folder (default: .blog-updates)
  --json           Print JSON

Env (the shell, or .env.local / .env in the current folder): GSC_SITE, GA4_PROPERTY, and either
GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_OAUTH_CLIENT_FILE. None is needed to start a run.`;

const COMMANDS = ["setup", "google-auth", "candidates", "start", "gsc", "ga4", "diagnose", "mentions", "gate", "visuals", "validate", "review", "handoff", "verify", "status"];

const readArgument = (name) => {
  const found = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
};
const hasFlag = (name) => process.argv.includes(`--${name}`);
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const command = process.argv[2];
if (!command || hasFlag("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(command ? 0 : 1);
}
if (!COMMANDS.includes(command)) fail(`Unknown command "${command}".\n\n${HELP}`);

const cwd = process.cwd();
// Shell variables win: loadEnvFile never overwrites a variable that is already set.
for (const name of [".env.local", ".env"]) if (existsSync(path.join(cwd, name))) process.loadEnvFile(path.join(cwd, name));

const workDir = path.resolve(cwd, readArgument("dir") ?? ".blog-updates");
const isJson = hasFlag("json");
const display = (file) => {
  const relative = path.relative(cwd, file);
  return relative.startsWith("..") ? file : relative;
};
const print = (value, text) => console.log(isJson ? JSON.stringify(value, null, 2) : text());
const readJson = async (file, fallback) => (existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : fallback);
const writeJson = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};
const readText = async (file) => (existsSync(file) ? readFile(file, "utf8") : null);

const google = async () => {
  const mode = authMode();
  const { token, identity } = await accessToken(mode);
  return { token, identity, mode };
};

const runDir = () => {
  const value = readArgument("run");
  if (!value) fail("This command needs --run=<dir> (printed by start).");
  const dir = path.resolve(cwd, value);
  if (!existsSync(path.join(dir, "run.json"))) fail(`${value} is not a run folder (no run.json). Run "start" first.`);
  return dir;
};
const loadRun = async (dir) => readJson(path.join(dir, "run.json"));
const saveRun = (dir, run) => writeJson(path.join(dir, "run.json"), run);

const fileHash = async (dir, name) => {
  const content = await readText(path.join(dir, name));
  return content === null ? null : sha256(content);
};
const GATE_FILES = { gate1: ["recommendations.md"], gate2: ["outline.md"], gate3: ["candidate.md", "metadata.json"], "no-change": ["recommendations.md"] };

/** The body as Markdown, without the page's own <h1>: that is the title, kept in metadata.json. */
const articleMarkdown = (page) => {
  const blocks = [...page.blocks];
  const title = blocks.findIndex((block) => block.kind === "heading" && block.level === 1);
  if (title !== -1 && title < 3) blocks.splice(title, 1);
  return toMarkdown(blocks);
};

/** The article on the live page, read the same way as the snapshot so the two compare. */
const readLive = async (run) => {
  const response = await fetchPage(run.post.url);
  if (!response.ok) return { ok: false, error: response.error };
  const page = readPage(response.html, response.url, { content: run.snapshot.content ?? undefined });
  return { ok: true, page, markdown: articleMarkdown(page) };
};

const plainText = (markdown) => markdownChunks(markdown).join("\n");

/* --------------------------------------------------------------------------- commands */

const setup = async () => {
  const mode = authMode();
  const result = {
    google: { mode: mode.mode, file: mode.file ?? mode.client ?? null, authorised: mode.mode === "oauth" ? mode.authorised : null, gscSite: process.env.GSC_SITE ?? null, ga4Property: process.env.GA4_PROPERTY ?? null },
  };
  if (mode.mode !== "none" && (mode.mode === "service-account" || mode.authorised)) {
    try {
      const { token, identity } = await accessToken(mode);
      result.google.identity = identity;
      result.google.gscSites = (await listGscSites(token)).map((site) => `${site.siteUrl} (${site.permissionLevel})`);
      try {
        result.google.ga4Properties = (await listGa4Properties(token)).map((item) => `${item.property} ${item.name} (${item.account})`);
      } catch (error) {
        result.google.ga4Error = error.message;
      }
    } catch (error) {
      result.google.error = error instanceof GoogleError ? error.message : String(error);
    }
  }
  print(result, () => {
    const g = result.google;
    return [
      "The post itself needs nothing: start reads its published URL.",
      `Google: ${g.mode === "none" ? "not configured (Search Console/GA4 by script unavailable; MCP or exports still work)" : `${g.mode} (${g.file})${g.mode === "oauth" && !g.authorised ? ", not authorised yet: run google-auth" : ""}`}`,
      g.identity ? `  signed in as ${g.identity}` : null,
      g.error ? `  error: ${g.error}` : null,
      g.gscSites ? `  Search Console properties it can read: ${g.gscSites.join(", ") || "none (add the account to the property)"}` : null,
      g.ga4Properties ? `  GA4 properties it can read: ${g.ga4Properties.join(", ") || "none (add the account as Viewer)"}` : null,
      g.ga4Error ? `  GA4 property list failed: ${g.ga4Error}` : null,
      `GSC_SITE: ${g.gscSite ?? "(unset)"} · GA4_PROPERTY: ${g.ga4Property ?? "(unset)"}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
};

const googleAuth = async () => {
  const file = await authorise(authMode());
  console.log(`Saved the token to ${file} (outside the repo). Run "setup" to see which properties it can read.`);
};

/** Publication dates from the sitemap, when the site has one: the age signal for candidates. */
const sitemapDates = async (origin) => {
  const get = async (url) => {
    try {
      const response = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(15000) });
      return response.ok ? await response.text() : null;
    } catch {
      return null;
    }
  };
  const robots = robotsRules((await get(`${origin}/robots.txt`)) ?? "");
  const queue = robots.sitemaps.length ? [...robots.sitemaps] : [`${origin}/sitemap.xml`];
  const dates = new Map();
  const ownHosts = new Set([hostOf(origin)]);
  for (let index = 0; index < queue.length && index < 50; index += 1) {
    const xml = await get(queue[index]);
    if (!xml) continue;
    const { isIndex, entries } = parseSitemap(xml);
    for (const entry of entries)
      if (isIndex) queue.push(entry.loc);
      else if (entry.lastmod && ownPath(entry.loc, ownHosts)) dates.set(ownPath(entry.loc, ownHosts), entry.lastmod);
  }
  return dates;
};

const candidates = async () => {
  const site = readArgument("site") ?? process.env.GSC_SITE;
  if (!site) fail("Set GSC_SITE (e.g. sc-domain:example.com or https://example.com/) or pass --site=.");
  const { token } = await google();
  const months = Number(readArgument("months") ?? 3);
  const current = windowRange("current", months, readArgument("end"));
  const previous = windowRange("previous", months, readArgument("end"));
  const [now, before] = await Promise.all([gscQuery(token, { site, ...current, dimension: "page" }), gscQuery(token, { site, ...previous, dimension: "page" })]);
  const origin = /^https?:\/\//.test(site) ? new URL(site).origin : `https://${site.replace(/^sc-domain:/, "")}`;
  const dates = await sitemapDates(origin);
  const posts = [...dates].map(([pagePath, lastmod]) => ({ path: pagePath, updatedAt: lastmod }));
  const prefixes = (readArgument("prefix") ?? "/blog/").split(",").filter(Boolean);
  const ranked = rankCandidates({ current: foldPages(now), previous: foldPages(before), posts, prefixes, limit: Number(readArgument("limit") ?? 20) });
  await writeJson(path.join(workDir, "candidates.json"), { site, current, previous, prefixes, generatedAt: new Date().toISOString(), ranked });
  print({ site, current, previous, prefixes, ranked }, () =>
    [
      `Search Console ${site}, pages under ${prefixes.join(", ")}, ${current.start}…${current.end} against ${previous.start}…${previous.end}. A suggestion list, not a queue:`,
      ...ranked.map((row, index) => `${String(index + 1).padStart(2)}. ${origin}${row.path}  ${row.clicks} clicks, ${row.impressions} impr., pos ${row.position?.toFixed(1) ?? "-"}\n    ${row.reasons.join("; ")}`),
      ranked.length ? null : `Nothing stands out (no lost clicks, nothing at position 5–15 with clicks, nothing older than a year). Other sections: --prefix=/news/,/guides/.`,
      dates.size ? null : "No sitemap dates found: age is not part of the ranking.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const SCOPE_TEMPLATE = (post) => `# Scope: ${post.title}

URL: ${post.url}
Picked by: TBD (name)
Why this post, in their words: TBD
Target query: TBD (only if known; "unresolved" is a real answer)
Decision wanted: TBD (refresh? why did it drop? should we touch it at all?)
`;

const RECOMMENDATIONS_TEMPLATE = `# Recommendations

Refresh thesis: We update [URL] to help [reader] do [job] for [intent], because [diagnosis]; protected: [passages]; success = [metric] by [date].

Route: TBD (no-change / technical / consolidation / content-light / content-deep)

| # | Element | Finding (with evidence) | Decision: apply / retain / not applicable | Exactly what changes |
|---|---|---|---|---|
| 1 | TBD | TBD | TBD | TBD |
`;

const PROTECTED_TEMPLATE = `# Protected passages

Text that already earns something (a featured snippet, a passage an AI answer cites, the section that ranks).
One fenced block per passage, the text itself, copied verbatim, with the evidence above it.
"Nothing protected" is a valid answer; write it if so.

<!-- Example:
Why protected: holds the featured snippet for "what is x" (GSC query, position 1.2)
\`\`\`
The exact paragraph text.
\`\`\`
-->
`;

const start = async () => {
  const url = readArgument("url") ?? readArgument("post");
  if (!url || !/^https?:\/\//.test(url)) fail("start needs --url=<the post's published URL> (https://…).");
  const content = readArgument("content");
  const file = readArgument("file");
  let page;
  let from;
  if (file) {
    const source = await readText(path.resolve(cwd, file));
    if (source === null) fail(`${file} not found.`);
    if (/\.(md|markdown|txt)$/i.test(file)) {
      const title = source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
      page = { url, title, seoTitle: "", description: "", publishedAt: null, modifiedAt: null, markdown: source.replace(/^#\s+.+\n+/m, "").trim() };
    } else page = readPage(source, url, { content });
    from = `file ${file}`;
  } else {
    const response = await fetchPage(url);
    if (!response.ok) fail(`Could not read ${url}: ${response.error}. Pass --file=<the article as HTML or Markdown> (an export from the CMS, or the page saved from a browser).`);
    page = readPage(response.html, response.url, { content });
    from = "live";
  }
  const markdown = page.markdown ?? articleMarkdown(page);
  const words = markdown.split(/\s+/).filter(Boolean).length;
  if (words < 150 && !file) console.error(`!! Only ${words} words read from ${url}: the article may be rendered by JavaScript, or the content element is wrong. Try --content=<selector>, or --file=<export>.`);

  const pagePath = new URL(page.url ?? url).pathname.replace(/(.)\/+$/, "$1");
  const slug = pagePath.split("/").filter(Boolean).pop() ?? "home";
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(workDir, slug, date);
  if (existsSync(path.join(dir, "run.json")) && !hasFlag("replace")) fail(`${display(dir)} already exists. Continue it with --run=${display(dir)}, or pass --replace to take a new snapshot.`);

  const metadata = { title: page.title ?? "", seoTitle: page.seoTitle ?? "", description: page.description ?? "" };
  const post = { url: page.url ?? url, path: pagePath, title: metadata.title, publishedAt: page.publishedAt ?? null, modifiedAt: page.modifiedAt ?? null };
  await mkdir(path.join(dir, "data"), { recursive: true });
  await writeJson(path.join(dir, "before.json"), { ...page, fetchedAt: new Date().toISOString() });
  await writeFile(path.join(dir, "before.md"), `${markdown}\n`);
  await writeFile(path.join(dir, "candidate.md"), `${markdown}\n`);
  await writeJson(path.join(dir, "metadata.before.json"), metadata);
  await writeJson(path.join(dir, "metadata.json"), metadata);
  for (const [name, text] of [
    ["scope.md", SCOPE_TEMPLATE(post)],
    ["recommendations.md", RECOMMENDATIONS_TEMPLATE],
    ["protected.md", PROTECTED_TEMPLATE],
  ])
    if (!existsSync(path.join(dir, name))) await writeFile(path.join(dir, name), text);

  const run = {
    startedAt: new Date().toISOString(),
    post,
    snapshot: { from, content: content ?? null, bodyHash: sha256(plainText(markdown)) },
    route: "undecided",
    gates: {},
    validated: null,
  };
  await saveRun(dir, run);
  print({ run: display(dir), post, snapshot: run.snapshot, words }, () =>
    [
      `Run: --run=${display(dir)}`,
      `${post.title || "(no title found)"} (${post.url}), snapshot from the ${from === "live" ? "live page" : from}${post.publishedAt ? `, published ${post.publishedAt.slice(0, 10)}` : ""}${post.modifiedAt ? `, modified ${post.modifiedAt.slice(0, 10)}` : ""}.`,
      `Wrote before.md/candidate.md (${markdownChunks(markdown).length} blocks, ${words} words), metadata.json, scope.md, recommendations.md, protected.md.`,
      "Read before.md against the page in a browser: if a section is missing or a menu got in, start again with --content=<selector> --replace.",
    ].join("\n"),
  );
};

// Search Console filters on the exact public URL.
const gsc = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const window = readArgument("window") ?? "current";
  const site = readArgument("site") ?? process.env.GSC_SITE;
  if (!site) fail("Set GSC_SITE (e.g. sc-domain:example.com or https://example.com/) or pass --site=.");
  const { token } = await google();
  const range = windowRange(window, Number(readArgument("months") ?? 3), readArgument("end"));
  const pageUrl = readArgument("page") ?? run.post.url;
  const [pageRows, queryRows] = await Promise.all([
    gscQuery(token, { site, ...range, dimension: "page", page: pageUrl }),
    gscQuery(token, { site, ...range, dimension: "query", page: pageUrl }),
  ]);
  const data = gscWindowFromRows({ pageRows, queryRows, range, source: { kind: "search-console-api", site, page: pageUrl } });
  if (!pageRows.length)
    console.error(`!! Search Console has no rows for ${pageUrl} in ${range.start}…${range.end}. Check that the URL matches the property exactly (www or not, trailing slash, http/https); pass --page= to override.`);
  const name = readArgument("as") ?? window;
  await writeJson(path.join(dir, "data", `gsc-${name}.json`), data);
  print(data.totals, () => `${name} ${range.start}…${range.end}: ${data.totals.clicks} clicks, ${data.totals.impressions} impressions, CTR ${(data.totals.ctr * 100).toFixed(1)}%, position ${data.totals.position?.toFixed(1) ?? "-"}; ${data.queries.length} queries. → data/gsc-${name}.json`);
};

const ga4 = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const window = readArgument("window") ?? "current";
  const property = readArgument("property") ?? process.env.GA4_PROPERTY;
  if (!property) fail("Set GA4_PROPERTY (properties/123456789) or pass --property=.");
  const { token } = await google();
  const range = windowRange(window, Number(readArgument("months") ?? 3), readArgument("end"));
  const result = await ga4LandingPage(token, { property: property.startsWith("properties/") ? property : `properties/${property}`, ...range, pagePath: run.post.path });
  const data = { range, source: { kind: "ga4-api", property, landingPage: run.post.path }, ...result };
  const name = readArgument("as") ?? window;
  await writeJson(path.join(dir, "data", `ga4-${name}.json`), data);
  print(data, () => `${name} ${range.start}…${range.end}: ${Object.entries(result.totals).map(([name, value]) => `${name} ${Number.isInteger(value) ? value : value.toFixed(2)}`).join(", ")} → data/ga4-${name}.json`);
};

const diagnose = async () => {
  const dir = runDir();
  const read = (name) => readJson(path.join(dir, "data", name), null);
  const currentName = readArgument("current") ?? "current";
  const current = await read(`gsc-${currentName}.json`);
  const baselines = readArgument("baseline") ? [readArgument("baseline")] : ["previous", "year-ago"];
  const results = {};
  for (const name of baselines) results[name] = compareWindows(current, await read(`gsc-${name}.json`));
  const ga4Current = await read(`ga4-${currentName}.json`);
  let ga4Baseline = null;
  for (const name of baselines) ga4Baseline ??= await read(`ga4-${name}.json`);

  const section = (label, result) => {
    if (!result.page) return `## Against ${label}\n\nDecline: **unknown**. ${result.reason}.\n`;
    const { current: a, baseline: b } = result.page;
    const lines = [
      `## Against ${label}`,
      "",
      `Decline: **${result.observed}**. ${result.reason}.`,
      "",
      "| | Baseline | Current |",
      "|---|---|---|",
      `| Clicks | ${b.clicks} | ${a.clicks} |`,
      `| Impressions | ${b.impressions} | ${a.impressions} |`,
      `| CTR | ${(b.ctr * 100).toFixed(1)}% | ${(a.ctr * 100).toFixed(1)}% |`,
      `| Position | ${b.position?.toFixed(1) ?? "-"} | ${a.position?.toFixed(1) ?? "-"} |`,
      "",
      "Queries that lost the most clicks:",
      "",
      "| Query | Clicks | Impressions | Position | Movement |",
      "|---|---|---|---|---|",
      ...result.queries.slice(0, 15).map((query) => `| ${query.key} | ${query.baseline?.clicks ?? 0} → ${query.current?.clicks ?? 0} | ${query.baseline?.impressions ?? 0} → ${query.current?.impressions ?? 0} | ${query.baseline?.position?.toFixed(1) ?? "-"} → ${query.current?.position?.toFixed(1) ?? "-"} | ${query.movement}: ${query.note} |`),
    ];
    return lines.join("\n");
  };
  const ga4Line = ga4Current
    ? `## GA4 (hygiene: it confirms a trend, it never establishes one)\n\n${ga4Baseline ? `Sessions ${ga4Baseline.totals.sessions} → ${ga4Current.totals.sessions}, engagement rate ${(ga4Baseline.totals.engagement_rate * 100).toFixed(0)}% → ${(ga4Current.totals.engagement_rate * 100).toFixed(0)}%, key events ${ga4Baseline.totals.key_events} → ${ga4Current.totals.key_events}.` : `Current window only: ${ga4Current.totals.sessions} sessions, engagement rate ${(ga4Current.totals.engagement_rate * 100).toFixed(0)}%.`}\n`
    : "## GA4\n\nNot available.\n";
  const markdown = [
    "# Data diagnosis",
    "",
    "Out of reach of this data, not ruled out: cannibalisation (needs the other pages), technical problems (needs the page itself), market-wide shifts (needs the market).",
    "",
    ...Object.entries(results).flatMap(([name, result]) => [section(name === "previous" ? "the previous period" : name === "year-ago" ? "the same period last year" : `"${name}"`, result), ""]),
    "",
    ga4Line,
  ].join("\n");
  await writeFile(path.join(dir, "data", "decline.md"), markdown);
  await writeJson(path.join(dir, "data", "decline.json"), results);
  print(results, () => `${markdown}\n→ data/decline.md`);
};

const mentionsCommand = async () => {
  const dir = runDir();
  const term = readArgument("term");
  if (!term) fail("mentions needs --term=<text>.");
  const version = readArgument("version") ?? "candidate";
  const markdown = await readText(path.join(dir, `${version}.md`));
  const found = mentions(markdown ?? "", term);
  print(found, () => (found.length ? found.map((item) => `[${item.section}] ${item.sentence}`).join("\n") : `"${term}" is not mentioned in ${version}.md.`));
};

const gate = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const name = readArgument("name");
  const by = readArgument("by")?.trim();
  if (!Object.keys(GATE_FILES).includes(name)) fail(`--name must be one of ${Object.keys(GATE_FILES).join(", ")}.`);
  if (!by) fail('--by="<the approver\'s name>" is required: a gate names a person. Ask for it; never sign for them.');
  const hashes = {};
  for (const file of GATE_FILES[name]) {
    const hash = await fileHash(dir, file);
    if (hash === null) fail(`${file} does not exist yet; there is nothing to approve.`);
    const content = await readText(path.join(dir, file));
    if (file !== "metadata.json" && /\bTBD\b/.test(content)) fail(`${file} still has TBD markers: finish it with the editor first.`);
    hashes[file] = hash;
  }
  const entry = { by, at: new Date().toISOString(), hashes };
  if (name === "gate1") {
    const route = readArgument("route");
    if (!["technical", "consolidation", "content-light", "content-deep"].includes(route)) fail("gate1 needs --route=technical|consolidation|content-light|content-deep (no-change has its own gate).");
    entry.route = route;
    run.route = route;
  }
  if (name === "no-change") {
    const rationale = readArgument("rationale");
    const revisit = readArgument("revisit");
    if (!rationale || !/^\d{4}-\d{2}-\d{2}$/.test(revisit ?? "")) fail('no-change needs --rationale="<why, from the diagnosis>" and --revisit=YYYY-MM-DD.');
    Object.assign(entry, { rationale, revisit });
    run.route = "no-change";
  }
  run.gates[name] = entry;
  await saveRun(dir, run);
  print(entry, () => `${name} recorded for ${by}, bound to ${Object.keys(hashes).join(", ")}. Editing those files later makes this approval stale.`);
};

/** Own-site links are requested always (they are few and ours); other sites only with --links. */
const checkLinks = async (links, run) => {
  const ownHosts = new Set([hostOf(run.post.url)]);
  const results = [];
  const queue = [...links];
  const worker = async () => {
    while (queue.length) {
      const link = queue.shift();
      if (/^(mailto|tel):/.test(link.href)) {
        results.push({ ...link, status: "ok", note: "mail/phone" });
        continue;
      }
      if (!/^([a-z]+:|\/)/i.test(link.href) && existsSync(path.join(runDir(), link.href))) {
        results.push({ ...link, status: "ok", note: "a new image from this run (uploaded by the editor)" });
        continue;
      }
      let url;
      try {
        url = new URL(link.href, run.post.url);
      } catch {
        results.push({ ...link, status: "broken", note: "not a URL" });
        continue;
      }
      const internal = ownHosts.has(url.hostname.replace(/^www\./, ""));
      if (!internal && !hasFlag("links")) {
        results.push({ ...link, status: "unchecked", note: "external (run validate --links to request it)" });
        continue;
      }
      try {
        const options = { headers: { "user-agent": USER_AGENT }, redirect: "manual", signal: AbortSignal.timeout(8000) };
        let response = await fetch(url.href, { ...options, method: "HEAD" });
        if (response.status === 405 || response.status === 403) response = await fetch(url.href, { ...options, method: "GET" });
        const status = response.status;
        results.push({ ...link, internal, status: status < 300 ? "ok" : status < 400 ? "redirect" : status === 404 || status === 410 ? "broken" : "unchecked", note: status < 400 && status >= 300 ? `${status} → ${response.headers.get("location")}` : `HTTP ${status}` });
      } catch (error) {
        results.push({ ...link, internal, status: "unchecked", note: error.name === "TimeoutError" ? "timed out" : "request failed" });
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return results;
};

const readProtected = async (dir) => {
  const content = (await readText(path.join(dir, "protected.md"))) ?? "";
  return [...content.replace(/<!--[\s\S]*?-->/g, "").matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => match[1].trim()).filter(Boolean);
};

const readVisuals = async (dir) => {
  const plan = (await readText(path.join(dir, "visual-plan.md"))) ?? "";
  const items = plan ? parseVisualPlan(plan) : [];
  const manifest = await readJson(path.join(dir, "images", "visuals.json"), { rendered: [] });
  return items
    .map((item) => ({ item, rendered: manifest.rendered.find((entry) => entry.id === item.id) }))
    .filter(({ rendered }) => rendered && existsSync(path.join(dir, "images", rendered.file)))
    .map(({ item, rendered }) => ({ file: rendered.file, src: `images/${rendered.file}`, alt: item.alt ?? "", caption: item.caption ?? "", from: rendered.from }));
};

const visuals = async () => {
  const dir = runDir();
  const planFile = path.join(dir, "visual-plan.md");
  if (!existsSync(planFile)) fail("No visual-plan.md: describe the images first, then render them.");
  let items;
  try {
    items = parseVisualPlan(await readFile(planFile, "utf8"));
  } catch (error) {
    fail(`visual-plan.md: ${error.message}`);
  }
  if (!items.length) fail("visual-plan.md has no ```visual blocks to render.");
  const only = readArgument("only");
  if (only) {
    const wanted = new Set(only.split(",").map((value) => value.trim()));
    items = items.filter((item) => wanted.has(item.id));
    if (!items.length) fail(`--only matched no visual id (${only}).`);
  }
  if (typeof WebSocket === "undefined") fail("visuals needs Node 22 or newer (it talks to the browser over WebSocket).");
  const browser = readArgument("browser") ?? findBrowser();
  if (!browser) fail("No Chrome or Edge found. Install one, or pass --browser=<path> / set CHROME_PATH.");
  const outDir = path.join(dir, "images");
  const { rendered, failed } = await renderVisuals(items, dir, outDir, browser);
  const manifestFile = path.join(outDir, "visuals.json");
  const previous = (await readJson(manifestFile, { rendered: [] })).rendered;
  // A failed capture removes an older file under its name: nothing stale is uploaded as if this run made it.
  const ids = new Set([...rendered.map((entry) => entry.id), ...failed.map((entry) => entry.id)]);
  for (const { id } of failed) {
    const file = items.find((item) => item.id === id)?.file;
    if (file && existsSync(path.join(outDir, file))) await rm(path.join(outDir, file));
  }
  await writeJson(manifestFile, { rendered: [...previous.filter((entry) => !ids.has(entry.id)), ...rendered] });
  print({ rendered: rendered.map((entry) => `images/${entry.file}`), failed }, () =>
    [
      rendered.length ? `Rendered ${rendered.map((entry) => `images/${entry.file}`).join(", ")}.` : "Nothing rendered.",
      ...failed.map((entry) => `  failed ${entry.id}: ${entry.error}`),
      "Look at every image before you call it done: a consent wall, a login page or a bot check is a failed capture, not an image.",
    ].join("\n"),
  );
  if (failed.length) process.exitCode = 1;
};

const review = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const hashes = await currentHashes(dir);
  const before = (await readText(path.join(dir, "before.md"))) ?? "";
  const candidate = (await readText(path.join(dir, "candidate.md"))) ?? "";
  const metadata = await readJson(path.join(dir, "metadata.json"), {});
  const beforeMeta = await readJson(path.join(dir, "metadata.before.json"), {});
  const validated = Boolean(run.validated && run.validated.candidateHash === hashes["candidate.md"] && run.validated.metadataHash === hashes["metadata.json"]);
  const labels = { title: "Title (H1)", seoTitle: "SEO title (<title>)", description: "Meta description" };
  const { counts } = comparisonMarkdown(diffChunks(markdownChunks(before), markdownChunks(candidate)));
  const images = await readVisuals(dir);
  const file = path.join(dir, "review.html");
  await writeFile(
    file,
    buildReviewPage({
      title: run.post.title,
      url: run.post.url,
      route: run.route,
      before,
      candidate,
      candidateHash: hashes["candidate.md"] ?? "",
      metadata: Object.entries(labels).map(([key, label]) => ({ label, before: beforeMeta[key] ?? "", after: metadata[key] ?? "" })),
      blockers: validated ? run.validated.blockers : [],
      findings: validated ? run.validated.findings : [],
      unchecked: validated ? run.validated.unchecked : [],
      images,
      counts,
      validated,
    }),
  );
  print({ file: display(file), validated, images: images.length }, () =>
    [`Wrote ${display(file)}${images.length ? ` with ${images.length} new images` : ""}. Open it with the editor; reading it is not approving it (gate --name=gate3).`, validated ? null : "!! Validation is missing or stale: run validate first, the page shows no checks."].filter(Boolean).join("\n"),
  );
};

const validate = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const candidate = await readText(path.join(dir, "candidate.md"));
  if (!candidate) fail("No candidate.md in the run.");
  const metadata = await readJson(path.join(dir, "metadata.json"), {});
  const checks = staticChecks({ markdown: candidate, metadata, protectedSpans: await readProtected(dir) });
  const links = await checkLinks(extractLinks(candidate), run);
  for (const link of links.filter((item) => item.status === "broken")) checks.blockers.push(`broken link: [${link.text}](${link.href}) ${link.note}`);
  for (const link of links.filter((item) => item.status === "redirect")) checks.findings.push(`redirecting link, worth updating: ${link.href} (${link.note})`);
  const unchecked = links.filter((item) => item.status === "unchecked");

  const beforeMarkdown = (await readText(path.join(dir, "before.md"))) ?? "";
  const comparison = comparisonMarkdown(diffChunks(markdownChunks(beforeMarkdown), markdownChunks(candidate)));
  const beforeMeta = await readJson(path.join(dir, "metadata.before.json"), {});
  const metaChanges = Object.keys(metadata).filter((key) => (metadata[key] ?? "") !== (beforeMeta[key] ?? "")).map((key) => `| ${key} | ${beforeMeta[key] ?? ""} | ${metadata[key] ?? ""} |`);
  await writeFile(
    path.join(dir, "comparison.md"),
    `${comparison.markdown}\n## Metadata\n\n${metaChanges.length ? `| Field | Before | After |\n|---|---|---|\n${metaChanges.join("\n")}` : "No metadata change."}\n`,
  );
  const result = { candidateHash: await fileHash(dir, "candidate.md"), metadataHash: await fileHash(dir, "metadata.json"), at: new Date().toISOString(), blockers: checks.blockers, findings: checks.findings, unchecked: unchecked.map((link) => `${link.href} (${link.note})`), words: checks.words, changes: comparison.counts };
  run.validated = result;
  await saveRun(dir, run);
  await writeJson(path.join(dir, "checks.json"), { ...result, links, outline: checks.outline });
  print(result, () =>
    [
      `${checks.words} words. ${comparison.counts.changed} changed, ${comparison.counts.formatting} formatting or links only, ${comparison.counts.added} added, ${comparison.counts.removed} removed, ${comparison.counts.same} unchanged → comparison.md`,
      checks.blockers.length ? `BLOCKERS (handoff refuses):\n${checks.blockers.map((item) => `  - ${item}`).join("\n")}` : "No blockers.",
      checks.findings.length ? `Findings (the editor decides):\n${checks.findings.map((item) => `  - ${item}`).join("\n")}` : null,
      unchecked.length ? `Not checked, verify by hand (not broken): ${unchecked.length}\n${unchecked.map((link) => `  - ${link.href} (${link.note})`).join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const currentHashes = async (dir) => {
  const hashes = {};
  for (const file of new Set(Object.values(GATE_FILES).flat())) hashes[file] = await fileHash(dir, file);
  return hashes;
};

const status = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const hashes = await currentHashes(dir);
  const gates = Object.fromEntries(Object.keys(GATE_FILES).map((name) => [name, { ...gateStatus(run.gates[name], hashes), by: run.gates[name]?.by ?? null }]));
  const data = ["gsc-current", "gsc-previous", "gsc-year-ago", "ga4-current", "ga4-previous", "ga4-year-ago", "decline"].filter((name) => existsSync(path.join(dir, "data", `${name}.json`)));
  const validatedCurrent = run.validated && run.validated.candidateHash === hashes["candidate.md"] && run.validated.metadataHash === hashes["metadata.json"];
  const notes = ["scope.md", "diagnosis.md", "editorial-audit.md", "recommendations.md", "protected.md"].map((file) => [file, existsSync(path.join(dir, file))]);
  const isContent = run.route.startsWith("content");
  const handedOff = run.handedOff && run.handedOff.candidateHash === hashes["candidate.md"];
  const next =
    run.route === "no-change"
      ? `done: no change, revisit on ${run.gates["no-change"]?.revisit}`
      : gates.gate1.state !== "current"
        ? "diagnose and audit, fill recommendations.md with the editor, then gate1"
        : !isContent
          ? "write the action package for the owner (technical/consolidation runs stop here)"
          : run.route === "content-deep" && gates.gate2.state !== "current"
            ? "write outline.md and get gate2"
            : !validatedCurrent
              ? "edit candidate.md and metadata.json, then validate"
              : run.validated.blockers.length
                ? "fix the blockers, then validate again"
                : gates.gate3.state !== "current"
                  ? "build review.html (review), walk the editor through it, then gate3"
                  : !handedOff
                    ? "handoff: the change list for the editor"
                    : run.verified?.complete
                      ? "done: the live page shows the approved version; follow up on the date in the measurement plan"
                      : "the editor makes the changes in the CMS and publishes; then verify";
  const result = { run: display(dir), post: run.post, route: run.route, gates, data, validated: validatedCurrent ? { blockers: run.validated.blockers.length, findings: run.validated.findings.length } : "missing or stale", notes: Object.fromEntries(notes), handedOff: run.handedOff ?? null, verified: run.verified ?? null, next };
  print(result, () =>
    [
      `${run.post.title} (${run.post.url}) · route ${run.route}`,
      `Gates: ${Object.entries(gates).map(([name, gate]) => `${name} ${gate.state}${gate.by ? ` (${gate.by})` : ""}${gate.stale ? ` [changed: ${gate.stale.join(", ")}]` : ""}`).join(" · ")}`,
      `Data: ${data.join(", ") || "none yet"}`,
      `Notes: ${notes.map(([file, present]) => `${file} ${present ? "✓" : "–"}`).join(" ")}`,
      `Validated: ${typeof result.validated === "string" ? result.validated : `${result.validated.blockers} blockers, ${result.validated.findings} findings`}`,
      run.handedOff ? `Handed off at ${run.handedOff.at}${handedOff ? "" : " (candidate.md changed since: hand off again)"}` : null,
      run.verified ? `Verified at ${run.verified.at}: ${run.verified.done}/${run.verified.total} changes live${run.verified.metadata.length ? `, metadata differs: ${run.verified.metadata.join(", ")}` : ""}` : null,
      `Next: ${next}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const handoff = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  const hashes = await currentHashes(dir);
  const refusals = [];
  if (!run.route.startsWith("content")) refusals.push(`the route is "${run.route}": only content routes hand off a text change`);
  for (const name of ["gate1", ...(run.route === "content-deep" ? ["gate2"] : []), "gate3"]) {
    const state = gateStatus(run.gates[name], hashes);
    if (state.state !== "current") refusals.push(`${name} is ${state.state}${state.stale ? ` (${state.stale.join(", ")} changed after it was approved)` : ""}`);
  }
  if (!run.validated || run.validated.candidateHash !== hashes["candidate.md"] || run.validated.metadataHash !== hashes["metadata.json"]) refusals.push("validate has not run on the current candidate.md and metadata.json");
  else if (run.validated.blockers.length) refusals.push(`validate found ${run.validated.blockers.length} blockers`);
  let drift = null;
  if (run.snapshot.from === "live") {
    const live = await readLive(run);
    if (!live.ok) drift = `the live page could not be read (${live.error}): check by hand that nobody published an edit since ${run.startedAt.slice(0, 10)}`;
    else if (sha256(plainText(live.markdown)) !== run.snapshot.bodyHash && !hasFlag("accept-drift"))
      refusals.push("the live article changed since the snapshot: someone published an edit while the run was open. Compare it with before.md, reconcile with the editor, then start a new run (or pass --accept-drift once the editor has confirmed the change list still applies)");
  }
  if (refusals.length) fail(`handoff refuses:\n${refusals.map((item) => `  - ${item}`).join("\n")}`);

  const before = (await readText(path.join(dir, "before.md"))) ?? "";
  const candidate = await readText(path.join(dir, "candidate.md"));
  const comparison = comparisonMarkdown(diffChunks(markdownChunks(before), markdownChunks(candidate)));
  const metadata = await readJson(path.join(dir, "metadata.json"));
  const beforeMeta = await readJson(path.join(dir, "metadata.before.json"), {});
  const labels = { title: "Title (H1)", seoTitle: "SEO title (<title>)", description: "Meta description" };
  const images = await readVisuals(dir);
  const metaRows = Object.keys(labels)
    .filter((key) => (metadata[key] ?? "") !== (beforeMeta[key] ?? ""))
    .map((key) => `| ${labels[key]} | ${beforeMeta[key] ?? ""} | ${metadata[key] ?? ""} |`);
  const markdown = [
    `# Update for ${run.post.title}`,
    "",
    `${run.post.url}`,
    "",
    `Approved by ${run.gates.gate3.by} on ${run.gates.gate3.at.slice(0, 10)} (route ${run.route}). Make these changes in the CMS, in a draft, and publish after review. The whole approved text is in \`candidate.md\`; \`changelog.md\` says why each change was made; \`review.html\` shows it all side by side.`,
    "",
    "## Metadata",
    "",
    metaRows.length ? `| Field | Now | Change to |\n|---|---|---|\n${metaRows.join("\n")}` : "No change.",
    "",
    `## Text (${comparison.counts.changed} changed, ${comparison.counts.added} added, ${comparison.counts.removed} removed, ${comparison.counts.formatting} formatting or links only)`,
    "",
    "In reading order. Links are site paths for this site's pages and full URLs elsewhere; use the CMS's internal link where it has one.",
    "",
    comparison.markdown.replace(/^# Before \/ after\n\n[^\n]*\n\n/, ""),
    ...(images.length
      ? [
          "## New images",
          "",
          "Upload each to the CMS's media library with its alt text, and put it where `candidate.md` shows it (`images/<file>`).",
          "",
          ...images.map((image) => `- \`images/${image.file}\`${image.alt ? `, alt: "${image.alt}"` : ", **no alt text: write one**"}${image.caption ? `, caption: "${image.caption}"` : ""}`),
          "",
        ]
      : []),
    "## After publishing",
    "",
    `Tell whoever runs this skill; \`verify\` then checks the live page against this list.${drift ? `\n\nNote: ${drift}.` : ""}`,
    "",
  ].join("\n");
  await writeFile(path.join(dir, "handoff.md"), markdown);
  run.handedOff = { at: new Date().toISOString(), candidateHash: hashes["candidate.md"], metadataHash: hashes["metadata.json"] };
  await saveRun(dir, run);
  print({ file: display(path.join(dir, "handoff.md")), changes: comparison.counts, metadata: metaRows.length }, () =>
    [`Wrote ${display(path.join(dir, "handoff.md"))}: ${comparison.counts.changed + comparison.counts.added + comparison.counts.removed} text changes, ${metaRows.length} metadata changes.`, drift ? `!! ${drift}` : null, "Give it to the editor. Nothing was changed on the site."].filter(Boolean).join("\n"),
  );
};

const verify = async () => {
  const dir = runDir();
  const run = await loadRun(dir);
  if (!run.handedOff) fail("Nothing was handed off in this run yet.");
  const live = await readLive(run);
  if (!live.ok) fail(`Could not read ${run.post.url}: ${live.error}.`);
  const before = (await readText(path.join(dir, "before.md"))) ?? "";
  const candidate = (await readText(path.join(dir, "candidate.md"))) ?? "";
  const changes = appliedChanges(diffChunks(markdownChunks(before), markdownChunks(candidate)), live.markdown);
  const metadata = await readJson(path.join(dir, "metadata.json"));
  const beforeMeta = await readJson(path.join(dir, "metadata.before.json"), {});
  const metaMismatch = ["title", "seoTitle", "description"].filter((key) => (metadata[key] ?? "") !== (beforeMeta[key] ?? "") && (live.page[key] ?? "") !== (metadata[key] ?? ""));
  const done = changes.filter((change) => change.done).length;
  run.verified = { at: new Date().toISOString(), done, total: changes.length, metadata: metaMismatch, complete: done === changes.length && !metaMismatch.length };
  await saveRun(dir, run);
  print({ ...run.verified, missing: changes.filter((change) => !change.done) }, () =>
    [
      `${done} of ${changes.length} approved text changes are on the live page${metaMismatch.length ? `; metadata not updated yet: ${metaMismatch.join(", ")}` : changes.length ? "; metadata as approved" : ""}.`,
      ...changes.filter((change) => !change.done).map((change) => `  not live (${change.type}): ${change.text}`),
      run.verified.complete ? "The live page shows the approved version." : "A cached page can lag behind a publish: re-run later before calling a change missing. A change the editor reworded shows as not live; compare by eye.",
    ].join("\n"),
  );
};

try {
  await {
    setup,
    "google-auth": googleAuth,
    candidates,
    start,
    gsc,
    ga4,
    diagnose,
    mentions: mentionsCommand,
    gate,
    visuals,
    validate,
    review,
    handoff,
    verify,
    status,
  }[command]();
} catch (error) {
  if (error instanceof GoogleError) fail(`Google: ${error.message}`);
  throw error;
}
