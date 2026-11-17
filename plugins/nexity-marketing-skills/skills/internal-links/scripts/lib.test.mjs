import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parseSitemap, readPage, robotsRules, toMarkdown } from "./html.mjs";
import {
  buildCandidates,
  buildCatalogue,
  findOccurrences,
  handoffMarkdown,
  inboundCounts,
  normalizeRules,
  pageNames,
  seedLedger,
  shortlist,
  taskBlocks,
  validateAnswer,
  verifyLive,
} from "./lib.mjs";
import { LINK_TEMPLATES, linkShapes, matchDocuments, planSanity, verifyItems, verifySanity } from "./sanity.mjs";

const SITE = "https://www.acme.com";
const ownHosts = new Set(["acme.com"]);
const html = (title, body, head = "") =>
  `<!doctype html><html><head><title>${title} | Acme</title>${head}</head><body><header><nav><a href="/pricing">Pricing</a></nav></header><main><article><h1>${title}</h1>${body}</article><aside><a href="/blog/what-is-a-headless-cms">Related</a></aside></main><footer>f</footer></body></html>`;
const page = (path, title, body, head) => ({ ...readPage(html(title, body, head), `${SITE}${path}`, { ownHosts }), ok: true });

const pages = [
  page("/blog/react-guide", "Hello", "<h2>Headless CMS basics</h2><p>A headless CMS separates content from code. We use Next.js development for speed.</p><p>Read more about pricing plans.</p><blockquote><p>A headless CMS quote.</p></blockquote>"),
  page("/blog/what-is-a-headless-cms", "What is a Headless CMS? A Guide", "<p>Body</p>"),
  page("/services/nextjs-development", "Next.js development services", "<p>Services</p>"),
  page("/pricing", "Pricing", "<p>Plans</p>"),
  page("/blog/react-guide-copy", "Copy", "<p>x</p>", `<link rel="canonical" href="${SITE}/blog/react-guide">`),
  page("/blog", "Blog", `<ul><li><a href="/blog/react-guide">Hello</a></li><li><a href="/pricing">Pricing</a></li></ul>`),
];

test("readPage takes the article, not the navigation, sidebar or footer", () => {
  const [first] = pages;
  assert.deepEqual(
    first.blocks.map((block) => [block.kind, block.text]),
    [
      ["heading", "Hello"],
      ["heading", "Headless CMS basics"],
      ["paragraph", "A headless CMS separates content from code. We use Next.js development for speed."],
      ["paragraph", "Read more about pricing plans."],
      ["quote", "A headless CMS quote."],
    ],
  );
  assert.equal(first.seoTitle, "Hello | Acme");
});

test("readPage keeps link ranges and writes own-site links as paths in Markdown", () => {
  const read = readPage(html("T", '<p>See <a href="https://acme.com/pricing/">our <b>plans</b></a> or <a href="https://x.dev/a">x</a>.</p><ul><li>One<ul><li>Nested</li></ul></li></ul>'), `${SITE}/t`, { ownHosts });
  assert.deepEqual(read.blocks[1].links, [
    { start: 4, end: 13, href: "https://acme.com/pricing/" },
    { start: 17, end: 18, href: "https://x.dev/a" },
  ]);
  assert.equal(toMarkdown(read.blocks.slice(1)), "See [our **plans**](/pricing/) or [x](https://x.dev/a).\n\n- One\n\n  - Nested");
});

test("robots rules and sitemaps", () => {
  const robots = robotsRules("User-agent: *\nDisallow: /admin\nAllow: /admin/public\nSitemap: https://acme.com/s.xml");
  assert.deepEqual([robots.allowed("/admin/x"), robots.allowed("/admin/public/y"), robots.allowed("/blog")], [false, true, true]);
  assert.deepEqual(robots.sitemaps, ["https://acme.com/s.xml"]);
  assert.deepEqual(parseSitemap("<sitemapindex><sitemap><loc>https://a.com/1.xml</loc></sitemap></sitemapindex>"), { isIndex: true, entries: [{ loc: "https://a.com/1.xml", lastmod: null }] });
});

test("pageNames strips title furniture and the brand segment", () => {
  const names = pageNames({ title: "What is a Headless CMS? A Guide | Acme", path: "/blog/what-is-a-headless-cms" }, "acme").map((name) => name.phrase);
  assert.deepEqual(names, ["headless cms"]);
});

test("findOccurrences matches whole words case-insensitively", () => {
  assert.deepEqual(findOccurrences("A Headless CMS, headless cmses", "headless cms"), [{ start: 2, end: 14 }]);
  assert.deepEqual(findOccurrences("Zażółć gęślą jaźń", "gęślą jaźń"), [{ start: 7, end: 17 }]);
});

