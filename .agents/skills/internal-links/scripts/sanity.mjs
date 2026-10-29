// Optional: writing approved links into Sanity drafts, through the HTTP API (a token) or
// through a Sanity MCP server (the agent reads and writes, this module plans). Never published.
import { randomBytes } from "node:crypto";

import { normalizePath } from "./html.mjs";

export const API_VERSION = "2025-02-19";

/** Link annotation shapes. `$id` is the target document's id, `$path` its site path, `$url` its full URL. */
export const LINK_TEMPLATES = {
  // The Nexity starter's `link` annotation (simpleLink): a reference survives slug changes.
  reference: { _type: "link", type: "internal", internal: { _type: "reference", _ref: "$id" } },
  // Sanity's default annotation and most custom ones.
  href: { _type: "link", href: "$path" },
};

export const variantOf = (id) => (id.startsWith("drafts.") ? "draft" : id.startsWith("versions.") ? "version" : "published");
export const baseIdOf = (id) => (id.startsWith("drafts.") ? id.slice(7) : id);
const slugOf = (document) => document.metadata?.slug?.current ?? document.slug?.current ?? null;
const trimSlashes = (value) => String(value ?? "").replace(/^\/+|\/+$/g, "");

/** The slugs a page path may be stored as: the whole path, or its last segment. */
export const slugsFor = (paths) => {
  const slugs = new Set();
  for (const path of paths) {
    const trimmed = trimSlashes(path);
    if (!trimmed) slugs.add("/");
    else {
      slugs.add(trimmed);
      slugs.add(`/${trimmed}`);
      slugs.add(trimmed.split("/").pop());
    }
  }
  return [...slugs];
};

/** One query for the documents behind a set of paths, published and drafts. Run it as is through an MCP server. */
export const documentsQuery = `*[!(_id in path("versions.**")) && coalesce(metadata.slug.current, slug.current) in $slugs]`;

/**
 * Which document serves each path. A whole-path slug wins over a last-segment one; with
 * `routes` ({ "post": "/blog/" }) a type's prefix plus its slug must give the path. Two
 * documents that fit equally are ambiguous and left out: guessing writes into the wrong article.
 */
export const matchDocuments = (paths, documents, routes = null) => {
  const byBase = new Map();
  for (const document of documents) {
    if (variantOf(document._id) === "version") continue;
    const entry = byBase.get(baseIdOf(document._id)) ?? {};
    entry[variantOf(document._id)] = document;
    byBase.set(baseIdOf(document._id), entry);
  }
  const result = new Map();
  for (const path of paths) {
    const wanted = trimSlashes(path);
    const scored = [];
    for (const [id, entry] of byBase) {
      const document = entry.published ?? entry.draft;
      const slug = trimSlashes(slugOf(document));
      let score = 0;
      if (routes && Object.hasOwn(routes, document._type)) score = [trimSlashes(routes[document._type]), slug].filter(Boolean).join("/") === wanted ? 3 : 0;
      else if (slug === wanted) score = 2;
      else if (!routes && slug && slug === wanted.split("/").pop()) score = 1;
      if (score) scored.push({ id, score, ...entry });
    }
    const best = Math.max(0, ...scored.map((item) => item.score));
    const top = scored.filter((item) => item.score === best);
    result.set(normalizePath(path), !top.length ? { error: "no document with this slug" } : top.length > 1 ? { error: `${top.length} documents fit (${top.map((item) => `${item.published?._type ?? item.draft?._type} ${item.id}`).join(", ")}): set sanity.routes` } : top[0]);
  }
  return result;
};

const segmentToString = (segment) => (typeof segment === "number" ? `[${segment}]` : typeof segment === "object" ? `[_key==${JSON.stringify(segment.key)}]` : `.${segment}`);
const toPatchPath = (segments) => segments.map(segmentToString).join("").replace(/^\./, "");
const isBlock = (value) => value && typeof value === "object" && value._type === "block" && Array.isArray(value.children);

