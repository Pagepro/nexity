import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildManifest,
  checkProposal,
  fallbackWarnings,
  findImageUsages,
  makeBatches,
  mergeProposals,
  pendingUsages,
  planApply,
  plainText,
  previewUrl,
  toPatchPath,
} from "./lib.mjs";
import { buildReport } from "./report.mjs";

const ASSET_A = "image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-800x600-jpg";
const ASSET_B = "image-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-120x40-svg";
const ref = (id) => ({ _type: "image", asset: { _type: "reference", _ref: id } });
const block = (key, text, style = "normal") => ({
  _type: "block",
  _key: key,
  style,
  children: [{ _type: "span", _key: `${key}s`, text }],
});

const page = (overrides = {}) => ({
  _id: "page-1",
  _type: "page",
  _rev: "r1",
  metadata: { _type: "metadata", title: "Pricing", slug: { current: "pricing" }, image: { _type: "img", image: ref(ASSET_A) } },
  sections: [
    {
      _type: "hero",
      _key: "h1",
      title: [block("t", "Plans for every team")],
      image: { _type: "img", alt: "", image: ref(ASSET_A), responsive: [{ _type: "responsive", _key: "r", image: ref(ASSET_B) }] },
    },
    {
      _type: "logos-carousel",
      _key: "l1",
      logos: [{ _type: "img", _key: "lg1", alt: "Acme", image: ref(ASSET_B) }],
    },
    {
      _type: "newsletter",
      _key: "n1",
      title: "Stay in touch",
      backgroundImage: { _type: "img", image: ref(ASSET_A) },
    },
  ],
  ...overrides,
});

const post = () => ({
  _id: "post-1",
  _type: "post",
  _rev: "p1",
  title: "Quarterly review",
  content: [
    block("b1", "Our revenue grew in every region."),
    { _type: "img", _key: "i1", image: ref(ASSET_A) },
    block("b2", "Next quarter we focus on retention."),
    {
      _type: "videoEmbed",
      _key: "v1",
      url: "https://video.example/1",
      caption: "Product walkthrough",
      poster: { _type: "img", image: ref(ASSET_B) },
    },
  ],
  hero: ref(ASSET_B),
});

const ASSETS = {
  [ASSET_A]: { _id: ASSET_A, url: "https://cdn.sanity.io/images/p/d/a-800x600.jpg", mimeType: "image/jpeg", title: "Team at work", description: "Office photo", altText: null, hasAlpha: false },
  [ASSET_B]: { _id: ASSET_B, url: "https://cdn.sanity.io/images/p/d/b-120x40.svg", mimeType: "image/svg+xml", title: null, description: null, altText: "Acme logo", hasAlpha: true },
};

const manifestOf = (documents, cache = { assets: {}, usages: {} }) =>
  buildManifest({ documents, assets: ASSETS, cache, dataset: "production", projectId: "p", studioUrl: "http://localhost:3000/admin", lang: "en", generatedAt: "2026-01-01T00:00:00.000Z" });

test("plainText flattens Portable Text and strings", () => {
  assert.equal(plainText([block("a", "Hello  "), block("b", "world")]), "Hello world");
  assert.equal(plainText("  spaced\n text "), "spaced text");
  assert.equal(plainText(null), "");
});

test("toPatchPath uses keys where items have them", () => {
  assert.equal(toPatchPath(["sections", { key: "h1" }, "image"]), 'sections[_key=="h1"].image');
  assert.equal(toPatchPath(["items", 2, "image"]), "items[2].image");
});

test("findImageUsages finds img fields, array items and bare images, not responsive variants", () => {
  const usages = findImageUsages(page());
  assert.deepEqual(
    usages.map((usage) => usage.path),
    [
      "metadata.image",
      'sections[_key=="h1"].image',
      'sections[_key=="l1"].logos[_key=="lg1"]',
      'sections[_key=="n1"].backgroundImage',
    ],
  );
  const hero = usages[1];
  assert.equal(hero.altPath, 'sections[_key=="h1"].image.alt');
  assert.equal(hero.assetId, ASSET_A);
  assert.deepEqual(hero.context.section, { type: "hero", heading: "Plans for every team" });
  assert.equal(hero.context.parent.title, "Plans for every team");
  assert.equal(usages[0].hint.startsWith("Social sharing image"), true);
  assert.equal(usages[2].alt, "Acme");
  assert.match(usages[2].hint, /^Logo/);
  assert.equal(usages[3].decorativeHint, true);
});

