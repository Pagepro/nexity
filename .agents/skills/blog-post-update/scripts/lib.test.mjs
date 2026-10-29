import assert from "node:assert/strict";
import { test } from "node:test";

import { readPage, toMarkdown } from "./html.mjs";
import {
  appliedChanges,
  classifyMovement,
  compareWindows,
  comparisonMarkdown,
  diffChunks,
  foldPages,
  gateStatus,
  markdownChunks,
  mentions,
  rankCandidates,
  staticChecks,
  windowRange,
} from "./lib.mjs";

const article = `<html><head><title>Why it matters | Acme</title></head><body><nav><a href="/">Home</a></nav><main><article>
<h1>Why it matters</h1><h2>The short answer</h2><p>See <a href="https://www.acme.com/pricing/">our pricing</a> and the <strong>fine print</strong>.</p>
<ul><li>First point</li><li>Second_point with *stars*</li></ul><figure><img src="/a.png" alt="A chart"></figure></article></main></body></html>`;

test("an article page becomes Markdown with own-site links as paths and images kept", () => {
  const page = readPage(article, "https://www.acme.com/blog/why");
  assert.equal(
    toMarkdown(page.blocks.slice(1)),
    "## The short answer\n\nSee [our pricing](/pricing/) and the **fine print**.\n\n- First point\n\n- Second\\_point with \\*stars\\*\n\n![A chart](/a.png)",
  );
});

test("markdownChunks splits list items and keeps paragraphs whole", () => {
  assert.deepEqual(markdownChunks("A\nB\n\n- one\n- two\n  continued\n\n1. x"), ["A\nB", "- one", "- two continued", "1. x"]);
});

test("diff and comparison separate rewrites from formatting and place additions", () => {
  const operations = diffChunks(["## A", "one", "two", "three"], ["## A", "**one**", "two changed", "three", "four"]);
  const { counts, markdown } = comparisonMarkdown(operations);
  assert.deepEqual(counts, { same: 2, changed: 1, added: 1, removed: 0, formatting: 1 });
  assert.match(markdown, /Insert after: "three"/);
});

test("appliedChanges reads the live page on plain text", () => {
  const operations = diffChunks(["## A", "one", "two", "gone"], ["## A", "one", "two **changed**", "new"]);
  assert.deepEqual(appliedChanges(operations, "## A\n\none\n\ntwo _changed_\n\ngone").map((change) => [change.type, change.done]), [
    ["changed", true],
    ["changed", false],
  ]);
});

test("staticChecks: protected passages, TBD, heading jumps and metadata", () => {
  const result = staticChecks({
    markdown: "## A\n\n#### Deep\n\nThe kept answer is here. TBD",
    metadata: { title: "x".repeat(70), description: "short" },
    protectedSpans: ["The kept answer is here.", "A sentence that was cut."],
  });
  assert.equal(result.blockers.length, 2);
  assert.ok(result.findings.some((finding) => finding.includes("H2 to H4")));
  assert.ok(result.findings.some((finding) => finding.includes("70 characters")));
});

test("mentions groups sentences by heading", () => {
  assert.deepEqual(mentions("Intro on pricing.\n\n## Plans\n\nPricing is per seat. Other.", "pricing"), [
    { section: "(intro)", sentence: "Intro on pricing." },
    { section: "Plans", sentence: "Pricing is per seat." },
  ]);
});

const metrics = (clicks, impressions, position) => ({ clicks, impressions, ctr: impressions ? clicks / impressions : 0, position });

test("classifyMovement names the three readable causes and refuses thin data", () => {
  assert.equal(classifyMovement(metrics(50, 2000, 9), metrics(120, 2000, 5)).movement, "lost-positions");
  assert.equal(classifyMovement(metrics(40, 2000, 3), metrics(100, 2000, 3.2)).movement, "lost-ctr-stable-position");
  assert.equal(classifyMovement(metrics(40, 800, 3), metrics(100, 2000, 3.5)).movement, "lost-impressions");
  assert.equal(classifyMovement(metrics(1, 20, 3), metrics(3, 25, 3)).movement, "low-volume");
});