const headingLike = (style) => /^(h[1-6]|(alt-)?heading-\d|section-heading.*|blockquote)$/.test(String(style ?? ""));

const readBlock = (block, id) => {
  const markDefs = new Map((block.markDefs ?? []).map((definition) => [definition._key, definition]));
  const linkRanges = [];
  let text = "";
  for (const child of block.children) {
    if (child._type !== "span" || typeof child.text !== "string") continue;
    const start = text.length;
    text += child.text;
    for (const mark of child.marks ?? []) {
      if (!markDefs.has(mark)) continue;
      // One annotation over several spans (bold inside the link) is one link.
      const last = linkRanges[linkRanges.length - 1];
      if (last?.key === mark && last.end === start) last.end = text.length;
      else linkRanges.push({ key: mark, start, end: text.length, definition: markDefs.get(mark) });
    }
  }
  return { id, block, text, linkRanges, excluded: headingLike(block.style) };
};

/** Every Portable Text block of a document, with its patch path (stable while the block keeps its _key). */
export const portableBlocks = (document) => {
  const blocks = [];
  const walk = (value, segments) => {
    if (Array.isArray(value)) {
      value.forEach((item, position) => walk(item, [...segments, item && typeof item === "object" && typeof item._key === "string" ? { key: item._key } : position]));
      return;
    }
    if (!value || typeof value !== "object") return;
    if (isBlock(value)) {
      blocks.push(readBlock(value, toPatchPath(segments)));
      return;
    }
    for (const [key, child] of Object.entries(value)) if (!key.startsWith("_") && typeof child === "object") walk(child, [...segments, key]);
  };
  for (const [key, child] of Object.entries(document)) if (!key.startsWith("_") && typeof child === "object") walk(child, [key]);
  return blocks;
};

/** The annotation shapes a dataset already uses, to pick the template that matches its schema. */
export const linkShapes = (documents) => {
  const shapes = new Map();
  const shapeOf = (value) =>
    Object.entries(value)
      .filter(([key]) => key !== "_key")
      .map(([key, child]) => (child && typeof child === "object" && !Array.isArray(child) ? `${key}{${shapeOf(child)}}` : key))
      .sort()
      .join(",");
  for (const document of documents)
    for (const { block } of portableBlocks(document))
      for (const definition of block.markDefs ?? []) {
        const shape = shapeOf(definition);
        const entry = shapes.get(shape) ?? { shape, count: 0, example: definition };
        entry.count += 1;
        shapes.set(shape, entry);
      }
  const list = [...shapes.values()].sort((a, b) => b.count - a.count);
  const suggested = list.some((entry) => /internal\{.*_ref/.test(entry.shape)) ? "reference" : list.some((entry) => /(^|,)href(,|$)/.test(entry.shape)) ? "href" : null;
  return { shapes: list, suggested };
};

const fill = (value, values) => {
  if (typeof value === "string") return value.replace(/\$(id|path|url)\b/g, (_, name) => values[name] ?? `$${name}`);
  if (Array.isArray(value)) return value.map((item) => fill(item, values));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, fill(child, values)]));
  return value;
};

export const resolveTemplate = (setting) => (typeof setting === "string" ? (LINK_TEMPLATES[setting] ?? JSON.parse(setting)) : setting);

/** The annotation for one link, or null when the template needs a document id the target does not have. */
export const markDefFor = (template, values) => {
  const filled = fill(template, values);
  return /\$(id|path|url)\b/.test(JSON.stringify(filled)) ? null : filled;
};

const collapse = (text) => String(text ?? "").replace(/\s+/g, " ").trim();
const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/**
 * Where the approved anchor sits in a CMS block: the block that holds the approved sentence,
 * then the anchor inside that sentence. Found by text, not by offsets: the page's HTML and the
 * CMS's text can differ in spacing.
 */
