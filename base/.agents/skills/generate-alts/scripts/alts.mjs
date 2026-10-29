// oxlint-disable no-console
// Run from the starter's web/ folder: it resolves @sanity/client and dotenv from there.

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  batchPayload,
  buildManifest,
  fallbackWarnings,
  makeBatches,
  mergeProposals,
  pendingUsages,
  planApply,
  previewUrl,
  selectUsages,
  statusOf,
} from "./lib.mjs";
import { buildReport } from "./report.mjs";

const HELP = `Usage (from the project's web/ folder):
  node <skill>/scripts/alts.mjs <command> [options]

Commands
  scan                 Read every image usage and its context into <dir>/manifest.json
  fetch                Download one preview per asset into <dir>/images/ (cached assets are skipped)
  batches              Split usages without a cached proposal into <dir>/batches/batch-NN.json
  report               Merge <dir>/proposals/*.json into <dir>/cache.json, write <dir>/report.html
  apply --file=<json>  Write approved alts. Dry run unless --apply

Options
  --dir=<path>          Working folder (default: ../.alts, the project root)
  --dataset=<name>      Overrides NEXT_PUBLIC_SANITY_DATASET (scan)
  --studio=<url>        Studio base URL for links (default: NEXT_PUBLIC_BASE_URL/admin or http://localhost:3000/admin)
  --lang=<code>         Content language (default: <html lang> of src/app/(frontend)/layout.tsx)
  --include-existing    fetch/batches: also images that already have an alt (to review them)
  --size=<n>            batches: assets per batch (default 12)
  --width=<px>          fetch: preview width (default 640)
  --embed               report: inline the previews as data URIs (one portable file)
  --apply               apply: write (default is a dry run)
  --live                apply: patch the published document and its draft instead of the draft only
  --json                scan/apply: print JSON instead of text
  --help                This text

Env (web/.env.local, web/.env): NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
SANITY_API_READ_TOKEN (drafts are invisible without a token), SANITY_API_WRITE_TOKEN for --apply.`;

const PAGE_SIZE = 500;
const ASSET_CHUNK = 200;
const FETCH_CONCURRENCY = 6;
const LIST_LIMIT = 100;

const readArgument = (name) => {
  const found = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
};
const hasFlag = (name) => process.argv.includes(`--${name}`);

const command = process.argv[2];
if (!command || hasFlag("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(command ? 0 : 1);
}
if (!["scan", "fetch", "batches", "report", "apply"].includes(command)) {
  console.error(`Unknown command "${command}".\n\n${HELP}`);
  process.exit(1);
}

const webDir = process.cwd();
const dir = path.resolve(webDir, readArgument("dir") ?? "../.alts");
const files = {
  manifest: path.join(dir, "manifest.json"),
  cache: path.join(dir, "cache.json"),
  images: path.join(dir, "images"),
  batches: path.join(dir, "batches"),
  proposals: path.join(dir, "proposals"),
  merged: path.join(dir, "proposals", "merged"),
  report: path.join(dir, "report.html"),
};
const isJson = hasFlag("json");
const display = (file) => {
  const relative = path.relative(path.dirname(webDir), file);
  return relative.startsWith("..") ? file : relative;
};
const includeExisting = hasFlag("include-existing");

const readJson = async (file, fallback) => {
  if (!existsSync(file)) return fallback;
  return JSON.parse(await readFile(file, "utf8"));
};
const writeJson = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};
const requireManifest = async () => {
  const manifest = await readJson(files.manifest, null);
  if (!manifest) {
    console.error(`No ${display(files.manifest)}. Run "scan" first.`);
    process.exit(1);
  }
  return manifest;
};
const readCache = () => readJson(files.cache, { assets: {}, usages: {} });

const imageFileOf = (cache, assetId) => {
  const file = cache.assets?.[assetId]?.file;
  return file && existsSync(path.join(dir, file)) ? path.join(dir, file) : null;
};