test("findImageUsages reads rich-text neighbours and captions", () => {
  const usages = findImageUsages(post());
  const inline = usages.find((usage) => usage.path === 'content[_key=="i1"]');
  assert.equal(inline.inRichText, true);
  assert.equal(inline.context.before, "Our revenue grew in every region.");
  assert.equal(inline.context.after, "Next quarter we focus on retention.");
  assert.equal(inline.context.section, null);
  const poster = usages.find((usage) => usage.path === 'content[_key=="v1"].poster');
  assert.equal(poster.context.caption, "Product walkthrough");
  assert.equal(poster.ownerType, "videoEmbed");
  const bare = usages.find((usage) => usage.path === "hero");
  assert.equal(bare.kind, "image");
  assert.equal(bare.writable, false);
});

test("buildManifest prefers the draft, counts statuses and skips release versions", () => {
  const draft = page({ _id: "drafts.page-1", _rev: "d1" });
  draft.sections[0].image.alt = "Draft alt";
  const version = page({ _id: "versions.r1.page-1" });
  const manifest = manifestOf([page(), draft, version, post()]);
  const hero = manifest.usages.find((usage) => usage.key === 'page-1#sections[_key=="h1"].image');
  assert.equal(hero.alt, "Draft alt");
  assert.deepEqual(hero.variants, { published: "", draft: "Draft alt" });
  assert.equal(hero.status, "has-alt");
  assert.equal(hero.studio, "http://localhost:3000/admin/intent/edit/id=page-1;type=page");
  assert.equal(manifest.counts.versionsSkipped, 1);
  assert.equal(manifest.counts.notWritable, 1);
  assert.equal(manifest.counts.usages, 7);
  assert.equal(manifest.counts.decorative, 1);
  assert.equal(manifest.counts.assets, 2);
});

test("context hash changes when the context does, and cached proposals are reused", () => {
  const manifest = manifestOf([page()]);
  const hero = manifest.usages.find((usage) => usage.path === 'sections[_key=="h1"].image');
  const cache = { assets: {}, usages: { [hero.key]: { assetId: hero.assetId, contextHash: hero.contextHash, alt: "x" } } };
  assert.equal(pendingUsages(manifest, cache).some((usage) => usage.key === hero.key), false);

  const changed = page();
  changed.sections[0].title = [block("t", "New heading")];
  const next = manifestOf([changed]);
  assert.equal(pendingUsages(next, cache).some((usage) => usage.key === hero.key), true);
});

test("makeBatches keeps all usages of one asset together", () => {
  const usages = [
    { key: "1", assetId: "a" },
    { key: "2", assetId: "b" },
    { key: "3", assetId: "a" },
    { key: "4", assetId: "c" },
  ];
  const batches = makeBatches(usages, 2);
  assert.deepEqual(batches.map((batch) => batch.assetIds), [["a", "b"], ["c"]]);
  assert.deepEqual(batches[0].usages.map((usage) => usage.key), ["1", "3", "2"]);
});

test("previewUrl asks the CDN for a small JPEG, PNG with alpha, SVG as is", () => {
  assert.deepEqual(previewUrl(ASSETS[ASSET_A]), { url: `${ASSETS[ASSET_A].url}?w=640&fit=max&fm=jpg&q=75`, ext: "jpg" });
  assert.equal(previewUrl({ url: "https://x/y.png", hasAlpha: true }, 320).url, "https://x/y.png?w=320&fit=max&fm=png");
  assert.deepEqual(previewUrl(ASSETS[ASSET_B]), { url: ASSETS[ASSET_B].url, ext: "svg" });
  assert.equal(previewUrl({}), null);
});

test("checkProposal flags filler, file names, length, caption repeats and empty alts", () => {
  assert.deepEqual(checkProposal({ alt: "Image of a dog" }).problems, ["starts with 'image of'-style filler"]);
  assert.deepEqual(checkProposal({ alt: "IMG_2041.jpg" }).problems, ["looks like a file name"]);
  assert.match(checkProposal({ alt: "a".repeat(130) }).problems[0], /^long/);
  assert.deepEqual(checkProposal({ alt: "Walkthrough" }, { context: { caption: "walkthrough" } }).problems, ["repeats the caption verbatim"]);
  assert.equal(checkProposal({ alt: "" }).invalid, true);
  assert.deepEqual(checkProposal({ alt: "x", decorative: true }), { alt: "", problems: ["decorative but has text; the alt was emptied"] });
});