export const locate = (blocks, item) => {
  const sentence = collapse(item.sentence?.text ?? item.sentence);
  for (const entry of blocks) {
    if (entry.excluded) continue;
    const text = entry.text;
    const flat = collapse(text);
    const at = flat.indexOf(sentence);
    if (at === -1) continue;
    const occurrences = [];
    for (let index = text.indexOf(item.anchor); index !== -1; index = text.indexOf(item.anchor, index + 1)) occurrences.push(index);
    if (!occurrences.length) continue;
    // The approved anchor's place in the sentence picks among repeated words.
    const guess = rawIndex(text, at) + Math.max(0, (item.start ?? 0) - (item.sentence?.offset ?? 0));
    const start = occurrences.reduce((best, index) => (Math.abs(index - guess) < Math.abs(best - guess) ? index : best), occurrences[0]);
    return { entry, start, end: start + item.anchor.length };
  }
  return null;
};

/** The raw-text index of a position in the whitespace-collapsed text. */
const rawIndex = (text, collapsedIndex) => {
  let seen = 0;
  let previousSpace = true;
  for (let index = 0; index < text.length; index += 1) {
    const space = /\s/.test(text[index]);
    if (space && previousSpace) continue;
    if (seen === collapsedIndex) return index;
    seen += 1;
    previousSpace = space;
  }
  return text.length;
};

const randomKey = () => randomBytes(6).toString("hex");

/** Adds the annotation over [start, end), splitting spans at the edges and keeping their marks. Null when the range is already linked. */
export const addLinkToBlock = (block, { start, end, anchor }, markDef, makeKey = randomKey) => {
  const read = readBlock(block, "");
  if (read.text.slice(start, end) !== anchor) return null;
  if (read.linkRanges.some((link) => overlaps(link, { start, end }))) return null;
  const markKey = makeKey();
  const children = [];
  let offset = 0;
  for (const child of block.children) {
    if (child._type !== "span" || typeof child.text !== "string") {
      children.push(child);
      continue;
    }
    const spanStart = offset;
    const spanEnd = offset + child.text.length;
    offset = spanEnd;
    const cuts = [spanStart, Math.min(Math.max(start, spanStart), spanEnd), Math.min(Math.max(end, spanStart), spanEnd), spanEnd];
    const pieces = [
      [cuts[0], cuts[1], false],
      [cuts[1], cuts[2], true],
      [cuts[2], cuts[3], false],
    ].filter(([from, to]) => to > from);
    if (pieces.length === 1 && !pieces[0][2]) {
      children.push(child);
      continue;
    }
    pieces.forEach(([from, to, linked], position) =>
      children.push({
        ...child,
        _key: position === 0 ? child._key : `${child._key}-${makeKey().slice(0, 6)}`,
        text: child.text.slice(from - spanStart, to - spanStart),
        marks: linked ? [...(child.marks ?? []), markKey] : [...(child.marks ?? [])],
      }),
    );
  }
  return { ...block, children, markDefs: [...(block.markDefs ?? []), { ...markDef, _key: markKey }] };
};

const stripSystem = ({ _rev, _updatedAt, _createdAt, ...rest }) => rest;

/**
 * One transaction per document: the links go into its draft (copied from the published
 * document when there is none), guarded by the draft's revision. The published document is
 * never patched; an editor publishes.
 */