const sanityClient = async ({ write = false } = {}) => {
  const requireFromWeb = createRequire(path.join(webDir, "package.json"));
  const importFromWeb = async (specifier) => {
    try {
      return await import(pathToFileURL(requireFromWeb.resolve(specifier)).href);
    } catch {
      console.error(`Cannot load ${specifier} from ${webDir}. Run this from the starter's web/ folder after pnpm install.`);
      process.exit(1);
    }
  };
  const { config: loadEnv } = await importFromWeb("dotenv");
  loadEnv({ path: [path.join(webDir, ".env.local"), path.join(webDir, ".env")], quiet: true });
  const { createClient } = await importFromWeb("@sanity/client");

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = readArgument("dataset") ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
  const token = write ? writeToken : writeToken || process.env.SANITY_API_READ_TOKEN;

  if (!projectId || !dataset) {
    console.error("Missing env. Need NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in web/.env.local or web/.env (or --dataset=).");
    process.exit(1);
  }
  if (write && !writeToken) {
    console.error("--apply needs SANITY_API_WRITE_TOKEN (an Editor token) in web/.env.local or the shell. Nothing was written.");
    process.exit(1);
  }

  // raw = published + drafts + release versions; useCdn false = no stale reads.
  const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false, perspective: "raw" });
  return { client, projectId, dataset, hasToken: Boolean(token) };
};

const detectLang = async () => {
  const explicit = readArgument("lang");
  if (explicit) return explicit;
  const layout = path.join(webDir, "src", "app", "(frontend)", "layout.tsx");
  if (!existsSync(layout)) return null;
  return (await readFile(layout, "utf8")).match(/<html[^>]*\blang="([^"]+)"/)?.[1] ?? null;
};

const printList = (heading, items, format) => {
  if (!items.length) return;
  console.log(`\n## ${heading} (${items.length})`);
  for (const item of items.slice(0, LIST_LIMIT)) console.log(`- ${format(item)}`);
  if (items.length > LIST_LIMIT) console.log(`  … and ${items.length - LIST_LIMIT} more (see the JSON files)`);
};

const scan = async () => {
  const { client, projectId, dataset, hasToken } = await sanityClient();
  const documents = [];
  for (let lastId = ""; ; ) {
    const page = await client.fetch(
      `*[!(_type match "sanity.*") && !(_id in path("_.**")) && _id > $lastId] | order(_id) [0...${PAGE_SIZE}]`,
      { lastId },
    );
    documents.push(...page);
    if (page.length < PAGE_SIZE) break;
    lastId = page[page.length - 1]._id;
  }

  const assetIds = [
    ...new Set(JSON.stringify(documents).match(/image-[a-f0-9]{40}-\d+x\d+-[a-z0-9]+/g) ?? []),
  ];
  const assets = {};
  for (let start = 0; start < assetIds.length; start += ASSET_CHUNK) {
    const chunk = await client.fetch(
      `*[_type == "sanity.imageAsset" && _id in $ids]{
        _id, url, mimeType, title, description, altText, creditLine, originalFilename,
        "width": metadata.dimensions.width, "height": metadata.dimensions.height, "hasAlpha": metadata.hasAlpha
      }`,
      { ids: assetIds.slice(start, start + ASSET_CHUNK) },
    );
    for (const asset of chunk) assets[asset._id] = asset;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  const manifest = buildManifest({
    documents,
    assets,
    cache: await readCache(),
    dataset,
    projectId,
    studioUrl: readArgument("studio") ?? `${baseUrl || "http://localhost:3000"}/admin`,
    lang: await detectLang(),
    generatedAt: new Date().toISOString(),
  });
  manifest.draftsVisible = hasToken;
  await writeJson(files.manifest, manifest);

  if (isJson) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }
  const { counts } = manifest;
  console.log(`Alt scan — dataset=${dataset}, documents=${documents.length}, lang=${manifest.lang ?? "unknown (pass --lang=)"}`);
  if (!hasToken) console.log("!! No token: drafts are invisible, only published documents were scanned.");
  console.log(`\nImages: ${counts.usages} usages of ${counts.assets} assets in ${counts.documents} documents`);
  console.log(`  ${String(counts.missing).padStart(5)}  missing alt`);
  console.log(`  ${String(counts.hasAlt).padStart(5)}  have an alt`);
  console.log(`  ${String(counts.decorative).padStart(5)}  decorative (empty on purpose)`);
  console.log(`  ${String(counts.notWritable).padStart(5)}  in fields without an alt (reported, never written)`);
  if (counts.versionsSkipped) console.log(`  ${String(counts.versionsSkipped).padStart(5)}  release versions skipped (edit them in the release)`);
  const byType = {};
  for (const usage of manifest.usages.filter((item) => item.status === "missing"))
    byType[usage.documentType] = (byType[usage.documentType] ?? 0) + 1;
  printList("Missing alt by document type", Object.entries(byType).sort((a, b) => b[1] - a[1]), ([type, count]) => `${type}: ${count}`);
  console.log(`\nManifest: ${display(files.manifest)}`);
};

