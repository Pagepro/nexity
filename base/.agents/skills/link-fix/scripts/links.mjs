// oxlint-disable no-console
// Run from the starter's web/ folder: it resolves @sanity/client and dotenv from there.
//   node <skill>/scripts/links.mjs check [--rules=own-domain,http,slash] [--host=example.com]
//        [--trailing-slash=auto|never|always] [--verify-https] [--dataset=…] [--json]
//   node <skill>/scripts/links.mjs fix --rules=own-domain,http,slash [--to=auto|reference|path]
//        [--apply] [--drafts=both|skip] [--include-broken] [--verify-https] [--keep-http=host,…]

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { RULES, buildOwnHosts, detectTrailingSlash, planPatches, scanDocuments, summarize } from "./lib.mjs";

const PAGE_SIZE = 500;
const LIST_LIMIT = 100;
const HTTPS_TIMEOUT_MS = 8_000;
const HTTPS_CONCURRENCY = 6;

const webDir = process.cwd();
const requireFromWeb = createRequire(path.join(webDir, "package.json"));

const importFromWeb = async (specifier) => {
  try {
    return await import(pathToFileURL(requireFromWeb.resolve(specifier)).href);
  } catch {
    console.error(
      `Cannot load ${specifier} from ${webDir}. Run this from the starter's web/ folder after pnpm install.`,
    );
    process.exit(1);
  }
};

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

const command = process.argv[2];
if (command !== "check" && command !== "fix") {
  console.error("Usage: links.mjs check|fix [--rules=own-domain,http,slash] [--apply] (see SKILL.md)");
  process.exit(1);
}

const rules = readList("rules");
const mode = readArgument("to") ?? "auto";
const drafts = readArgument("drafts") ?? "both";
const trailingSlashArgument = readArgument("trailing-slash") ?? "auto";
const isApply = command === "fix" && hasFlag("apply");
const isJson = hasFlag("json");
const includeBroken = hasFlag("include-broken");
const verifyHttps = hasFlag("verify-https");
const keepHttp = new Set(readList("keep-http").map((host) => host.toLowerCase().replace(/^www\./, "")));

if (command === "fix" && !rules.length) {
  console.error("fix needs --rules= with the rules the user picked from the check: own-domain, http, slash.");
  process.exit(1);
}
if (rules.some((rule) => !RULES.includes(rule))) {
  console.error(`--rules takes ${RULES.join(", ")} (comma-separated).`);
  process.exit(1);
}
const selectedRules = rules.length ? rules : RULES;
if (
  !["auto", "reference", "path"].includes(mode) ||
  !["both", "skip"].includes(drafts) ||
  !["auto", "never", "always"].includes(trailingSlashArgument)
) {
  console.error("--to must be auto, reference or path; --drafts both or skip; --trailing-slash auto, never or always.");
  process.exit(1);
}

const readNextConfig = () => {
  for (const name of ["next.config.ts", "next.config.mjs", "next.config.js", "next.config.cjs"]) {
    const file = path.join(webDir, name);
    if (existsSync(file)) return { name, source: readFileSync(file, "utf8") };
  }
  return null;
};
const nextConfig = readNextConfig();
const trailingSlash =
  trailingSlashArgument === "auto" ? detectTrailingSlash(nextConfig?.source) : trailingSlashArgument;
const trailingSlashSource =
  trailingSlashArgument !== "auto"
    ? "--trailing-slash"
    : nextConfig
      ? `${nextConfig.name}: trailingSlash ${trailingSlash === "always" ? "true" : "unset/false"}`
      : "no next.config found, Next's default";

const { config: loadEnv } = await importFromWeb("dotenv");
loadEnv({ path: [path.join(webDir, ".env.local"), path.join(webDir, ".env")], quiet: true });
const { createClient } = await importFromWeb("@sanity/client");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = readArgument("dataset") ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const writeToken = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
const token = writeToken || process.env.SANITY_API_READ_TOKEN;

if (!projectId || !dataset) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in web/.env.local or web/.env (or --dataset=).",
  );
  process.exit(1);
}
if (isApply && !writeToken) {
  console.error(
    "--apply needs SANITY_API_WRITE_TOKEN (an Editor token) in web/.env.local or the shell. Nothing was written.",
  );
  process.exit(1);
}

const ownHosts = buildOwnHosts([process.env.NEXT_PUBLIC_BASE_URL, ...readList("host")]);
if (!ownHosts.size && selectedRules.includes("own-domain")) {
  console.error(
    "No site domain. NEXT_PUBLIC_BASE_URL is unset or localhost: pass --host=example.com (comma-separate extra domains).",
  );
  process.exit(1);
}

// raw = published + drafts + release versions; useCdn false = no stale reads.
const client = createClient({
  projectId,
  dataset,
  token: isApply ? writeToken : token,
  apiVersion: "2025-02-19",
  useCdn: false,
  perspective: "raw",
});