test("buildCatalogue keys pages by path and drops canonical duplicates", () => {
  const catalogue = buildCatalogue(pages, { brand: "acme", ownHosts });
  assert.deepEqual(catalogue.map((entry) => entry.id), ["/blog", "/blog/react-guide", "/blog/what-is-a-headless-cms", "/pricing", "/services/nextjs-development"]);
});

test("inboundCounts ignores listing pages and navigation", () => {
  const catalogue = buildCatalogue(pages, { ownHosts });
  const counts = inboundCounts(pages, catalogue, ownHosts);
  assert.equal(counts.get("/blog/react-guide"), 0);
  assert.equal(counts.get("/pricing"), 0);
});

const setup = (rulesRaw, sourcePage = pages[0]) => {
  const catalogue = buildCatalogue(pages, { brand: "acme", ownHosts });
  const rules = normalizeRules(rulesRaw, catalogue);
  const source = { id: "/blog/react-guide", title: "Hello", path: "/blog/react-guide" };
  const blocks = taskBlocks(sourcePage);
  const ledger = seedLedger(blocks, catalogue, rules, ownHosts);
  return { catalogue, rules, source, blocks, ledger };
};

test("buildCandidates: rules first, page names, never in headings or quotes, never self", () => {
  const { catalogue, rules, source, blocks, ledger } = setup({ phrases: [{ phrases: ["Next.js development"], target: "https://acme.com/services/nextjs-development/", cluster: "nextjs" }] });
  assert.deepEqual(
    buildCandidates(source, blocks, catalogue, rules, ledger).map((candidate) => [candidate.anchor, candidate.targetPath, candidate.block]),
    [
      ["Next.js development", "/services/nextjs-development", "b3"],
      ["headless CMS", "/blog/what-is-a-headless-cms", "b3"],
    ],
  );
});

test("an existing link spends its target and its anchor", () => {
  const linked = page("/blog/react-guide", "Hello", '<p>A <a href="https://www.acme.com/blog/what-is-a-headless-cms/">headless CMS</a> separates content from code.</p>');
  const { catalogue, rules, blocks, ledger } = setup({}, linked);
  assert.ok(ledger.targets.has("/blog/what-is-a-headless-cms"));
  assert.ok(ledger.anchors.has("headless cms"));
  assert.equal(buildCandidates({ id: "/blog/react-guide" }, blocks, catalogue, rules, ledger).length, 0);
});

test("validateAnswer: exact anchors only, ledger and limits", () => {
  const { catalogue, rules, source, blocks, ledger } = setup({ maxNewLinksPerArticle: 2 });
  const task = {
    source,
    blocks,
    candidates: buildCandidates(source, blocks, catalogue, rules, ledger),
    shortlist: shortlist(source, blocks.map((item) => item.text).join(" "), catalogue, ledger),
    ledger: { targets: [...ledger.targets], anchors: [...ledger.anchors], clusters: [...ledger.clusters], existing: 0 },
  };
  const text = blocks[3].text;
  const result = validateAnswer(
    task,
    {
      select: [{ candidate: "c1", accept: true }],
      proposals: [
        { block: "b4", start: text.indexOf("pricing"), end: text.indexOf("pricing") + 13, anchor: "pricing plans", target: "/pricing" },
        { block: "b4", start: 0, end: 4, anchor: "Reed", target: "/pricing" },
        { block: "b2", start: 0, end: 8, anchor: "Headless", target: "/blog/what-is-a-headless-cms" },
        { block: "b5", start: 2, end: 14, anchor: "headless CMS", target: "/blog/what-is-a-headless-cms" },
      ],
    },
    rules,
  );
  assert.equal(result.accepted.length, 2);
  assert.match(result.rejected.find((entry) => entry.proposal.anchor === "Reed").reason, /does not match/);
  assert.match(result.rejected.find((entry) => entry.proposal.anchor === "Headless").reason, /heading/);
  assert.match(result.rejected.find((entry) => entry.proposal.block === "b5").reason, /quote/);
});