const download = async (url, file) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
};

const fetchImages = async () => {
  const manifest = await requireManifest();
  const cache = await readCache();
  const width = Number(readArgument("width") ?? 640);
  const assetIds = [...new Set(selectUsages(manifest, { includeExisting }).map((usage) => usage.assetId))];
  const todo = assetIds.filter((assetId) => !imageFileOf(cache, assetId));
  const failed = [];
  await mkdir(files.images, { recursive: true });

  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const assetId = todo[next++];
      const preview = previewUrl(manifest.assets[assetId], width);
      if (!preview) {
        failed.push({ assetId, error: "asset has no URL (deleted or not readable)" });
        continue;
      }
      const name = `${assetId}.${preview.ext}`;
      try {
        await download(preview.url, path.join(files.images, name));
        cache.assets[assetId] = { ...cache.assets[assetId], file: `images/${name}`, fetchedAt: new Date().toISOString() };
      } catch (error) {
        failed.push({ assetId, error: error.message });
      }
    }
  };
  await Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker));
  await writeJson(files.cache, cache);

  console.log(`Previews: ${assetIds.length} assets needed, ${assetIds.length - todo.length} already cached, ${todo.length - failed.length} downloaded, ${failed.length} failed.`);
  printList("Failed", failed, (item) => `${item.assetId}: ${item.error}`);
  console.log(`Folder: ${display(files.images)}`);
  if (failed.length) process.exitCode = 1;
};

const writeBatches = async () => {
  const manifest = await requireManifest();
  const cache = await readCache();
  const size = Math.max(1, Number(readArgument("size") ?? 12));
  const pending = pendingUsages(manifest, cache, { includeExisting });
  const ready = pending.filter((usage) => imageFileOf(cache, usage.assetId));
  const notFetched = new Set(pending.filter((usage) => !imageFileOf(cache, usage.assetId)).map((usage) => usage.assetId));

  await rm(files.batches, { recursive: true, force: true });
  await mkdir(files.batches, { recursive: true });
  await mkdir(files.proposals, { recursive: true });
  const batches = makeBatches(ready, size);
  const written = [];
  for (const [index, batch] of batches.entries()) {
    const name = `batch-${String(index + 1).padStart(2, "0")}`;
    const file = path.join(files.batches, `${name}.json`);
    await writeJson(
      file,
      batchPayload({
        manifest,
        cache,
        batch,
        name,
        imageFile: (assetId) => imageFileOf(cache, assetId),
        proposalsFile: path.join(files.proposals, `${name}.json`),
      }),
    );
    written.push({ file, assets: batch.assetIds.length, usages: batch.usages.length });
  }

  console.log(`Pending: ${pending.length} usages without a cached proposal; ${ready.length} in ${batches.length} batches.`);
  if (notFetched.size) console.log(`!! ${notFetched.size} assets have no preview yet: run "fetch" first.`);
  printList("Batches", written, (item) => `${display(item.file)} (${item.assets} images, ${item.usages} usages)`);
};

const writeReport = async () => {
  const manifest = await requireManifest();
  let cache = await readCache();
  await mkdir(files.proposals, { recursive: true });
  const proposalFiles = (await readdir(files.proposals)).filter((name) => name.endsWith(".json")).sort();
  const proposals = [];
  for (const name of proposalFiles) {
    try {
      proposals.push({ file: name, data: JSON.parse(await readFile(path.join(files.proposals, name), "utf8")) });
    } catch (error) {
      console.error(`!! ${name}: not valid JSON (${error.message}); left in place.`);
    }
  }
  const result = mergeProposals({ cache, manifest, proposals, now: new Date().toISOString() });
  cache = result.cache;
  await writeJson(files.cache, cache);
  await mkdir(files.merged, { recursive: true });
  for (const { file } of proposals) await rename(path.join(files.proposals, file), path.join(files.merged, file));

  for (const usage of manifest.usages) usage.status = statusOf(usage, cache);

  const embed = hasFlag("embed");
  const embedded = {};
  if (embed) {
    for (const assetId of Object.keys(manifest.assets)) {
      const file = imageFileOf(cache, assetId);
      if (!file) continue;
      const ext = path.extname(file).slice(1);
      const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : "image/jpeg";
      embedded[assetId] = `data:${mime};base64,${(await readFile(file)).toString("base64")}`;
    }
  }
  const html = buildReport(manifest, cache, {
    imageSrc: (assetId) =>
      embed ? (embedded[assetId] ?? null) : imageFileOf(cache, assetId) ? cache.assets[assetId].file : null,
  });
  await writeFile(files.report, html);

  const withProposal = manifest.usages.filter((usage) => {
    const entry = cache.usages[usage.key];
    return entry && entry.assetId === usage.assetId && entry.contextHash === usage.contextHash;
  }).length;
  console.log(`Merged ${result.merged} proposals from ${proposals.length} files; ${withProposal} of ${manifest.usages.length} usages have one.`);
  printList("Warnings", result.warnings, (warning) => warning);
  console.log(`Report: ${display(files.report)}`);
};

