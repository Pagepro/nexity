import { createHash } from "node:crypto";

import { normalizePath, ownPath } from "./html.mjs";

export const DEFAULT_RULES = { maxNewLinksPerArticle: 8, phrases: [], excludeTargets: [] };

export const hashText = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

/** Words; letters and digits in any script, so the matching works beyond English. */
const WORD = /[\p{L}\p{N}]+(?:['’.+#-][\p{L}\p{N}]+)*/gu;

export const words = (text) => (String(text ?? "").toLowerCase().match(WORD) ?? []);

export const normalizePhrase = (text) => words(text).join(" ");

const LEAD =
  /^(what is|what are|how to|how do you|how does|how|why use|why|when to use|when|the|a|an|guide to|introduction to|intro to|top \d+|\d+ best|\d+|best|top|ultimate|complete|our|your)\s+/;
const DATED = /\s+(in|for)\s+(19|20)\d\d$|\s+(19|20)\d\d$/;
const FORMAT_TAIL = /\s+(guide|tutorial|explained|checklist|cheat sheet|examples|tips|faq|overview|comparison|report)$/;
const AUDIENCE_TAIL = /\s+for\s+.*$/;
const GENERIC = new Set(
  "a an the and or of for in on to with without by from at as into about your you our we it its is are be can do does should will which that this how what why when where who vs versus best top new more most better good great simple easy quick complete ultimate guide tips ways reasons examples example step steps everything things need know use using choose make get one all home page blog".split(
    " ",
  ),
);
const JOINERS = new Set("and or of for in on to with without by from at as into vs versus the a an".split(" "));
const MIN_NAME_WORDS = 2;
const MAX_NAME_WORDS = 6;

const cleanName = (segment) => {
  let phrase = normalizePhrase(segment);
  for (let previous = ""; previous !== phrase; ) {
    previous = phrase;
    phrase = phrase.replace(LEAD, "").replace(DATED, "").replace(FORMAT_TAIL, "").trim();
  }
  return phrase;
};

const isName = (phrase) => {
  const list = phrase.split(" ").filter(Boolean);
  if (list.length < MIN_NAME_WORDS || list.length > MAX_NAME_WORDS) return false;
  if (JOINERS.has(list[0]) || JOINERS.has(list[list.length - 1])) return false;
  return list.some((word) => !GENERIC.has(word) && !/^\d+$/.test(word));
};

/**
 * The names a page goes by, from its title, SEO title and slug: "What is a headless CMS? A
 * guide | Acme" yields "headless cms". Generic furniture (what is, guide, a year) is stripped;
 * a name needs two words, so a head term half the site could claim is never a page name.
 */
export const pageNames = (entry, brand = "") => {
  const names = new Map();
  const add = (phrase, source) => {
    if (!isName(phrase) || phrase === brand) return;
    if (!names.has(phrase)) names.set(phrase, source);
  };
  for (const [source, title] of [
    ["title", entry.title],
    ["SEO title", entry.seoTitle],
  ]) {
    if (!title) continue;
    const segments = String(title)
      .split(/\s+[|–—-]\s+|[:?!()|]/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    segments.forEach((segment, position) => {
      const phrase = cleanName(segment);
      add(phrase, source);
      if (position === 0) {
        const shorter = phrase.replace(AUDIENCE_TAIL, "").trim();
        if (shorter !== phrase && shorter.split(" ").length >= 3) add(shorter, `${source} (shortened)`);
      }
    });
  }
  const slug = entry.path?.split("/").filter(Boolean).pop();
  if (slug) add(cleanName(slug.replace(/[-_]+/g, " ")), "slug");
  return [...names].map(([phrase, source]) => ({ phrase, source }));
};

/** Phrase occurrences in `text`, case-insensitive, on word boundaries. */
export const findOccurrences = (text, phrase) => {
  const target = phrase.split(" ").filter(Boolean);
  if (!target.length) return [];
  const tokens = [...String(text).matchAll(WORD)].map((match) => ({
    word: match[0].toLowerCase(),
    start: match.index,
    end: match.index + match[0].length,
  }));
  const found = [];
  for (let index = 0; index + target.length <= tokens.length; index += 1) {
    if (target.every((word, offset) => tokens[index + offset].word === word))
      found.push({ start: tokens[index].start, end: tokens[index + target.length - 1].end });
  }
  return found;
};

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

export const sentenceAround = (text, start, end) => {
  const before = text.slice(0, start);
  const sentenceStart = Math.max(before.lastIndexOf(". "), before.lastIndexOf("! "), before.lastIndexOf("? ")) + 1;
  const after = text.slice(end).search(/[.!?](\s|$)/);
  const sentenceEnd = after === -1 ? text.length : end + after + 1;
  const raw = text.slice(sentenceStart, sentenceEnd);
  return { text: raw.trim(), offset: sentenceStart + raw.length - raw.trimStart().length };
};

/** Blocks a link may go in: no headings, quotes, code, tables or captions-only images. */
const LINKABLE = new Set(["paragraph", "item"]);

/** A page's blocks as the task shows them: an id per block, its text and the ranges already linked. */
export const taskBlocks = (page) =>
  page.blocks.map((block, index) => ({
    id: `b${index + 1}`,
    kind: block.kind,
    ...(block.level ? { level: block.level } : {}),
    excluded: !LINKABLE.has(block.kind) || block.quote,
    text: block.text,
    textHash: hashText(block.text),
    linkRanges: block.links.map(({ start, end, href }) => ({ start, end, href })),
  }));

/**
 * The linkable pages of a crawl, keyed by path. A page whose canonical points elsewhere is a
 * duplicate and left out; noindex pages are kept (they can be linked) but never shortlisted.
 */
export const buildCatalogue = (pages, { brand = "", ownHosts = new Set() } = {}) => {
  const entries = new Map();
  for (const page of pages) {
    if (!page.ok) continue;
    const path = ownPath(page.url, ownHosts);
    if (!path) continue;
    const canonical = page.canonical ? ownPath(page.canonical, ownHosts) : path;
    if (canonical && canonical !== path) continue;
    if (entries.has(path)) continue;
    const text = page.blocks.map((block) => block.text).join("\n");
    entries.set(path, {
      id: path,
      type: path === "/" ? "home" : path.split("/").filter(Boolean).length > 1 ? path.split("/")[1] : "page",
      path,
      url: page.url,
      title: page.title || null,
      seoTitle: page.seoTitle || null,
      description: page.description || null,
      noIndex: Boolean(page.noIndex),
      headings: page.blocks.filter((block) => block.kind === "heading" && [2, 3].includes(block.level)).map((block) => block.text).slice(0, 20),
      words: words(text).length,
      lastmod: page.lastmod ?? page.modifiedAt ?? null,
    });
  }
  const list = [...entries.values()];
  const nameOwners = new Map();
  for (const entry of list) {
    entry.names = pageNames(entry, brand);
    for (const { phrase } of entry.names) nameOwners.set(phrase, [...(nameOwners.get(phrase) ?? []), entry.id]);
  }
  // A name two pages share is a topic, not a name: it is left to the agent's judgement.
  for (const entry of list) entry.names = entry.names.filter(({ phrase }) => nameOwners.get(phrase).length === 1);
  return list.sort((a, b) => a.path.localeCompare(b.path));
};

/** Catalogue pages an article's content already links to (paths and own-domain URLs). */
export const existingLinks = (blocks, catalogue, ownHosts) => {
  const ids = new Set(catalogue.map((entry) => entry.id));
  const found = [];
  for (const block of blocks)
    for (const link of block.linkRanges) {
      const path = ownPath(link.href, ownHosts);
      if (path && ids.has(path)) found.push(path);
    }
  return found;
};

/** A page whose content is mostly link text (a blog index, a tag page) links to its items in code, not by an editor. */
export const isListing = (page) => {
  const total = page.blocks.reduce((sum, block) => sum + block.text.length, 0);
  const linked = page.blocks.reduce((sum, block) => sum + block.links.reduce((inner, link) => inner + link.end - link.start, 0), 0);
  return total > 0 && linked / total > 0.5;
};

/** How many content links from other pages each page has. Navigation, sidebars and footers do not count. */
export const inboundCounts = (pages, catalogue, ownHosts) => {
  const counts = new Map(catalogue.map((entry) => [entry.id, 0]));
  for (const page of pages) {
    if (!page.ok || isListing(page)) continue;
    const self = ownPath(page.url, ownHosts);
    for (const target of new Set(existingLinks(taskBlocks(page), catalogue, ownHosts)))
      if (target !== self) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return counts;
};

/** The article's budget: targets and anchors already spent, and the clusters they belong to. */
export const seedLedger = (blocks, catalogue, rules, ownHosts) => {
  const targets = new Set(existingLinks(blocks, catalogue, ownHosts));
  const anchors = new Set();
  for (const block of blocks)
    for (const range of block.linkRanges) anchors.add(normalizePhrase(block.text.slice(range.start, range.end)));
  const clusters = new Set([...targets].map((target) => clusterOf(target, rules)));
  return { targets, anchors, clusters, existing: targets.size };
};

export const clusterOf = (targetId, rules) =>
  rules.phrases.find((rule) => rule.target === targetId && rule.cluster)?.cluster ?? targetId;

const resolveRuleTarget = (target, catalogue) => {
  const path = /^https?:\/\//.test(target ?? "") ? normalizePath(new URL(target).pathname) : normalizePath(target);
  return catalogue.find((entry) => entry.id === path) ?? null;
};

/** Rules whose target is missing from the catalogue: they silently produce nothing. */
export const deadRuleTargets = (rules, catalogue) =>
  rules.phrases.filter((rule) => !resolveRuleTarget(rule.target, catalogue)).map((rule) => rule.target);

export const normalizeRules = (raw, catalogue) => {
  const rules = { ...DEFAULT_RULES, ...(raw ?? {}) };
  rules.phrases = (rules.phrases ?? [])
    .map((rule) => {
      const entry = resolveRuleTarget(rule.target, catalogue);
      return entry
        ? { ...rule, target: entry.id, phrases: (rule.phrases ?? [rule.phrase]).filter(Boolean).map(normalizePhrase) }
        : null;
    })
    .filter(Boolean);
  rules.excludeTargets = (rules.excludeTargets ?? []).map((target) => resolveRuleTarget(target, catalogue)?.id ?? target);
  return rules;
};

/**
 * Deterministic candidates: config phrases first, then pages the article names by their own
 * names. Longest anchor first; a span is taken once; one candidate per target; nothing the
 * ledger already spent.
 */
export const buildCandidates = (source, blocks, catalogue, rules, ledger) => {
  const byId = new Map(catalogue.map((entry) => [entry.id, entry]));
  const excluded = new Set(rules.excludeTargets);
  const raw = [];
  for (const rule of rules.phrases)
    for (const phrase of rule.phrases) raw.push({ phrase, target: rule.target, rule: `rule: ${rule.cluster ?? phrase}`, tier: 1 });
  for (const entry of catalogue)
    for (const name of entry.names) raw.push({ phrase: name.phrase, target: entry.id, rule: `page name (${name.source})`, tier: 2 });

  const found = [];
  for (const item of raw) {
    if (item.target === source.id || excluded.has(item.target) || !byId.has(item.target)) continue;
    for (const block of blocks) {
      if (block.excluded) continue;
      for (const range of findOccurrences(block.text, item.phrase)) {
        if (block.linkRanges.some((link) => overlaps(link, range))) continue;
        found.push({ ...item, block, ...range, words: item.phrase.split(" ").length });
      }
    }
  }
  found.sort((a, b) => b.words - a.words || a.tier - b.tier || blocks.indexOf(a.block) - blocks.indexOf(b.block) || a.start - b.start);

  const taken = [];
  const targets = new Set();
  const governed = new Set(rules.phrases.flatMap((rule) => rule.phrases));
  const candidates = [];
  for (const item of found) {
    if (item.tier === 2 && governed.has(item.phrase)) continue;
    if (targets.has(item.target) || ledger.targets.has(item.target)) continue;
    if (ledger.anchors.has(item.phrase) || ledger.clusters.has(clusterOf(item.target, rules))) continue;
    if (taken.some((range) => range.block === item.block.id && overlaps(range, item))) continue;
    taken.push({ block: item.block.id, start: item.start, end: item.end });
    targets.add(item.target);
    const entry = byId.get(item.target);
    candidates.push({
      id: `c${candidates.length + 1}`,
      block: item.block.id,
      start: item.start,
      end: item.end,
      anchor: item.block.text.slice(item.start, item.end),
      sentence: sentenceAround(item.block.text, item.start, item.end).text,
      target: entry.id,
      targetPath: entry.path,
      targetTitle: entry.title,
      rule: item.rule,
    });
  }
  return candidates;
};

/** Pages worth considering for the agent's own proposals, by rare-word overlap with the article. */
export const shortlist = (source, articleText, catalogue, ledger, { size = 25, exclude = [] } = {}) => {
  const documentFrequency = new Map();
  const profiles = catalogue.map((entry) => {
    const profile = new Set(words([entry.title, entry.seoTitle, entry.description, ...entry.headings, entry.path.replace(/[/-]+/g, " ")].join(" ")));
    for (const word of profile) documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    return { entry, profile };
  });
  const article = new Set(words(articleText).filter((word) => word.length > 2 && !GENERIC.has(word)));
  const skip = new Set([source.id, ...ledger.targets, ...exclude]);
  return profiles
    .filter(({ entry }) => !skip.has(entry.id) && !entry.noIndex)
    .map(({ entry, profile }) => {
      let score = 0;
      for (const word of profile) if (article.has(word)) score += Math.log(1 + catalogue.length / documentFrequency.get(word));
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path))
    .slice(0, size)
    .map(({ entry, score }) => ({
      id: entry.id,
      type: entry.type,
      path: entry.path,
      title: entry.title,
      description: entry.description,
      headings: entry.headings.slice(0, 8),
      score: Math.round(score * 10) / 10,
    }));
};

/**
 * Turns an agent's answer into proposals and checks every one. Selected candidates keep the
 * script's offsets; the agent's own proposals must quote the block text exactly at theirs.
 */
export const validateAnswer = (task, answer, rules) => {
  const blocks = new Map(task.blocks.map((block) => [block.id, block]));
  const allowedTargets = new Map([...task.shortlist, ...task.candidates.map((candidate) => ({ id: candidate.target, path: candidate.targetPath, title: candidate.targetTitle }))].map((entry) => [entry.id, entry]));
  const ledger = {
    targets: new Set(task.ledger.targets),
    anchors: new Set(task.ledger.anchors),
    clusters: new Set(task.ledger.clusters),
  };
  const accepted = [];
  const rejected = [];
  const declined = [];

  const proposals = [];
  for (const choice of answer.select ?? []) {
    const candidate = task.candidates.find((item) => item.id === choice.candidate);
    if (!candidate) {
      rejected.push({ proposal: choice, reason: `unknown candidate ${choice.candidate}` });
      continue;
    }
    if (!choice.accept) {
      declined.push({ ...candidate, reason: choice.reason ?? "" });
      continue;
    }
    proposals.push({ ...candidate, kind: "candidate", reason: choice.reason ?? candidate.rule });
  }
  for (const proposal of answer.proposals ?? []) proposals.push({ ...proposal, kind: "proposal" });

  for (const proposal of proposals) {
    const block = blocks.get(proposal.block);
    const target = allowedTargets.get(proposal.target);
    const start = Number(proposal.start);
    const end = Number(proposal.end);
    const anchor = block?.text.slice(start, end);
    const phrase = normalizePhrase(proposal.anchor);
    const cluster = clusterOf(proposal.target, rules);
    const reason = !block
      ? `block ${proposal.block} is not in the task`
      : block.excluded
        ? `block is a ${block.quote ? "quote" : block.kind}: only paragraphs and list items are linked`
        : !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > block.text.length
          ? "offsets out of range"
          : anchor !== proposal.anchor
            ? `anchor does not match the text at ${start}-${end} (the text there is "${anchor}")`
            : !/^[\p{L}\p{N}]/u.test(anchor) || !/[\p{L}\p{N}]$/u.test(anchor)
              ? "anchor starts or ends on a space or punctuation"
              : !target
                ? `target ${proposal.target} is not on the shortlist or a candidate`
                : proposal.target === task.source.id
                  ? "links to itself"
                  : block.linkRanges.some((link) => overlaps(link, { start, end }))
                    ? "overlaps an existing link"
                    : accepted.some((item) => item.block === block.id && overlaps(item, { start, end }))
                      ? "overlaps another proposal"
                      : ledger.targets.has(proposal.target)
                        ? "the article already links to this page"
                        : ledger.anchors.has(phrase)
                          ? "this anchor text is already used for a link in the article"
                          : ledger.clusters.has(cluster)
                            ? `cluster ${cluster} is already linked in the article`
                            : accepted.length >= rules.maxNewLinksPerArticle
                              ? `over the limit of ${rules.maxNewLinksPerArticle} new links per article`
                              : null;
    if (reason) {
      rejected.push({ proposal, reason });
      continue;
    }
    ledger.targets.add(proposal.target);
    ledger.anchors.add(phrase);
    ledger.clusters.add(cluster);
    accepted.push({
      id: `${task.source.id}:${block.id}:${start}`,
      sourceId: task.source.id,
      sourceTitle: task.source.title,
      sourcePath: task.source.path,
      block: block.id,
      textHash: block.textHash,
      start,
      end,
      anchor,
      sentence: sentenceAround(block.text, start, end),
      target: proposal.target,
      targetPath: target.path,
      targetTitle: target.title,
      kind: proposal.kind,
      reason: proposal.reason ?? "",
    });
  }
  return { accepted, rejected, declined };
};

/**
 * After the editor has added the links: for each approved link, is the anchor now a link to
 * its target on the live page? `changed` = the sentence is no longer on the page.
 */
export const verifyLive = (items, pagesByPath, ownHosts) =>
  items.map((item) => {
    const page = pagesByPath.get(item.sourcePath);
    if (!page?.ok) return { ...item, state: "unreadable", note: page?.error ?? "page not fetched" };
    const blocks = taskBlocks(page);
    const sentence = item.sentence?.text ?? item.sentence;
    const holder = blocks.find((block) => block.text.includes(sentence)) ?? blocks.find((block) => findOccurrences(block.text, normalizePhrase(item.anchor)).length);
    const linked = blocks.some((block) => block.linkRanges.some((range) => ownPath(range.href, ownHosts) === item.targetPath && normalizePhrase(block.text.slice(range.start, range.end)).includes(normalizePhrase(item.anchor))));
    if (linked) return { ...item, state: "present", note: "" };
    const elsewhere = blocks.some((block) => block.linkRanges.some((range) => ownPath(range.href, ownHosts) === item.targetPath));
    if (elsewhere) return { ...item, state: "present", note: "linked with another anchor" };
    return holder ? { ...item, state: "missing", note: "the sentence is there, the link is not" } : { ...item, state: "changed", note: "the sentence is no longer on the page" };
  });

/** The approved links as the editor applies them by hand: per article, the sentence, the words to link, the URL. */
export const handoffMarkdown = (items) => {
  const bySource = new Map();
  for (const item of items) bySource.set(item.sourcePath, [...(bySource.get(item.sourcePath) ?? []), item]);
  const rows = [];
  const sections = [...bySource].map(([sourcePath, list]) => {
    const lines = list.map((item, index) => {
      const sentence = item.sentence?.text ?? item.sentence ?? "";
      const from = (item.start ?? 0) - (item.sentence?.offset ?? 0);
      const marked = from >= 0 && sentence.slice(from, from + item.anchor.length) === item.anchor ? `${sentence.slice(0, from)}**${item.anchor}**${sentence.slice(from + item.anchor.length)}` : sentence;
      rows.push([item.sourceUrl ?? sourcePath, sentence, item.anchor, item.targetUrl ?? item.targetPath]);
      return `${index + 1}. In: "${marked}"\n   Link **${item.anchor}** → ${item.targetUrl ?? item.targetPath}${item.targetTitle ? ` (${item.targetTitle})` : ""}`;
    });
    return `## ${list[0].sourceTitle ?? sourcePath}\n\n${list[0].sourceUrl ?? sourcePath}\n\n${lines.join("\n")}`;
  });
  return {
    rows,
    markdown: `# Internal links to add\n\n${items.length} links in ${bySource.size} articles. In the CMS, find each sentence, select the bold words and link them to the URL (an internal link or reference if the CMS has one). Save as a draft; publish after review.\n\n${sections.join("\n\n")}\n`,
  };
};

const tsvCell = (value) => String(value ?? "").replace(/[\t\n\r]+/g, " ");
export const toTsv = (header, rows) => [header, ...rows].map((row) => row.map(tsvCell).join("\t")).join("\n") + "\n";