const fetchAllDocuments = async () => {
  const documents = [];
  let lastId = "";
  for (;;) {
    const page = await client.fetch(
      `*[!(_type match "sanity.*") && !(_id in path("_.**")) && _id > $lastId] | order(_id) [0...${PAGE_SIZE}]`,
      { lastId },
    );
    documents.push(...page);
    if (page.length < PAGE_SIZE) return documents;
    lastId = page[page.length - 1]._id;
  }
};

// Some servers answer HEAD with 403/405 but serve GET; the body is never read.
const probeHttps = async (url) => {
  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(HTTPS_TIMEOUT_MS),
      });
      await response.body?.cancel();
      if (response.status < 400 || method === "GET") return { ok: response.status < 400, status: response.status };
    } catch (error) {
      if (method === "GET") return { ok: false, status: error?.name === "TimeoutError" ? "timeout" : (error?.cause?.code ?? "error") };
    }
  }
  return { ok: false, status: "error" };
};

const verifyHttpsTargets = async (findings) => {
  const targets = [
    ...new Set(
      findings.filter((finding) => finding.rule === "http" && finding.fixable).map((finding) => finding.suggested),
    ),
  ];
  const results = new Map();
  let next = 0;
  const worker = async () => {
    while (next < targets.length) {
      const url = targets[next++];
      results.set(url, await probeHttps(url));
    }
  };
  await Promise.all(Array.from({ length: HTTPS_CONCURRENCY }, worker));
  for (const finding of findings)
    if (finding.rule === "http" && results.has(finding.suggested)) finding.https = results.get(finding.suggested);
};

const describe = (finding) =>
  `${finding.documentType} [${finding.documentId}] ${finding.kind} ${JSON.stringify(finding.value)}` +
  (finding.suggested !== undefined && finding.suggested !== null ? ` → ${JSON.stringify(finding.suggested)}` : "") +
  (finding.target ? ` → ${finding.target._type} ${finding.target._id}` : "") +
  (finding.https ? ` (https: ${finding.https.status})` : "") +
  (finding.note ? ` (${finding.note})` : "");

const printCounts = (heading, counts) => {
  const entries = Object.entries(counts);
  console.log(`\n${heading}`);
  if (!entries.length) console.log("  (none)");
  for (const [key, count] of entries) console.log(`  ${String(count).padStart(5)}  ${key}`);
};

const printList = (heading, items, format) => {
  if (!items.length) return;
  console.log(`\n## ${heading} (${items.length})`);
  for (const item of items.slice(0, LIST_LIMIT)) console.log(`- ${format(item)}`);
  if (items.length > LIST_LIMIT) console.log(`  … and ${items.length - LIST_LIMIT} more (use --json)`);
};

const printTable = (rows) => {
  const columns = ["rule", "issue", "total", "fixable", "published", "draft", "version"];
  const widths = columns.map((column) =>
    Math.max(column.length, ...rows.map((row) => String(row[column]).length)),
  );
  const line = (cells) => `| ${cells.map((cell, position) => String(cell).padEnd(widths[position])).join(" | ")} |`;
  console.log(line(columns));
  console.log(`|${widths.map((width) => "-".repeat(width + 2)).join("|")}|`);
  for (const row of rows) console.log(line(columns.map((column) => row[column])));
};

const printHttpHosts = (findings) => {
  const hosts = new Map();
  for (const finding of findings.filter((item) => item.rule === "http")) {
    const entry = hosts.get(finding.host) ?? { links: 0, ok: 0, failed: 0, local: 0, own: finding.own };
    entry.links += 1;
    if (!finding.fixable) entry.local += 1;
    else if (finding.https?.ok) entry.ok += 1;
    else if (finding.https) entry.failed += 1;
    hosts.set(finding.host, entry);
  }
  if (!hosts.size) return;
  console.log(`\nhttp:// hosts${verifyHttps ? " (https checked)" : " (add --verify-https to check https answers)"}`);
  for (const [host, entry] of [...hosts].sort((a, b) => b[1].links - a[1].links)) {
    const notes = [
      entry.own && "own domain",
      entry.local && "local, never upgraded",
      keepHttp.has(host.replace(/^www\./, "")) && "kept (--keep-http)",
      verifyHttps && !entry.local && `https ok ${entry.ok}, failed ${entry.failed}`,
    ].filter(Boolean);
    console.log(`  ${String(entry.links).padStart(5)}  ${host}${notes.length ? `  (${notes.join("; ")})` : ""}`);
  }
};