const apply = async () => {
  const file = readArgument("file");
  if (!file) {
    console.error("apply needs --file=<approved.json> (exported from the report).");
    process.exit(1);
  }
  const approved = JSON.parse(await readFile(path.resolve(webDir, file), "utf8"));
  const items = approved.items ?? [];
  const isApply = hasFlag("apply");
  const live = hasFlag("live");
  const { client, dataset, hasToken } = await sanityClient({ write: isApply });
  if (!hasToken) console.error("!! No token: drafts are invisible, so the dry run plans new drafts where some may exist.");
  if (approved.dataset && approved.dataset !== dataset) {
    console.error(`The file is for dataset "${approved.dataset}", the env points at "${dataset}". Pass --dataset=${approved.dataset}.`);
    process.exit(1);
  }

  const ids = [...new Set(items.flatMap((item) => [item.documentId, `drafts.${item.documentId}`]))];
  const documents = ids.length ? await client.fetch(`*[_id in $ids]`, { ids }) : [];
  const { transactions, skipped } = planApply(items, documents, { live });
  const manifest = await readJson(files.manifest, { assets: {} });
  const warnings = fallbackWarnings(items, manifest.assets ?? {});
  const results = [];

  if (isApply) {
    for (const transaction of transactions) {
      try {
        await client.mutate(transaction.mutations, { autoGenerateArrayKeys: false });
        results.push({ documentId: transaction.documentId, ok: true });
      } catch (error) {
        const message = error?.statusCode === 409 ? "document changed since it was read (re-run)" : (error?.message ?? String(error));
        results.push({ documentId: transaction.documentId, ok: false, error: message });
      }
    }
    const cache = await readCache();
    const done = new Set(results.filter((result) => result.ok).map((result) => result.documentId));
    for (const transaction of transactions.filter((item) => done.has(item.documentId)))
      for (const change of transaction.changes)
        if (cache.usages[change.key]) cache.usages[change.key].appliedAt = new Date().toISOString();
    await writeJson(files.cache, cache);
  }

  const failed = results.filter((result) => !result.ok);
  const changeCount = transactions.reduce((sum, transaction) => sum + transaction.changes.length, 0);
  if (isJson) {
    console.log(JSON.stringify({ dataset, applied: isApply, live, transactions, skipped, warnings, results }, null, 2));
  } else {
    console.log(`${isApply ? "APPLY" : "DRY RUN (nothing written; add --apply)"} — dataset=${dataset}, target=${live ? "published + open drafts" : "drafts"}`);
    console.log(`\n${items.length} approved; ${isApply ? "writing" : "would write"} ${changeCount} alts in ${transactions.length} documents. Skipped ${skipped.length}.`);
    printList(
      "Changes",
      transactions.flatMap((transaction) => transaction.changes.map((change) => ({ ...change, transaction }))),
      (change) =>
        `${change.transaction.documentType} [${change.transaction.documentId}]${change.transaction.create ? " (new draft)" : ""} ${change.where}: "${change.from}" → ${change.decorative ? "(decorative, empty)" : `"${change.to}"`}`,
    );
    printList("Skipped", skipped, (item) => `${item.item.key}${item.variant ? ` (${item.variant})` : ""}: ${item.reason}`);
    printList("Warnings", warnings, (warning) => warning);
    if (isApply) {
      console.log(`\nWrote ${results.length - failed.length}/${transactions.length} documents.`);
      printList("Failed", failed, (result) => `${result.documentId}: ${result.error}`);
    }
  }
  if (failed.length) process.exitCode = 1;
};

await { scan, fetch: fetchImages, batches: writeBatches, report: writeReport, apply }[command]();
