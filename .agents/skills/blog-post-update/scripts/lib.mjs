import { createHash } from "node:crypto";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/* ------------------------------------------------------------------------------ Markdown */

const unescape = (text) => text.replace(/\\([*_`[\]\\])/g, "$1");

/** Splits candidate Markdown into chunks: blank lines, and each list item on its own. */
export const markdownChunks = (markdown) => {
  const chunks = [];
  for (const paragraph of String(markdown).replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = paragraph.split("\n").filter((line) => line.trim());
    if (!lines.length) continue;
    if (lines.every((line) => /^\s*([-*]|\d+[.)])\s+/.test(line) || /^\s{2,}\S/.test(line))) {
      for (const line of lines) {
        if (/^\s*([-*]|\d+[.)])\s+/.test(line)) chunks.push(line.replace(/\s+$/, ""));
        else chunks[chunks.length - 1] += ` ${line.trim()}`;
      }
    } else chunks.push(lines.join("\n"));
  }
  return chunks;
};

/* --------------------------------------------------------------------------- comparison */

/** Block-level diff on Markdown chunks (LCS): what stayed, what changed, what is new or gone. */
export const diffChunks = (before, after) => {
  const rows = before.length + 1;
  const cols = after.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = before.length - 1; i >= 0; i -= 1)
    for (let j = after.length - 1; j >= 0; j -= 1)
      table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const operations = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      operations.push({ type: "same", before: before[i], after: after[j] });
      i += 1;
      j += 1;
    } else if (j < after.length && (i === before.length || table[i][j + 1] >= table[i + 1][j])) {
      operations.push({ type: "added", after: after[j] });
      j += 1;
    } else {
      operations.push({ type: "removed", before: before[i] });
      i += 1;
    }
  }
  // Between two unchanged chunks, removals and additions pair up in order as rewrites.
  const merged = [];
  let removed = [];
  let added = [];
  const flush = () => {
    const pairs = Math.min(removed.length, added.length);
    for (let index = 0; index < pairs; index += 1) merged.push({ type: "changed", before: removed[index].before, after: added[index].after });
    merged.push(...removed.slice(pairs), ...added.slice(pairs));
    removed = [];
    added = [];
  };
  for (const operation of operations) {
    if (operation.type === "removed") removed.push(operation);
    else if (operation.type === "added") added.push(operation);
    else {
      flush();
      merged.push(operation);
    }
  }
  flush();
  return merged;
};

const plain = (markdown) => markdown.replace(/[*_`#>]|\[|\]\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

const preview = (markdown) => {
  const text = plain(markdown);
  return text.length > 80 ? `${text.slice(0, 79)}…` : text;
};

/**
 * The before/after a person reads and the editor works from: every change under its section,
 * and for an added passage, the passage it goes after, so it can be placed in any CMS.
 */
export const comparisonMarkdown = (operations) => {
  let section = "(before the first heading)";
  let previous = null;
  const out = [];
  const counts = { same: 0, changed: 0, added: 0, removed: 0, formatting: 0 };
  for (const operation of operations) {
    const heading = (operation.after ?? operation.before ?? "").match(/^#{1,6}\s+(.*)$/);
    if (heading && operation.type !== "removed") section = heading[1];
    if (operation.type === "same") {
      counts.same += 1;
      previous = operation.after;
      continue;
    }
    const formattingOnly = operation.type === "changed" && plain(operation.before) === plain(operation.after);
    counts[formattingOnly ? "formatting" : operation.type] += 1;
    out.push(`### ${section} · ${formattingOnly ? "formatting or links only" : operation.type}`);
    if (operation.type === "added") out.push(previous ? `Insert after: "${preview(previous)}"` : "Insert at the start of the article.");
    if (operation.before !== undefined) out.push(`**Before**\n\n${operation.before}`);
    if (operation.after !== undefined) out.push(`**After**\n\n${operation.after}`);
    out.push("---");
    if (operation.after !== undefined) previous = operation.after;
  }
  return {
    counts,
    markdown: `# Before / after\n\n${counts.changed} changed, ${counts.formatting} formatting or links only, ${counts.added} added, ${counts.removed} removed, ${counts.same} unchanged.\n\n${out.join("\n\n")}\n`,
  };
};

/**
 * Which approved changes the live page shows: a changed or added passage whose text is on the
 * page, a removed one that is gone. Compared on plain text, so the CMS's formatting does not
 * count as a difference.
 */
export const appliedChanges = (operations, liveMarkdown) => {
  const live = new Set(markdownChunks(liveMarkdown).map(plain));
  return operations
    .filter((operation) => operation.type !== "same" && !(operation.type === "changed" && plain(operation.before) === plain(operation.after)))
    .map((operation) => {
      const done = operation.type === "removed" ? !live.has(plain(operation.before)) : live.has(plain(operation.after));
      return { type: operation.type, done, text: preview(operation.after ?? operation.before) };
    });
};

/* ------------------------------------------------------------------------------ checks */

export const extractLinks = (markdown) =>
  [...String(markdown).matchAll(/\[((?:\\.|[^\]])+)\]\(([^)\s]+)\)/g)].map((match) => ({ text: unescape(match[1]), href: match[2] }));

export const headingOutline = (markdown) =>
  markdownChunks(markdown)
    .map((chunk) => chunk.match(/^(#{1,6})\s+(.*)$/))
    .filter(Boolean)
    .map((match) => ({ level: match[1].length, text: match[2] }));

/** Structure and metadata checks that need no network. Blockers stop `handoff`; findings do not. */
export const staticChecks = ({ markdown, metadata, protectedSpans = [], problems = [] }) => {
  const blockers = [...problems];
  const findings = [];
  const text = plain(markdown);
  for (const span of protectedSpans) if (!text.includes(plain(span))) blockers.push(`protected passage missing or changed: "${span.slice(0, 80)}…"`);

  const outline = headingOutline(markdown);
  outline.forEach((heading, index) => {
    const previous = index ? outline[index - 1].level : 1;
    if (heading.level === 1) findings.push(`an H1 inside the body ("${heading.text}"): the title is already the page's H1`);
    else if (heading.level > previous + 1) findings.push(`heading level jumps from H${previous} to H${heading.level} at "${heading.text}"`);
  });
  if (/\bTBD\b|\bTODO\b|\[\[|\]\]/.test(markdown)) blockers.push("the candidate still holds TBD/TODO markers or [[notes]]");

  const title = metadata?.seoTitle || metadata?.title || "";
  if (!metadata?.title) blockers.push("metadata.title is empty");
  if (title.length > 60) findings.push(`search title is ${title.length} characters (over 60 may be truncated)`);
  const description = metadata?.description ?? "";
  if (!description) findings.push("meta description is empty");
  else if (description.length > 160) findings.push(`meta description is ${description.length} characters (over 160 may be truncated)`);
  else if (description.length < 70) findings.push(`meta description is ${description.length} characters (under 70 is usually too thin)`);
  return { blockers, findings, words: text.split(" ").filter(Boolean).length, outline };
};

/** Sentences that mention a term, grouped by the heading they sit under. */
export const mentions = (markdown, term) => {
  const needle = term.toLowerCase();
  let section = "(intro)";
  const found = [];
  for (const chunk of markdownChunks(markdown)) {
    const heading = chunk.match(/^#{1,6}\s+(.*)$/);
    if (heading) section = heading[1];
    for (const sentence of plain(chunk).split(/(?<=[.!?])\s+/))
      if (sentence.toLowerCase().includes(needle)) found.push({ section, sentence });
  }
  return found;
};

/* ------------------------------------------------------------------------------- data */

export const MIN_IMPRESSIONS = 50;
export const MIN_BASELINE_IMPRESSIONS = 100;
export const POSITION_MOVE = 1.0;
export const MATERIAL_CHANGE = 0.2;

const relative = (current, previous) => (previous === 0 ? (current === 0 ? 0 : 1) : (current - previous) / previous);
const pct = (value) => `${Math.round(Math.abs(value) * 100)}%`;

/**
 * What moved and what kind of move it was. Three causes can be read off two Search Console
 * windows (lost positions, lost CTR at a held position, lost demand); the others cannot, and
 * nothing here pretends otherwise. Below the volume floor nothing is called a movement.
 */
export const classifyMovement = (current, previous) => {
  if (!current || current.impressions === 0) return previous?.impressions ? { movement: "gone", note: `${previous.impressions} impressions before, none now` } : { movement: "low-volume", note: "no data" };
  if (!previous || previous.impressions === 0) return { movement: "new", note: "not in the earlier window" };
  if (current.impressions + previous.impressions < MIN_IMPRESSIONS) return { movement: "low-volume", note: `${current.impressions + previous.impressions} impressions across both windows` };

  const clicksChange = relative(current.clicks, previous.clicks);
  const impressionsChange = relative(current.impressions, previous.impressions);
  const ctrChange = previous.ctr > 0 ? relative(current.ctr, previous.ctr) : null;
  const positionDelta = current.position != null && previous.position != null ? current.position - previous.position : null;

  if (positionDelta !== null && positionDelta >= POSITION_MOVE && clicksChange < 0)
    return { movement: "lost-positions", note: `average position ${previous.position.toFixed(1)} → ${current.position.toFixed(1)}` };
  if (positionDelta !== null && Math.abs(positionDelta) < POSITION_MOVE && impressionsChange > -0.1 && ctrChange !== null && ctrChange <= -MATERIAL_CHANGE)
    return { movement: "lost-ctr-stable-position", note: `position held while CTR fell ${pct(ctrChange)}: something on the results page is taking the click (AI Overview, a snippet, a better title)` };
  if (positionDelta !== null && positionDelta <= POSITION_MOVE && impressionsChange <= -MATERIAL_CHANGE)
    return { movement: "lost-impressions", note: `impressions fell ${pct(impressionsChange)} at a position that did not get worse: demand or the results page shrank, not the ranking` };
  if (clicksChange >= MATERIAL_CHANGE) return { movement: "gained", note: `clicks up ${pct(clicksChange)}` };
  if (clicksChange <= -MATERIAL_CHANGE) return { movement: "lost-clicks", note: `clicks down ${pct(clicksChange)}, impressions ${impressionsChange >= 0 ? "+" : "-"}${pct(impressionsChange)}; no single cause fits` };
  return { movement: "stable", note: "no material movement" };
};

const totals = (rows) => {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weighted = rows.reduce((sum, row) => sum + (row.position ?? 0) * row.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weighted / impressions : null };
};

/** Compares two windows of one page's Search Console data (page totals and its queries). */
export const compareWindows = (current, baseline) => {
  if (!current || !baseline) {
    return {
      observed: "unknown",
      reason: !current ? "no current window" : "only one window: there is nothing to compare against",
      page: null,
      queries: [],
    };
  }
  const page = { current: current.totals, baseline: baseline.totals, ...classifyMovement(current.totals, baseline.totals) };
  const keys = new Set([...current.queries.map((row) => row.key), ...baseline.queries.map((row) => row.key)]);
  const byKey = (rows) => new Map(rows.map((row) => [row.key, row]));
  const now = byKey(current.queries);
  const before = byKey(baseline.queries);
  const queries = [...keys]
    .map((key) => {
      const a = now.get(key) ?? null;
      const b = before.get(key) ?? null;
      return { key, current: a, baseline: b, clicksDelta: (a?.clicks ?? 0) - (b?.clicks ?? 0), ...classifyMovement(a, b) };
    })
    .sort((x, y) => x.clicksDelta - y.clicksDelta || x.key.localeCompare(y.key));

  const observed =
    baseline.totals.impressions < MIN_BASELINE_IMPRESSIONS
      ? { observed: "unknown", reason: `the baseline has ${baseline.totals.impressions} impressions, below ${MIN_BASELINE_IMPRESSIONS}: too thin to call a decline` }
      : ["lost-positions", "lost-ctr-stable-position", "lost-impressions", "lost-clicks", "gone"].includes(page.movement)
        ? { observed: "observed", reason: page.note }
        : { observed: "not-observed", reason: page.note };
  return { ...observed, page, queries };
};

export const gscWindowFromRows = ({ pageRows, queryRows, range, source }) => ({
  range,
  source,
  totals: totals(pageRows),
  queries: queryRows.map((row) => ({ key: row.key, clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position })),
});

/** Date range for a window ending `end` (default: three days ago; Search Console finalises late). */
export const windowRange = (window, months, end) => {
  const iso = (date) => date.toISOString().slice(0, 10);
  const endDate = end ? new Date(`${end}T00:00:00Z`) : new Date(Date.now() - 3 * 86_400_000);
  endDate.setUTCHours(0, 0, 0, 0);
  const shift = (date, byMonths) => {
    const copy = new Date(date);
    copy.setUTCMonth(copy.getUTCMonth() - byMonths);
    return copy;
  };
  const day = 86_400_000;
  if (window === "current") return { start: iso(new Date(shift(endDate, months).getTime() + day)), end: iso(endDate) };
  if (window === "previous") {
    const previousEnd = shift(endDate, months);
    return { start: iso(new Date(shift(previousEnd, months).getTime() + day)), end: iso(previousEnd) };
  }
  if (window === "year-ago") {
    const yearEnd = shift(endDate, 12);
    return { start: iso(new Date(shift(yearEnd, months).getTime() + day)), end: iso(yearEnd) };
  }
  throw new Error(`unknown window "${window}" (current, previous, year-ago)`);
};

/** Folds `/blog/x#section` and `/blog/x/` rows into `/blog/x`. Impressions are not summed across anchors: Google counts the same appearance again. */
export const foldPages = (rows) => {
  const byPath = new Map();
  for (const row of rows) {
    let path;
    try {
      path = new URL(row.key).pathname.replace(/\/+$/, "") || "/";
    } catch {
      continue;
    }
    const entry = byPath.get(path) ?? { key: path, clicks: 0, impressions: 0, positionWeight: 0, anchorRows: 0 };
    const isAnchor = row.key.includes("#");
    entry.clicks += row.clicks;
    if (!isAnchor) {
      entry.impressions += row.impressions;
      entry.positionWeight += (row.position ?? 0) * row.impressions;
    } else entry.anchorRows += 1;
    byPath.set(path, entry);
  }
  return [...byPath.values()].map(({ positionWeight, ...entry }) => ({
    ...entry,
    ctr: entry.impressions ? entry.clicks / entry.impressions : 0,
    position: entry.impressions ? positionWeight / entry.impressions : null,
  }));
};

/**
 * Which posts are worth opening: clicks lost against the previous window, position 5–15 with
 * real clicks (one honest improvement from the range people click), and age. A suggestion
 * list, not a queue: every row carries its reasons.
 */
export const rankCandidates = ({ current, previous, posts = [], prefixes = [], today = new Date(), limit = 20 }) => {
  const before = new Map((previous ?? []).map((row) => [row.key, row]));
  const postsByPath = new Map(posts.map((post) => [post.path, post]));
  const rows = [];
  for (const row of current) {
    if (prefixes.length && !prefixes.some((prefix) => row.key.startsWith(prefix))) continue;
    const post = postsByPath.get(row.key) ?? { path: row.key };
    const baseline = before.get(row.key);
    const reasons = [];
    let score = 0;
    const lost = baseline ? baseline.clicks - row.clicks : 0;
    if (baseline && lost > 0 && baseline.clicks >= 10) {
      score += (lost / baseline.clicks) * Math.log10(1 + baseline.clicks) * 10;
      reasons.push(`lost ${lost} clicks (${baseline.clicks} → ${row.clicks})`);
    }
    if (row.position != null && row.position >= 5 && row.position <= 15 && row.clicks >= 5) {
      score += 5 + Math.log10(1 + row.impressions);
      reasons.push(`average position ${row.position.toFixed(1)} with ${row.impressions} impressions`);
    }
    const updated = post.updatedAt ?? post.publishedAt;
    const months = updated ? (today - new Date(updated)) / (30.4 * 86_400_000) : null;
    if (months !== null && months >= 12) {
      score += Math.min(months / 12, 3);
      reasons.push(`last changed ${Math.round(months)} months ago`);
    }
    if (!reasons.length) continue;
    rows.push({ path: row.key, title: post.title ?? null, clicks: row.clicks, impressions: row.impressions, position: row.position, score: Math.round(score * 10) / 10, reasons });
  }
  return rows.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
};

/* -------------------------------------------------------------------------------- gates */

export const GATES = ["gate1", "gate2", "gate3", "no-change"];

/** A gate is current when the files it signed still hash the same. */
export const gateStatus = (gate, currentHashes) => {
  if (!gate) return { state: "missing" };
  const stale = Object.entries(gate.hashes ?? {}).filter(([file, hash]) => currentHashes[file] !== hash).map(([file]) => file);
  return stale.length ? { state: "stale", stale } : { state: "current" };
};