export const planSanity = (items, documents, { template, routes = null, site = "" }, makeKey = randomKey) => {
  const paths = [...new Set(items.flatMap((item) => [item.sourcePath, item.targetPath]))];
  const matches = matchDocuments(paths, documents, routes);
  const plans = new Map();
  const skipped = [];
  for (const item of items) {
    const source = matches.get(normalizePath(item.sourcePath));
    if (source.error) {
      skipped.push({ item, reason: `source ${item.sourcePath}: ${source.error}` });
      continue;
    }
    const target = matches.get(normalizePath(item.targetPath));
    const markDef = markDefFor(template, { id: target?.error ? undefined : target?.id, path: item.targetPath, url: item.targetUrl ?? `${site}${item.targetPath}` });
    if (!markDef) {
      skipped.push({ item, reason: `target ${item.targetPath}: ${target?.error ?? "no document"}; the link template needs its id` });
      continue;
    }
    const draftId = `drafts.${source.id}`;
    const plan = plans.get(draftId) ?? {
      documentId: draftId,
      title: source.published?.metadata?.title ?? source.published?.title ?? source.draft?.title ?? source.id,
      create: source.draft ? null : { ...stripSystem(source.published), _id: draftId },
      rev: source.draft?._rev ?? null,
      working: structuredClone(source.draft ?? source.published),
      blocks: new Map(),
      changes: [],
    };
    const blocks = portableBlocks(plan.working).map((entry) => (plan.blocks.has(entry.id) ? readBlock(plan.blocks.get(entry.id), entry.id) : entry));
    const found = locate(blocks, item);
    if (!found) {
      skipped.push({ item, reason: "the sentence is not in the document's text (the CMS text differs from the live page, or it changed)" });
      continue;
    }
    const next = addLinkToBlock(found.entry.block, { start: found.start, end: found.end, anchor: item.anchor }, markDef, makeKey);
    if (!next) {
      skipped.push({ item, reason: "the anchor is already linked in the CMS" });
      continue;
    }
    plan.blocks.set(found.entry.id, next);
    plan.changes.push({ id: item.id, anchor: item.anchor, sentence: collapse(item.sentence?.text ?? item.sentence), targetPath: item.targetPath, block: found.entry.id });
    plans.set(draftId, plan);
  }
  const transactions = [...plans.values()].map((plan) => ({
    documentId: plan.documentId,
    title: plan.title,
    create: Boolean(plan.create),
    changes: plan.changes,
    mutations: [...(plan.create ? [{ createIfNotExists: plan.create }] : []), { patch: { id: plan.documentId, ...(plan.rev ? { ifRevisionID: plan.rev } : {}), set: Object.fromEntries(plan.blocks) } }],
  }));
  return { transactions, skipped };
};

/** After a write: is each planned link in the stored draft, over its anchor? */
export const verifySanity = (transaction, stored) => {
  const blocks = stored ? portableBlocks(stored) : [];
  return transaction.changes.map((change) => {
    const entry = blocks.find((item) => item.id === change.block);
    const present = Boolean(entry?.linkRanges.some((range) => entry.text.slice(range.start, range.end).includes(change.anchor)));
    return { ...change, present };
  });
};

/** For each approved link: is it in the source's draft, over its anchor, in the approved sentence? */
export const verifyItems = (items, documents, routes = null) => {
  const matches = matchDocuments([...new Set(items.map((item) => item.sourcePath))], documents, routes);
  return items.map((item) => {
    const source = matches.get(normalizePath(item.sourcePath));
    if (source.error) return { item, state: "no-document", note: source.error };
    if (!source.draft) return { item, state: "no-draft", note: source.published ? "no open draft (published since, or never written)" : "" };
    const sentence = collapse(item.sentence?.text ?? item.sentence);
    const entry = portableBlocks(source.draft).find((block) => !block.excluded && collapse(block.text).includes(sentence));
    if (!entry) return { item, state: "changed", note: "the sentence is not in the draft" };
    const linked = entry.linkRanges.some((range) => entry.text.slice(range.start, range.end).includes(item.anchor));
    return { item, state: linked ? "present" : "missing", note: "" };
  });
};

/** The HTTP API, with nothing but fetch. Reads see drafts (`raw`) and skip the CDN. */
export const sanityClient = ({ projectId, dataset, token }) => {
  const base = `https://${projectId}.api.sanity.io/v${API_VERSION}/data`;
  const call = async (url, body) => {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Sanity ${response.status}: ${payload.error?.description ?? payload.message ?? payload.error ?? "request failed"}`);
    return payload;
  };
  return {
    query: async (query, params = {}) => (await call(`${base}/query/${dataset}?perspective=raw`, { query, params })).result,
    mutate: (mutations) => call(`${base}/mutate/${dataset}?returnIds=true&visibility=sync`, { mutations }),
  };
};
