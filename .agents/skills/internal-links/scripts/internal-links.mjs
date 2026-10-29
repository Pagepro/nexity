// oxlint-disable no-console
// Reads the published site over HTTP and writes only to its working folder: it never touches a CMS.

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { USER_AGENT, fetchPage, hostOf, normalizePath, ownPath, parseSitemap, readPage, robotsRules } from "./html.mjs";
import {
  buildCandidates,
  buildCatalogue,
  deadRuleTargets,
  handoffMarkdown,
  inboundCounts,
  normalizeRules,
  seedLedger,
  shortlist,
  taskBlocks,
  toTsv,
  validateAnswer,
  verifyLive,
} from "./lib.mjs";
import { buildReport } from "./report.mjs";
import { LINK_TEMPLATES, documentsQuery, linkShapes, matchDocuments, planSanity, resolveTemplate, sanityClient, slugsFor, verifyItems, verifySanity } from "./sanity.mjs";

const HELP = `Usage (from any folder; the working folder is created there):
  node <skill>/scripts/internal-links.mjs <command> [options]

Commands
  check --site=<url>    Reads robots.txt, the sitemap and one sample page; saves the settings
  catalogue             Crawls the site -> <dir>/pages.json, <dir>/catalogue.json, orphans
  scan                  One task per source article -> <dir>/tasks/<n>.json
  review                Validate <dir>/answers/*.json, write report.html, proposals.tsv, sources.tsv
  handoff --file=<json> The approved links as a list for the editor -> links-to-add.md / .tsv
  verify --file=<json>  After the editor's edit: re-reads the articles, is every link live?

Optional, only when the user asks for it and gives access: approved links into Sanity drafts
  sanity-check          Access, the link annotation shape the dataset uses, which pages map to documents
  sanity-query --file=  The GROQ query and params to run through a Sanity MCP server
  sanity-apply --file=  Plan the drafts (dry run, writes sanity-plan.json); --apply writes them over the API
  sanity-verify --file= Are the links in the drafts?

Options
  --site=<url>          check: the site's public URL (https://www.example.com)
  --sitemap=<url>       check: sitemap URL (default: robots.txt, then /sitemap.xml)
  --urls=<file>         check: a text file of URLs to crawl instead of the sitemap
  --content=<selector>  check: the element that holds the article (tag, .class, #id), when the
                        default (<article>, else <main>) picks the wrong one
  --include=<prefixes>  check: crawl only these path prefixes (comma-separated)
  --exclude=<prefixes>  check: never crawl these path prefixes
  --max-pages=<n>       check: crawl at most n pages (default 1000)
  --sample=<path>       check: the page to test the extraction on
  --sources=<list>      scan: comma-separated paths (/blog/x) or URLs
  --prefix=<list>       scan: take every page under these prefixes as sources (default /blog/)
  --limit=<n>           scan: at most n sources
  --fresh               scan, verify: fetch the pages again instead of using the crawl
  --rules=<file>        Rules file (default: <dir>/rules.json, optional)
  --dir=<path>          Working folder (default: .internal-links)
  --documents=<file>    sanity-*: the documents as JSON (from sanity-query through MCP) instead of the API
  --link=<shape>        sanity-check: reference | href | a JSON template with $id, $path, $url
  --routes=<list>       sanity-check: type:prefix pairs (post:/blog/,page:/) when slugs are not unique
  --apply               sanity-apply: write over the API (default is a dry run)
  --json                Print JSON instead of text

Env for sanity-*: SANITY_PROJECT_ID, SANITY_DATASET (or the NEXT_PUBLIC_ names), SANITY_API_READ_TOKEN,
SANITY_API_WRITE_TOKEN (an Editor token, sanity-apply --apply only). From the shell, or .env.local / .env
here or in web/.`;

const COMMANDS = ["check", "catalogue", "scan", "review", "handoff", "verify", "sanity-check", "sanity-query", "sanity-apply", "sanity-verify"];
const CONCURRENCY = 4;
const DELAY_MS = 250;