const main = async () => {
  const documents = await fetchAllDocuments();
  const { findings: allFindings } = scanDocuments(documents, { ownHosts, trailingSlash });
  const findings = allFindings.filter((finding) => selectedRules.includes(finding.rule));
  if (verifyHttps && selectedRules.includes("http")) await verifyHttpsTargets(findings);
  const summary = summarize(findings);
  const draftCount = documents.filter((document) => document._id.startsWith("drafts.")).length;
  const header = {
    dataset,
    rules: selectedRules,
    hosts: [...ownHosts].flatMap((host) => [host, `www.${host}`]),
    trailingSlash,
    trailingSlashSource,
    scannedDocuments: documents.length,
    draftsScanned: draftCount,
    draftsVisible: Boolean(token),
  };
  const headerLine = `dataset=${dataset}, rules=${selectedRules.join(",")}, hosts=${header.hosts.join(", ") || "(none)"}, trailing slash=${trailingSlash} (${trailingSlashSource}), documents=${documents.length} (drafts: ${draftCount})`;

  if (command === "check") {
    if (isJson) {
      console.log(JSON.stringify({ ...header, summary, findings }, null, 2));
      return;
    }
    console.log(`Link check — ${headerLine}`);
    if (!token) console.log("!! No token: drafts are invisible, only published documents were scanned.");
    if (!ownHosts.size) console.log("!! No site domain: own-domain URLs were not checked for slashes.");
    console.log(`\nFindings: ${summary.total} in ${summary.documents} document(s)\n`);
    printTable(summary.table);
    if (selectedRules.includes("own-domain")) {
      printCounts("own-domain by document type", summary.ownDomain.byDocumentType);
      printCounts("own-domain by field kind", summary.ownDomain.byFieldKind);
    }
    printHttpHosts(findings);
    for (const rule of selectedRules)
      for (const row of summary.table.filter((item) => item.rule === rule))
        printList(
          `${rule}: ${row.issue}`,
          findings.filter((finding) => finding.rule === rule && finding.issue === row.issue),
          describe,
        );
    return;
  }

  const { patches, skipped } = planPatches(findings, {
    rules: selectedRules,
    mode,
    includeBroken,
    drafts,
    trailingSlash,
    keepHttp,
    verifyHttps,
  });
  const changes = patches.flatMap((patch) => patch.changes.map((change) => ({ ...change, patch })));
  const results = [];

  if (isApply) {
    for (const patch of patches) {
      try {
        let builder = client.patch(patch.documentId).ifRevisionId(patch.rev).set(patch.set);
        if (patch.unset.length) builder = builder.unset(patch.unset);
        await builder.commit({ autoGenerateArrayKeys: false });
        results.push({ documentId: patch.documentId, ok: true });
      } catch (error) {
        const message = error?.statusCode === 409
          ? "document changed since it was read (re-run)"
          : (error?.message ?? String(error));
        results.push({ documentId: patch.documentId, ok: false, error: message });
      }
    }
  }

  const failed = results.filter((result) => !result.ok);
  const byAction = {};
  for (const change of changes) byAction[change.action] = (byAction[change.action] ?? 0) + 1;
  const okIds = new Set(results.filter((result) => result.ok).map((result) => result.documentId));
  const resolvedCount = patches
    .filter((patch) => !isApply || okIds.has(patch.documentId))
    .reduce((sum, patch) => sum + patch.resolves, 0);
  const expectedRemaining = summary.total - resolvedCount;

  if (isJson) {
    console.log(
      JSON.stringify(
        { ...header, mode, drafts, includeBroken, keepHttp: [...keepHttp], verifyHttps, applied: isApply, summary, byAction, expectedRemaining, patches, skipped, results },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `${isApply ? "APPLY" : "DRY RUN (nothing written; add --apply)"} — ${headerLine}, --to=${mode}, --drafts=${drafts}${includeBroken ? ", --include-broken" : ""}${verifyHttps ? ", --verify-https" : ""}`,
    );
    if (!token) console.log("!! No token: drafts are invisible and were not considered.");
    console.log(
      `\nFound ${summary.total}; ${isApply ? "changing" : "would change"} ${changes.length} value(s) in ${patches.length} document(s): ${
        Object.entries(byAction).map(([action, count]) => `${count} ${action}`).join(", ") || "nothing"
      }. Skipped ${skipped.length}.`,
    );
    printList("Changes", changes, (change) =>
      `${change.patch.documentType} [${change.patch.documentId}] ${change.kind} ${JSON.stringify(change.from)} → ${change.to}`,
    );
    printCounts(
      "Skipped, by reason",
      skipped.reduce((counts, item) => ({ ...counts, [item.reason]: (counts[item.reason] ?? 0) + 1 }), {}),
    );
    printList("Skipped", skipped, (item) => `${describe(item)} — ${item.reason}`);
    if (isApply) {
      console.log(`\nPatched ${results.length - failed.length}/${patches.length} document(s).`);
      printList("Failed", failed, (result) => `${result.documentId}: ${result.error}`);
    }
    console.log(`\nExpected count on the next check (same --rules): ${expectedRemaining}`);
  }

  if (failed.length) process.exitCode = 1;
};

await main();