test("mergeProposals stores valid proposals with their hash and reports unknown keys", () => {
  const manifest = manifestOf([page()]);
  const hero = manifest.usages.find((usage) => usage.path === 'sections[_key=="h1"].image');
  const { cache, merged, warnings } = mergeProposals({
    cache: { assets: {}, usages: {} },
    manifest,
    now: "t",
    proposals: [
      {
        file: "batch-01.json",
        data: {
          assets: { [ASSET_A]: { alt: "Four people at a desk" } },
          usages: [
            { key: hero.key, alt: " Four people  planning at a desk ", sources: ["image", "asset.title"] },
            { key: "nope#x", alt: "y" },
            { key: hero.key.replace("h1", "n1").replace(".image", ".backgroundImage"), alt: "" },
          ],
        },
      },
    ],
  });
  assert.equal(merged, 1);
  assert.equal(cache.usages[hero.key].alt, "Four people planning at a desk");
  assert.equal(cache.usages[hero.key].contextHash, hero.contextHash);
  assert.equal(cache.assets[ASSET_A].alt, "Four people at a desk");
  assert.equal(warnings.length, 2);
});

const item = (overrides = {}) => ({
  key: 'page-1#sections[_key=="h1"].image',
  documentId: "page-1",
  path: 'sections[_key=="h1"].image',
  altPath: 'sections[_key=="h1"].image.alt',
  assetId: ASSET_A,
  currentAlt: "",
  alt: "Four people planning at a desk",
  decorative: false,
  overwrite: false,
  ...overrides,
});

test("planApply creates a draft from the published document by default", () => {
  const { transactions, skipped } = planApply([item()], [page()]);
  assert.equal(skipped.length, 0);
  assert.equal(transactions.length, 1);
  const [create, patch] = transactions[0].mutations;
  assert.equal(create.createIfNotExists._id, "drafts.page-1");
  assert.equal(create.createIfNotExists._rev, undefined);
  assert.deepEqual(patch.patch, { id: "drafts.page-1", set: { 'sections[_key=="h1"].image.alt': "Four people planning at a desk" } });
});

test("planApply patches an existing draft with a revision guard", () => {
  const { transactions } = planApply([item()], [page(), page({ _id: "drafts.page-1", _rev: "d1" })]);
  assert.equal(transactions[0].mutations.length, 1);
  assert.equal(transactions[0].mutations[0].patch.ifRevisionID, "d1");
});

test("planApply --live patches published and draft", () => {
  const { transactions } = planApply([item()], [page(), page({ _id: "drafts.page-1", _rev: "d1" })], { live: true });
  assert.deepEqual(transactions.map((transaction) => transaction.documentId), ["page-1", "drafts.page-1"]);
});

test("planApply never replaces an alt that was not approved or changed since the review", () => {
  const withAlt = page();
  withAlt.sections[0].image.alt = "Existing";
  assert.match(planApply([item()], [withAlt]).skipped[0].reason, /not approved to replace/);
  assert.match(planApply([item({ overwrite: true, currentAlt: "Older" })], [withAlt]).skipped[0].reason, /changed since the review/);
  assert.equal(planApply([item({ overwrite: true, currentAlt: "Existing" })], [withAlt]).transactions.length, 1);
});

test("planApply skips replaced images, no-ops and missing documents", () => {
  assert.match(planApply([item({ assetId: ASSET_B })], [page()]).skipped[0].reason, /replaced/);
  assert.match(planApply([item({ alt: "", decorative: true })], [page()]).skipped[0].reason, /already set/);
  assert.match(planApply([item({ documentId: "gone" })], [page()]).skipped[0].reason, /not found/);
  assert.match(planApply([item({ alt: "  " })], [page()]).skipped[0].reason, /empty alt/);
});

test("fallbackWarnings flags decorative images whose asset has alt text", () => {
  assert.equal(fallbackWarnings([item({ decorative: true, assetId: ASSET_B })], ASSETS).length, 1);
  assert.equal(fallbackWarnings([item({ decorative: true })], ASSETS).length, 0);
});

test("buildReport embeds the data safely", () => {
  const evil = page();
  evil.metadata.title = "</script><script>alert(1)</script>";
  const html = buildReport(manifestOf([evil]), { assets: {}, usages: {} }, { imageSrc: () => "images/x.jpg" });
  assert.equal(html.includes("</script><script>alert(1)"), false);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Download approved\.json/);
});