const readArgument = (name) => {
  const found = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
};
const hasFlag = (name) => process.argv.includes(`--${name}`);
const readList = (name) =>
  (readArgument(name) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
const dir = path.resolve(cwd, readArgument("dir") ?? ".internal-links");
const files = {
  config: path.join(dir, "config.json"),
  pages: path.join(dir, "pages.json"),
  catalogue: path.join(dir, "catalogue.json"),
  rules: path.resolve(cwd, readArgument("rules") ?? path.join(dir, "rules.json")),
  tasks: path.join(dir, "tasks"),
  answers: path.join(dir, "answers"),
  proposals: path.join(dir, "proposals.json"),
  report: path.join(dir, "report.html"),
  proposalsTsv: path.join(dir, "proposals.tsv"),
  sourcesTsv: path.join(dir, "sources.tsv"),
  handoff: path.join(dir, "links-to-add.md"),
  handoffTsv: path.join(dir, "links-to-add.tsv"),
  sanityPlan: path.join(dir, "sanity-plan.json"),
  sanityLog: path.join(dir, "sanity-applied.log.jsonl"),
  backups: path.join(dir, "backups"),
};
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadConfig = async () => {
  const config = await readJson(files.config, null);
  if (!config) fail(`No ${display(files.config)}. Run "check --site=https://…" first.`);
  return { ...config, ownHosts: new Set([hostOf(config.site)]) };
};

const fetchText = async (url) => {
  try {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return /\.gz$/i.test(new URL(url).pathname) && buffer[0] === 0x1f ? gunzipSync(buffer).toString("utf8") : buffer.toString("utf8");
  } catch {
    return null;
  }
};

const readRobots = async (site) => robotsRules((await fetchText(new URL("/robots.txt", site).href)) ?? "");

/** Every page URL in the sitemap (following sitemap indexes), with its lastmod. */
const sitemapUrls = async (config, robots) => {
  const queue = config.sitemap ? [config.sitemap] : robots.sitemaps.length ? [...robots.sitemaps] : [new URL("/sitemap.xml", config.site).href];
  const seen = new Set();
  const urls = new Map();
  while (queue.length && seen.size < 200) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const xml = await fetchText(url);
    if (!xml) continue;
    const { isIndex, entries } = parseSitemap(xml);
    for (const entry of entries) {
      if (isIndex) queue.push(entry.loc);
      else if (!urls.has(entry.loc)) urls.set(entry.loc, entry.lastmod);
    }
  }
  return { sitemaps: [...seen], urls };
};

const inScope = (config, robots) => (url) => {
  const pathname = ownPath(url, config.ownHosts);
  if (!pathname) return false;
  if (config.include?.length && !config.include.some((prefix) => pathname.startsWith(prefix))) return false;
  if (config.exclude?.some((prefix) => pathname.startsWith(prefix))) return false;
  if (/\.(pdf|jpe?g|png|gif|webp|avif|svg|zip|mp4|mp3|xml|txt|json|md)$/i.test(pathname)) return false;
  return robots.allowed(new URL(url).pathname);
};

const readUrl = async (url, config, { allLinks = false, lastmod = null } = {}) => {
  const response = await fetchPage(url);
  if (!response.ok) return { url, ok: false, status: response.status, error: response.error };
  const page = readPage(response.html, response.url, { content: config.content, ownHosts: config.ownHosts, allLinks });
  return { ...page, ok: true, status: response.status, requested: url, lastmod };
};

