import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRobotsAndAlternates,
  markdownAlternateFor,
  resolveIsIndexable,
} from "./seo-robots.ts";

const URL = "https://example.com/about";
const MARKDOWN_TYPES = { "text/markdown": "https://example.com/about.md" };

test("resolveIsIndexable: explicit false blocks everywhere", () => {
  assert.equal(
    resolveIsIndexable({ isIndexableFlag: "false", deploymentEnv: "production" }),
    false,
  );
  assert.equal(
    resolveIsIndexable({ isIndexableFlag: " FALSE ", deploymentEnv: "production" }),
    false,
  );
});

test("resolveIsIndexable: preview/development never indexable", () => {
  assert.equal(
    resolveIsIndexable({ isIndexableFlag: "true", deploymentEnv: "preview" }),
    false,
  );
  assert.equal(resolveIsIndexable({ deploymentEnv: "development" }), false);
});

test("resolveIsIndexable: unset flag is indexable only on Vercel production", () => {
  assert.equal(resolveIsIndexable({ deploymentEnv: "production" }), true);
  assert.equal(resolveIsIndexable({}), false);
  assert.equal(
    resolveIsIndexable({ isIndexableFlag: "", deploymentEnv: undefined }),
    false,
  );
});

test("resolveIsIndexable: explicit true opts a non-Vercel host in", () => {
  assert.equal(resolveIsIndexable({ isIndexableFlag: "true" }), true);
  assert.equal(
    resolveIsIndexable({ isIndexableFlag: "true", deploymentEnv: "production" }),
    true,
  );
});

test("buildRobotsAndAlternates: indexable page with no directives", () => {
  assert.deepEqual(buildRobotsAndAlternates({}, URL, { isIndexable: true }), {
    robots: { index: undefined, follow: undefined },
    alternates: { canonical: URL, types: MARKDOWN_TYPES },
  });
});

test("buildRobotsAndAlternates: noIndex and noFollow are independent", () => {
  assert.deepEqual(
    buildRobotsAndAlternates({ noIndex: true }, URL, { isIndexable: true }).robots,
    { index: false, follow: undefined },
  );
  assert.deepEqual(
    buildRobotsAndAlternates({ noFollow: true }, URL, { isIndexable: true }).robots,
    { index: undefined, follow: false },
  );
});

test("buildRobotsAndAlternates: the site switch outranks the CMS fields", () => {
  assert.deepEqual(
    buildRobotsAndAlternates({ noIndex: false, noFollow: false }, URL, {
      isIndexable: false,
    }).robots,
    { index: false, follow: false },
  );
  assert.deepEqual(buildRobotsAndAlternates(null, URL, { isIndexable: false }).robots, {
    index: false,
    follow: false,
  });
});

test("buildRobotsAndAlternates: canonical override wins, blank falls back", () => {
  const override = "https://other.example/original";
  assert.equal(
    buildRobotsAndAlternates({ canonical: override }, URL, { isIndexable: true })
      .alternates?.canonical,
    override,
  );
  assert.equal(
    buildRobotsAndAlternates({ canonical: "  " }, URL, { isIndexable: true }).alternates
      ?.canonical,
    URL,
  );
  assert.deepEqual(
    buildRobotsAndAlternates(null, undefined, { isIndexable: true }).alternates,
    {},
  );
});

test("buildRobotsAndAlternates: hreflang becomes languages, incomplete entries dropped", () => {
  const { alternates } = buildRobotsAndAlternates(
    {
      hreflang: [
        { hreflang: "en", href: "https://example.com/about" },
        { hreflang: "de-DE", href: "https://example.de/uber" },
        { hreflang: "fr", href: null },
        { hreflang: null, href: "https://example.fr" },
        null,
      ],
    },
    URL,
    { isIndexable: true },
  );
  assert.deepEqual(alternates, {
    canonical: URL,
    languages: { en: "https://example.com/about", "de-DE": "https://example.de/uber" },
    types: MARKDOWN_TYPES,
  });
});

test("buildRobotsAndAlternates: the Markdown alternate follows the page, not a foreign canonical", () => {
  assert.equal(
    buildRobotsAndAlternates({ canonical: "https://other.example/original" }, URL, {
      isIndexable: true,
    }).alternates?.types,
    undefined,
  );
  assert.deepEqual(
    buildRobotsAndAlternates({ canonical: URL }, URL, { isIndexable: true }).alternates
      ?.types,
    MARKDOWN_TYPES,
  );
  // A noindex page still has a Markdown twin; the twin itself is always noindex.
  assert.deepEqual(
    buildRobotsAndAlternates({ noIndex: true }, URL, { isIndexable: true }).alternates
      ?.types,
    MARKDOWN_TYPES,
  );
});

test("markdownAlternateFor: homepage, trailing slash, query and hash", () => {
  assert.equal(
    markdownAlternateFor("https://example.com/"),
    "https://example.com/index.md",
  );
  assert.equal(
    markdownAlternateFor("https://example.com"),
    "https://example.com/index.md",
  );
  assert.equal(
    markdownAlternateFor("https://example.com/blog/post/?a=1#top"),
    "https://example.com/blog/post.md",
  );
  assert.equal(markdownAlternateFor("not a url"), undefined);
});