test("handoffMarkdown marks the anchor in its sentence; verifyLive reads the edited page", () => {
  const item = { sourcePath: "/blog/react-guide", sourceUrl: `${SITE}/blog/react-guide`, sourceTitle: "Hello", start: 23, anchor: "pricing plans", sentence: { text: "Read more about pricing plans.", offset: 7 }, targetPath: "/pricing", targetUrl: `${SITE}/pricing` };
  assert.match(handoffMarkdown([item]).markdown, /Read more about \*\*pricing plans\*\*\./);
  const before = new Map([["/blog/react-guide", pages[0]]]);
  assert.equal(verifyLive([item], before, ownHosts)[0].state, "missing");
  const after = new Map([["/blog/react-guide", page("/blog/react-guide", "Hello", '<p>Read more about <a href="/pricing">pricing plans</a>.</p>')]]);
  assert.equal(verifyLive([item], after, ownHosts)[0].state, "present");
  const gone = new Map([["/blog/react-guide", page("/blog/react-guide", "Hello", "<p>Rewritten.</p>")]]);
  assert.equal(verifyLive([item], gone, ownHosts)[0].state, "changed");
});

test("html.mjs is the same file in both skills", () => {
  const here = readFileSync(new URL("./html.mjs", import.meta.url), "utf8");
  const there = readFileSync(new URL("../../blog-post-update/scripts/html.mjs", import.meta.url), "utf8");
  assert.equal(there, here, "copy internal-links/scripts/html.mjs to blog-post-update/scripts/html.mjs");
});

const span = (key, text, marks = []) => ({ _type: "span", _key: key, text, marks });
const sanityDocs = [
  { _id: "post-a", _type: "post", _rev: "r1", metadata: { slug: { current: "react-guide" } }, body: [
    { _type: "block", _key: "h", style: "h2", markDefs: [], children: [span("h1", "Read more about pricing plans.")] },
    { _type: "block", _key: "p", style: "normal", markDefs: [], children: [span("p1", "Read  more about "), span("p2", "pricing", ["strong"]), span("p3", " plans.")] },
  ] },
  { _id: "page-pricing", _type: "page", metadata: { slug: { current: "pricing" } } },
  { _id: "post-dup", _type: "post", slug: { current: "pricing" } },
];
const approvedItem = { id: "i1", sourcePath: "/blog/react-guide", targetPath: "/pricing", anchor: "pricing plans", start: 16, sentence: { text: "Read more about pricing plans.", offset: 0 } };

test("matchDocuments prefers the whole path and reports ambiguous slugs", () => {
  const matches = matchDocuments(["/blog/react-guide", "/pricing"], sanityDocs);
  assert.equal(matches.get("/blog/react-guide").id, "post-a");
  assert.match(matches.get("/pricing").error, /2 documents fit/);
  assert.equal(matchDocuments(["/pricing"], sanityDocs, { page: "/", post: "/blog/" }).get("/pricing").id, "page-pricing");
});

test("planSanity links the anchor in the paragraph, not the heading, into a new draft", () => {
  let n = 0;
  const { transactions, skipped } = planSanity([approvedItem], sanityDocs, { template: LINK_TEMPLATES.reference, routes: { page: "/", post: "/blog/" } }, () => `k${++n}xxxxxxxx`);
  assert.equal(skipped.length, 0);
  const [transaction] = transactions;
  assert.equal(transaction.documentId, "drafts.post-a");
  assert.ok(transaction.mutations[0].createIfNotExists);
  const block = transaction.mutations[1].patch.set['body[_key=="p"]'];
  assert.deepEqual(block.children.map((child) => [child.text, child.marks]), [
    ["Read  more about ", []],
    ["pricing", ["strong", "k1xxxxxxxx"]],
    [" plans", ["k1xxxxxxxx"]],
    [".", []],
  ]);
  assert.deepEqual(block.markDefs[0], { _type: "link", type: "internal", internal: { _type: "reference", _ref: "page-pricing" }, _key: "k1xxxxxxxx" });
  const stored = { ...sanityDocs[0], _id: "drafts.post-a", body: [sanityDocs[0].body[0], block] };
  assert.deepEqual(verifySanity(transaction, stored).map((change) => change.present), [true]);
  assert.equal(verifyItems([approvedItem], [...sanityDocs, stored], { page: "/", post: "/blog/" })[0].state, "present");
});

test("an href template needs no target document; an id template skips a target without one", () => {
  const item = { ...approvedItem, targetPath: "/nowhere" };
  assert.equal(planSanity([item], sanityDocs, { template: LINK_TEMPLATES.reference }).skipped.length, 1);
  const { transactions } = planSanity([item], sanityDocs, { template: LINK_TEMPLATES.href });
  assert.equal(transactions[0].mutations[1].patch.set['body[_key=="p"]'].markDefs[0].href, "/nowhere");
});

test("linkShapes suggests the template the dataset already uses", () => {
  const linked = { _id: "x", body: [{ _type: "block", _key: "b", markDefs: [{ _key: "m", _type: "link", href: "/a" }], children: [span("s", "a", ["m"])] }] };
  assert.equal(linkShapes([linked]).suggested, "href");
});