/** Fetches pages a few at a time, politely; `discover` follows own-site links when there is no sitemap. */
const crawl = async (seeds, config, robots, { discover = false, max = 1000, lastmods = new Map() } = {}) => {
  const allowed = inScope(config, robots);
  const queue = seeds.filter(allowed);
  const queued = new Set(queue.map((url) => normalizePath(new URL(url).pathname)));
  const pages = [];
  let done = 0;
  const worker = async () => {
    while (queue.length && pages.length < max) {
      const url = queue.shift();
      const page = await readUrl(url, config, { allLinks: discover, lastmod: lastmods.get(url) ?? null });
      pages.push(page);
      done += 1;
      if (!isJson && done % 25 === 0) process.stderr.write(`  ${done} pages read…\n`);
      for (const link of page.links ?? []) {
        const key = normalizePath(new URL(link).pathname);
        if (queued.has(key) || !allowed(link) || queued.size >= max) continue;
        queued.add(key);
        queue.push(link.split("#")[0]);
      }
      delete page.links;
      await sleep(DELAY_MS);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return pages;
};

const check = async () => {
  const previous = await readJson(files.config, {});
  const site = readArgument("site") ?? previous.site;
  if (!site || !/^https?:\/\//.test(site)) fail('check needs --site=https://www.example.com (the public URL of the site).');
  const config = {
    site: new URL(site).origin,
    sitemap: readArgument("sitemap") ?? previous.sitemap ?? null,
    urlsFile: readArgument("urls") ? path.resolve(cwd, readArgument("urls")) : (previous.urlsFile ?? null),
    content: readArgument("content") ?? previous.content ?? null,
    include: readArgument("include") !== undefined ? readList("include") : (previous.include ?? []),
    exclude: readArgument("exclude") !== undefined ? readList("exclude") : (previous.exclude ?? []),
    maxPages: Number(readArgument("max-pages") ?? previous.maxPages ?? 1000),
  };
  const ownHosts = new Set([hostOf(config.site)]);
  const robots = await readRobots(config.site);
  const listed = config.urlsFile ? null : await sitemapUrls({ ...config, ownHosts }, robots);
  const urls = config.urlsFile ? (await readFile(config.urlsFile, "utf8")).split(/\s+/).filter((line) => /^https?:\/\//.test(line)) : [...listed.urls.keys()];
  const scoped = urls.filter(inScope({ ...config, ownHosts }, robots));
  const samplePath = readArgument("sample");
  const sampleUrl = samplePath ? new URL(samplePath, config.site).href : (scoped.find((url) => /\/(blog|news|articles?|insights|posts?)\/./.test(url)) ?? scoped[0] ?? config.site);
  const sample = await readUrl(sampleUrl, { ...config, ownHosts });
  await writeJson(files.config, config);

  const words = sample.ok ? sample.blocks.reduce((sum, block) => sum + block.text.split(/\s+/).filter(Boolean).length, 0) : 0;
  const result = {
    config: display(files.config),
    site: config.site,
    robotsSitemaps: robots.sitemaps,
    sitemaps: listed?.sitemaps ?? [],
    urls: urls.length,
    inScope: scoped.length,
    sample: sample.ok
      ? { url: sample.url, title: sample.title, contentTag: sample.contentTag, blocks: sample.blocks.length, words, links: sample.blocks.reduce((sum, block) => sum + block.links.length, 0), firstBlocks: sample.blocks.slice(0, 4).map((block) => `${block.kind}: ${block.text.slice(0, 90)}`) }
      : { url: sampleUrl, error: sample.error },
  };
  print(result, () =>
    [
      `Site ${config.site}. Settings saved to ${display(files.config)}.`,
      config.urlsFile ? `URL list ${config.urlsFile}: ${urls.length} URLs.` : `Sitemap: ${listed.sitemaps.join(", ") || "none found"}; ${urls.length} URLs${listed.urls.size ? "" : ' (none: "catalogue" will follow links from the home page instead)'}.`,
      `${scoped.length} in scope after robots.txt${config.include.length ? `, include ${config.include.join(" ")}` : ""}${config.exclude.length ? `, exclude ${config.exclude.join(" ")}` : ""}.`,
      sample.ok
        ? `Sample ${sample.url}: "${sample.title}", content read from <${sample.contentTag}>${config.content ? ` (${config.content})` : ""}, ${sample.blocks.length} blocks, ${words} words, ${result.sample.links} links in the content.\n${result.sample.firstBlocks.map((line) => `  ${line}`).join("\n")}`
        : `Sample ${sampleUrl} could not be read: ${sample.error}.`,
      sample.ok && words < 150 ? "!! Very little text: the article may be rendered by JavaScript, or the content element is wrong. Try --content=<selector>." : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const catalogue = async () => {
  const config = await loadConfig();
  const robots = await readRobots(config.site);
  let seeds;
  let lastmods = new Map();
  let discover = false;
  if (config.urlsFile) seeds = (await readFile(config.urlsFile, "utf8")).split(/\s+/).filter((line) => /^https?:\/\//.test(line));
  else {
    const listed = await sitemapUrls(config, robots);
    lastmods = listed.urls;
    seeds = [...listed.urls.keys()];
    if (!seeds.length) {
      seeds = [`${config.site}/`];
      discover = true;
    }
  }
  const pages = await crawl(seeds, config, robots, { discover, max: config.maxPages, lastmods });
  const brand = hostOf(config.site)?.split(".")[0] ?? "";
  const entries = buildCatalogue(pages, { brand, ownHosts: config.ownHosts });
  const inbound = inboundCounts(pages, entries, config.ownHosts);
  for (const entry of entries) entry.inbound = inbound.get(entry.id) ?? 0;

  const raw = await readJson(files.rules, null);
  const dead = raw ? deadRuleTargets({ phrases: raw.phrases ?? [] }, entries) : [];
  const orphans = entries.filter((entry) => entry.inbound === 0 && entry.path !== "/" && !entry.noIndex);
  const byType = {};
  for (const entry of entries) byType[entry.type] = (byType[entry.type] ?? 0) + 1;
  const thin = entries.filter((entry) => !entry.description && entry.words < 150);
  const failed = pages.filter((page) => !page.ok);
  const empty = pages.filter((page) => page.ok && !page.blocks.length);

  await writeJson(files.pages, { site: config.site, generatedAt: new Date().toISOString(), pages });
  await writeJson(files.catalogue, { site: config.site, generatedAt: new Date().toISOString(), entries });
  const result = { site: config.site, read: pages.length, failed: failed.map((page) => `${page.url} (${page.error})`), empty: empty.map((page) => page.url), pages: entries.length, byType, names: entries.reduce((sum, entry) => sum + entry.names.length, 0), thin: thin.length, orphans: orphans.map((entry) => entry.path), deadRuleTargets: dead, file: display(files.catalogue) };
  print(result, () =>
    [
      `Read ${pages.length} pages${discover ? " (no sitemap: followed links from the home page)" : ""}; ${entries.length} in ${display(files.catalogue)}: ${Object.entries(byType).map(([type, count]) => `${count} ${type}`).join(", ")}.`,
      failed.length ? `${failed.length} could not be read:\n${failed.slice(0, 15).map((page) => `  ${page.url} (${page.error})`).join("\n")}` : null,
      empty.length ? `${empty.length} pages with no readable content (JavaScript-rendered, or the content element is wrong): ${empty.slice(0, 5).map((page) => page.url).join(", ")}` : null,
      `${result.names} page names to match; ${thin.length} thin pages (no description, under 150 words).`,
      `${orphans.length} orphans (no other page links to them in its content)${orphans.length ? `:\n${orphans.slice(0, 40).map((entry) => `  ${entry.path}  ${entry.title ?? ""}`).join("\n")}` : "."}`,
      dead.length ? `Rules pointing at pages that are not in the crawl: ${dead.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const requireJson = async (file, step) => {
  const data = await readJson(file, null);
  if (!data) fail(`No ${display(file)}. Run "${step}" first.`);
  return data;
};

const taskName = (sourcePath) => (sourcePath.replace(/^\/+|\/+$/g, "").replace(/[^\w.-]+/g, "__") || "home");

const scan = async () => {
  const config = await loadConfig();
  const { entries } = await requireJson(files.catalogue, "catalogue");
  const { pages } = await requireJson(files.pages, "catalogue");
  const rules = normalizeRules(await readJson(files.rules, null), entries);
  const selectors = readList("sources").map((value) => normalizePath(/^https?:\/\//.test(value) ? new URL(value).pathname : value));
  const prefixes = readList("prefix").length ? readList("prefix") : ["/blog/"];
  const limit = Number(readArgument("limit") ?? Infinity);
  const byPath = new Map(pages.filter((page) => page.ok).map((page) => [ownPath(page.url, config.ownHosts), page]));

  let paths = selectors.length ? selectors : entries.filter((entry) => prefixes.some((prefix) => entry.path.startsWith(prefix.replace(/\/?$/, "/")))).map((entry) => entry.path);
  paths = paths.slice(0, limit);
  const summary = [];
  const missing = [];
  for (const sourcePath of paths) {
    let page = byPath.get(sourcePath);
    if (!page || hasFlag("fresh")) {
      const fresh = await readUrl(new URL(sourcePath, config.site).href, config);
      if (fresh.ok) page = fresh;
    }
    if (!page) {
      missing.push(sourcePath);
      continue;
    }
    const entry = entries.find((item) => item.id === sourcePath);
    const source = { id: sourcePath, path: sourcePath, url: page.url, title: entry?.title ?? page.title };
    const blocks = taskBlocks(page);
    const ledger = seedLedger(blocks, entries, rules, config.ownHosts);
    const candidates = buildCandidates(source, blocks, entries, rules, ledger);
    const text = blocks.map((block) => block.text).join("\n");
    const name = taskName(sourcePath);
    const task = {
      site: config.site,
      generatedAt: new Date().toISOString(),
      source,
      answerFile: display(path.join(files.answers, `${name}.json`)),
      maxNewLinks: rules.maxNewLinksPerArticle,
      ledger: { targets: [...ledger.targets], anchors: [...ledger.anchors], clusters: [...ledger.clusters], existing: ledger.existing },
      blocks,
      candidates,
      shortlist: shortlist(source, text, entries, ledger, { exclude: rules.excludeTargets }),
    };
    await writeJson(path.join(files.tasks, `${name}.json`), task);
    summary.push({ path: sourcePath, title: source.title, blocks: blocks.length, words: text.split(/\s+/).filter(Boolean).length, existingLinks: ledger.existing, candidates: candidates.length, shortlist: task.shortlist.length });
  }

  print({ tasks: summary, missing, dir: display(files.tasks) }, () =>
    [
      `${summary.length} tasks in ${display(files.tasks)}:`,
      ...summary.map((item) => `  ${item.path}  ${item.words} words, ${item.existingLinks} internal links already, ${item.candidates} name matches, ${item.shortlist} pages on the shortlist`),
      missing.length ? `Not found or not readable: ${missing.join(", ")}` : null,
      summary.length ? `Name matches in total: ${summary.reduce((sum, item) => sum + item.candidates, 0)}. Answers go to ${display(files.answers)}/<task file name>.` : `No sources. Pass --sources=/blog/x or --prefix=/news/ (pages under /blog/ are the default).`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const review = async () => {
  const config = await loadConfig();
  const { entries } = await requireJson(files.catalogue, "catalogue");
  const rules = normalizeRules(await readJson(files.rules, null), entries);
  if (!existsSync(files.tasks)) fail(`No ${display(files.tasks)}. Run "scan" first.`);
  const taskFiles = (await readdir(files.tasks)).filter((name) => name.endsWith(".json")).sort();
  const sources = [];
  const items = [];
  const rejected = [];
  for (const name of taskFiles) {
    const task = await readJson(path.join(files.tasks, name));
    const answer = await readJson(path.join(files.answers, name), null);
    const source = { ...task.source, status: "Failed", note: "" };
    if (!answer) {
      source.note = "No answer yet.";
      sources.push(source);
      continue;
    }
    const result = validateAnswer(task, answer, rules);
    items.push(...result.accepted.map((item) => ({ ...item, sourceUrl: task.source.url, targetUrl: entries.find((entry) => entry.id === item.target)?.url ?? `${config.site}${item.targetPath}` })));
    rejected.push(...result.rejected.map(({ proposal, reason }) => ({ sourceId: task.source.id, anchor: proposal.anchor, target: proposal.target, reason })));
    source.status = result.accepted.length ? "Success" : "Failed";
    source.note = result.accepted.length ? "" : answer.note || "Nothing proposed.";
    source.declined = result.declined.length;
    sources.push(source);
  }

  const meta = { site: config.site, generatedAt: new Date().toISOString() };
  await writeJson(files.proposals, { meta, sources, items, rejected });
  await writeFile(files.report, buildReport({ meta, sources, items, rejected }));
  await writeFile(files.proposalsTsv, toTsv(["Source url", "Target anchor", "Target url", "link_id"], items.map((item) => [item.sourceUrl, item.anchor, item.targetUrl, item.id])));
  await writeFile(files.sourcesTsv, toTsv(["Source url", "Status"], sources.map((source) => [source.url, source.status])));

  print({ report: display(files.report), proposals_tsv: display(files.proposalsTsv), sources_tsv: display(files.sourcesTsv), proposals: items.length, rejected: rejected.length, sources: sources.map(({ path: sourcePath, status, note }) => ({ path: sourcePath, status, note })) }, () =>
    [
      `${items.length} proposals passed the checks, ${rejected.length} rejected.`,
      ...rejected.map((entry) => `  rejected "${entry.anchor}" → ${entry.target}: ${entry.reason}`),
      `Review page: ${display(files.report)}`,
      `Tables: ${display(files.proposalsTsv)}, ${display(files.sourcesTsv)}`,
      ...sources.filter((source) => source.status === "Failed").map((source) => `  Failed: ${source.path} (${source.note})`),
    ].join("\n"),
  );
};

const readApproved = async () => {
  const fileArgument = readArgument("file");
  if (!fileArgument) fail(`${command} needs --file=<approved.json> (downloaded from the review page).`);
  const approved = await readJson(path.resolve(cwd, fileArgument), null);
  if (!approved?.items) fail(`${fileArgument} is not an approved.json from the review page.`);
  return approved;
};

const handoff = async () => {
  const approved = await readApproved();
  const { markdown, rows } = handoffMarkdown(approved.items);
  await writeFile(files.handoff, markdown);
  await writeFile(files.handoffTsv, toTsv(["Article", "Sentence", "Link this text", "To"], rows));
  const articles = new Set(approved.items.map((item) => item.sourcePath)).size;
  print({ file: display(files.handoff), tsv: display(files.handoffTsv), links: approved.items.length, articles }, () => `${approved.items.length} links in ${articles} articles for the editor: ${display(files.handoff)} (and ${display(files.handoffTsv)} for a spreadsheet).`);
};

const verify = async () => {
  const approved = await readApproved();
  const config = await loadConfig();
  const pagesByPath = new Map();
  for (const sourcePath of new Set(approved.items.map((item) => item.sourcePath))) pagesByPath.set(sourcePath, await readUrl(new URL(sourcePath, config.site).href, config));
  const results = verifyLive(approved.items, pagesByPath, config.ownHosts);
  const counts = {};
  for (const result of results) counts[result.state] = (counts[result.state] ?? 0) + 1;
  print({ counts, results: results.map(({ sourcePath, anchor, targetPath, state, note }) => ({ sourcePath, anchor, targetPath, state, note })) }, () =>
    [
      `${results.length} approved links: ${Object.entries(counts).map(([state, count]) => `${count} ${state}`).join(", ")}.`,
      ...results.filter((result) => result.state !== "present" || result.note).map((result) => `  ${result.state}: ${result.sourcePath} "${result.anchor}" → ${result.targetPath}${result.note ? ` (${result.note})` : ""}`),
      "Live pages can lag behind a publish by the site's cache time: re-run later before calling a link missing.",
    ].join("\n"),
  );
};

/* ------------------------------------------------------------------ optional: Sanity drafts */

const sanityEnv = ({ write = false } = {}) => {
  // Shell variables win: loadEnvFile never overwrites one that is set.
  for (const name of [".env.local", ".env", "web/.env.local", "web/.env"]) if (existsSync(path.join(cwd, name))) process.loadEnvFile(path.join(cwd, name));
  const env = process.env;
  const projectId = env.SANITY_PROJECT_ID ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_DATASET ?? env.NEXT_PUBLIC_SANITY_DATASET ?? env.SANITY_STUDIO_DATASET;
  const writeToken = env.SANITY_API_WRITE_TOKEN;
  const token = write ? writeToken : (env.SANITY_API_READ_TOKEN ?? writeToken);
  return { projectId, dataset, token, hasRead: Boolean(env.SANITY_API_READ_TOKEN ?? writeToken), hasWrite: Boolean(writeToken) };
};

const readDocumentsFile = async () => {
  const file = readArgument("documents");
  if (!file) return null;
  const raw = await readJson(path.resolve(cwd, file), null);
  if (!raw) fail(`${file} not found.`);
  const list = Array.isArray(raw) ? raw : (raw.result ?? raw.documents);
  if (!Array.isArray(list)) fail(`${file} is not a list of documents (the result of the sanity-query query).`);
  return list;
};

const fetchDocuments = async (items) => {
  const fromFile = await readDocumentsFile();
  if (fromFile) return { documents: fromFile, from: "file" };
  const env = sanityEnv();
  if (!env.projectId || !env.dataset) fail("No Sanity project: set SANITY_PROJECT_ID and SANITY_DATASET, or pass --documents=<file> from a Sanity MCP server (see sanity-query).");
  if (!env.token) console.error("!! No read token: drafts are invisible, and a draft that exists would be overwritten by a copy of the published document. Set SANITY_API_READ_TOKEN.");
  const slugs = slugsFor(items.flatMap((item) => [item.sourcePath, item.targetPath]));
  return { documents: await sanityClient(env).query(documentsQuery, { slugs }), from: "api" };
};

const sanitySettings = (config) => {
  const setting = config.sanity?.link;
  if (!setting) fail('No link shape chosen yet. Run "sanity-check" (it reads the shapes the dataset uses) and save one with --link=reference|href|<json>.');
  return { template: resolveTemplate(setting), routes: config.sanity?.routes ?? null, site: config.site };
};

const sanityCheck = async () => {
  const config = await loadConfig();
  const env = sanityEnv();
  const sanity = { ...(config.sanity ?? {}) };
  if (readArgument("link")) {
    const value = readArgument("link");
    if (!LINK_TEMPLATES[value]) {
      try {
        JSON.parse(value);
      } catch {
        fail("--link must be reference, href, or a JSON template.");
      }
    }
    sanity.link = value;
  }
  if (readArgument("routes")) sanity.routes = Object.fromEntries(readList("routes").map((pair) => pair.split(":")).map(([type, prefix]) => [type, prefix ?? "/"]));
  let documents = await readDocumentsFile();
  let error = null;
  if (!documents && env.projectId && env.dataset) {
    try {
      documents = await sanityClient(env).query(`*[!(_id in path("versions.**")) && defined(coalesce(metadata.slug.current, slug.current))] | order(_updatedAt desc) [0...300]`);
    } catch (caught) {
      error = caught.message;
    }
  }
  const shapes = documents ? linkShapes(documents) : null;
  if (!sanity.link && shapes?.suggested) sanity.link = shapes.suggested;
  const { entries } = (await readJson(files.catalogue, null)) ?? { entries: [] };
  const mapped = documents && entries.length ? matchDocuments(entries.map((entry) => entry.path), documents, sanity.routes ?? null) : null;
  await writeJson(files.config, { ...(await readJson(files.config, {})), sanity });
  const result = {
    projectId: env.projectId ?? null,
    dataset: env.dataset ?? null,
    readToken: env.hasRead,
    writeToken: env.hasWrite,
    documents: documents?.length ?? null,
    error,
    shapes: shapes?.shapes.slice(0, 5).map(({ shape, count, example }) => ({ shape, count, example })),
    link: sanity.link ?? null,
    routes: sanity.routes ?? null,
    mapped: mapped ? { pages: mapped.size, found: [...mapped.values()].filter((entry) => !entry.error).length, missing: [...mapped].filter(([, entry]) => entry.error).slice(0, 10).map(([pagePath, entry]) => `${pagePath}: ${entry.error}`) } : null,
  };
  print(result, () =>
    [
      readArgument("documents") ? `Documents from ${readArgument("documents")} (MCP route).` : `Sanity: project ${env.projectId ?? "(unset)"}, dataset ${env.dataset ?? "(unset)"}; read token ${env.hasRead ? "yes" : "no (drafts invisible)"}, write token ${env.hasWrite ? "yes" : "no (needed only for sanity-apply --apply)"}.`,
      error ? `!! ${error}` : null,
      documents ? `${documents.length} documents with a slug read.` : null,
      shapes ? `Link annotations in use:\n${shapes.shapes.slice(0, 5).map((entry) => `  ${entry.count}× {${entry.shape}}`).join("\n") || "  none found"}` : null,
      `Link shape: ${sanity.link ? `${typeof sanity.link === "string" && LINK_TEMPLATES[sanity.link] ? `${sanity.link} ${JSON.stringify(LINK_TEMPLATES[sanity.link])}` : sanity.link}` : "not chosen: pass --link="}${shapes?.suggested && !readArgument("link") ? " (suggested from the dataset)" : ""}`,
      mapped ? `Catalogue pages with a document: ${result.mapped.found} of ${result.mapped.pages}${result.mapped.missing.length ? `\n${result.mapped.missing.map((line) => `  ${line}`).join("\n")}` : ""}` : null,
      `Saved to ${display(files.config)}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
};

const sanityQuery = async () => {
  const approved = await readApproved();
  const params = { slugs: slugsFor(approved.items.flatMap((item) => [item.sourcePath, item.targetPath])) };
  print({ query: documentsQuery, params }, () => `Run this through the Sanity MCP server's GROQ query tool (all documents, drafts included), and save the result as JSON for --documents=:\n\n${documentsQuery}\n\nparams: ${JSON.stringify(params)}`);
};

const describePlan = (transactions, skipped, verb) =>
  [
    `${verb} ${transactions.reduce((sum, transaction) => sum + transaction.changes.length, 0)} links into ${transactions.length} drafts (${transactions.filter((item) => item.create).length} new drafts). Skipped ${skipped.length}.`,
    ...transactions.flatMap((transaction) => transaction.changes.map((change) => `  ${transaction.title}: "${change.anchor}" → ${change.targetPath}${transaction.create ? " (new draft)" : ""}`)),
    ...skipped.map(({ item, reason }) => `  skipped "${item.anchor}" in ${item.sourcePath}: ${reason}`),
  ].join("\n");

const sanityApply = async () => {
  const approved = await readApproved();
  const config = await loadConfig();
  const settings = sanitySettings(config);
  const isApply = hasFlag("apply");
  if (isApply && readArgument("documents")) fail("--apply writes over the API. On the MCP route the MCP server writes: take the mutations from sanity-plan.json.");
  const env = sanityEnv({ write: isApply });
  if (isApply && !env.hasWrite) fail("--apply needs SANITY_API_WRITE_TOKEN (an Editor token). Nothing was written.");
  const { documents, from } = await fetchDocuments(approved.items);
  const { transactions, skipped } = planSanity(approved.items, documents, settings);
  await writeJson(files.sanityPlan, { site: config.site, from, generatedAt: new Date().toISOString(), transactions, skipped: skipped.map(({ item, reason }) => ({ id: item.id, anchor: item.anchor, sourcePath: item.sourcePath, reason })) });
  if (!isApply) {
    print({ dryRun: true, plan: display(files.sanityPlan), transactions: transactions.map(({ mutations, ...rest }) => rest), skipped }, () => `${describePlan(transactions, skipped, "Would write")}\nDry run: nothing was written. Mutations in ${display(files.sanityPlan)}${from === "file" ? " (apply them through the MCP server, one transaction per document)" : "; add --apply to write"}.`);
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  await writeJson(path.join(files.backups, `${stamp}.json`), documents);
  const client = sanityClient(env);
  const results = [];
  for (const transaction of transactions) {
    try {
      await client.mutate(transaction.mutations);
      const stored = await client.query(`*[_id == $id][0]`, { id: transaction.documentId });
      const verified = verifySanity(transaction, stored);
      results.push({ documentId: transaction.documentId, ok: verified.every((change) => change.present), missing: verified.filter((change) => !change.present).map((change) => change.anchor) });
    } catch (error) {
      results.push({ documentId: transaction.documentId, ok: false, error: error.message });
    }
  }
  await writeFile(files.sanityLog, results.map((result) => JSON.stringify({ at: new Date().toISOString(), dataset: env.dataset, ...result })).join("\n") + "\n", { flag: "a" });
  const outcome = {
    applied: results.filter((result) => result.ok).reduce((sum, result) => sum + transactions.find((item) => item.documentId === result.documentId).changes.length, 0),
    guardRejected: skipped.length,
    writeFailed: results.filter((result) => result.error).length,
    verifyFailed: results.flatMap((result) => result.missing ?? []).length,
  };
  print({ outcome, results, backup: display(path.join(files.backups, `${stamp}.json`)) }, () =>
    [
      describePlan(transactions, skipped, "Wrote"),
      `applied ${outcome.applied}, guard_rejected ${outcome.guardRejected}, write_failed ${outcome.writeFailed}, verify_failed ${outcome.verifyFailed}${results.filter((result) => result.error).map((result) => `\n  ${result.documentId}: ${result.error}`).join("")}`,
      `Backup of the documents as read: ${display(path.join(files.backups, `${stamp}.json`))}. The drafts wait for an editor to review and publish them.`,
    ].join("\n"),
  );
};

const sanityVerify = async () => {
  const approved = await readApproved();
  const config = await loadConfig();
  const { documents } = await fetchDocuments(approved.items);
  const results = verifyItems(approved.items, documents, config.sanity?.routes ?? null);
  const counts = {};
  for (const result of results) counts[result.state] = (counts[result.state] ?? 0) + 1;
  print({ counts, results: results.map(({ item, state, note }) => ({ sourcePath: item.sourcePath, anchor: item.anchor, targetPath: item.targetPath, state, note })) }, () =>
    [`${results.length} approved links: ${Object.entries(counts).map(([state, count]) => `${count} ${state}`).join(", ")} in the drafts.`, ...results.filter((result) => result.state !== "present").map((result) => `  ${result.state}: ${result.item.sourcePath} "${result.item.anchor}" → ${result.item.targetPath}${result.note ? ` (${result.note})` : ""}`)].join("\n"),
  );
};

await { check, catalogue, scan, review, handoff, verify, "sanity-check": sanityCheck, "sanity-query": sanityQuery, "sanity-apply": sanityApply, "sanity-verify": sanityVerify }[command]();