test("compareWindows says unknown without a baseline", () => {
  const current = { totals: metrics(10, 500, 4), queries: [] };
  assert.equal(compareWindows(current, null).observed, "unknown");
  const result = compareWindows(current, { totals: metrics(40, 600, 4.1), queries: [{ key: "q", ...metrics(40, 600, 4.1) }] });
  assert.equal(result.observed, "observed");
  assert.equal(result.queries[0].movement, "gone");
});

test("windowRange: current, previous and year-ago windows do not overlap", () => {
  assert.deepEqual(windowRange("current", 3, "2026-09-30"), { start: "2026-07-01", end: "2026-09-30" });
  assert.deepEqual(windowRange("previous", 3, "2026-09-30"), { start: "2026-03-31", end: "2026-06-30" });
  assert.deepEqual(windowRange("year-ago", 3, "2026-09-30"), { start: "2025-07-01", end: "2025-09-30" });
});

test("foldPages folds anchors and slashes without double-counting impressions", () => {
  const rows = foldPages([
    { key: "https://acme.com/blog/x", clicks: 10, impressions: 1000, position: 4 },
    { key: "https://acme.com/blog/x/#faq", clicks: 2, impressions: 900, position: 3 },
  ]);
  assert.deepEqual(rows.map(({ key, clicks, impressions }) => ({ key, clicks, impressions })), [{ key: "/blog/x", clicks: 12, impressions: 1000 }]);
});

test("rankCandidates gives reasons and keeps to the prefixes", () => {
  const ranked = rankCandidates({
    current: [
      { key: "/blog/a", clicks: 20, impressions: 3000, position: 8 },
      { key: "/pricing", clicks: 5, impressions: 900, position: 9 },
    ],
    previous: [{ key: "/blog/a", clicks: 80, impressions: 3000, position: 4 }],
    posts: [{ path: "/blog/a", updatedAt: "2024-01-01" }],
    prefixes: ["/blog/"],
    today: new Date("2026-10-01"),
  });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].reasons.length, 3);
});

test("gateStatus goes stale when a signed file changes", () => {
  assert.equal(gateStatus(null, {}).state, "missing");
  assert.equal(gateStatus({ hashes: { "candidate.md": "a" } }, { "candidate.md": "a" }).state, "current");
  assert.deepEqual(gateStatus({ hashes: { "candidate.md": "a" } }, { "candidate.md": "b" }), { state: "stale", stale: ["candidate.md"] });
});


test("parseVisualPlan validates every block", async () => {
  const { parseVisualPlan } = await import("./visuals.mjs");
  const block = (json) => `\`\`\`visual\n${json}\n\`\`\``;
  assert.deepEqual(parseVisualPlan(block('{"id": "a", "kind": "html", "source": "visuals/a.html", "file": "a.png", "alt": "A"}')).map((item) => item.id), ["a"]);
  assert.throws(() => parseVisualPlan(block('{"id": "a", "kind": "screenshot", "file": "a.png"}')), /needs an http\(s\) url/);
  assert.throws(() => parseVisualPlan(block('{"id": "a", "kind": "html", "source": "x", "file": "../a.png"}')), /plain .png/);
  assert.throws(() => parseVisualPlan(`${block('{"id": "a", "kind": "html", "source": "x", "file": "a.png"}')}\n${block('{"id": "a", "kind": "html", "source": "y", "file": "b.png"}')}`), /used twice/);
});

test("the review page shows the change, the images and says it is not an approval", async () => {
  const { buildReviewPage } = await import("./review.mjs");
  const html = buildReviewPage({
    title: "T <x>",
    url: "https://acme.com/blog/t",
    route: "content-light",
    before: "## A\n\none",
    candidate: "## A\n\none changed\n\n![chart](images/chart.png)",
    candidateHash: "abcdef1234567890",
    metadata: [{ label: "Title (H1)", before: "T", after: "T2" }],
    blockers: [],
    findings: ["search title is 70 characters"],
    images: [{ file: "chart.png", src: "images/chart.png", alt: "", caption: "", from: "visuals/chart.html" }],
    counts: { same: 1, changed: 1, added: 1, removed: 0, formatting: 0 },
    validated: true,
  });
  assert.match(html, /Reading this page is not approving it/);
  assert.match(html, /T &#60;x&#62;/);
  assert.match(html, /<img src="images\/chart.png"/);
  assert.match(html, /no alt text/);
});
