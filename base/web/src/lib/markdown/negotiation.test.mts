import assert from "node:assert/strict";
import test from "node:test";

import {
  markdownPathFor,
  markdownRequestFor,
  markdownRoutePathFor,
  normalizeContentPath,
  prefersMarkdown,
} from "./negotiation.ts";

const BROWSER_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

test("prefersMarkdown: explicit text/markdown at least as preferred as HTML", () => {
  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("TEXT/Markdown; charset=utf-8"), true);
  assert.equal(prefersMarkdown("text/markdown, text/html;q=0.5"), true);
  assert.equal(prefersMarkdown("text/markdown;q=0.9, text/html;q=0.9"), true);
});

test("prefersMarkdown: browsers, wildcards and q=0 keep HTML", () => {
  assert.equal(prefersMarkdown(BROWSER_ACCEPT), false);
  assert.equal(prefersMarkdown("*/*"), false);
  assert.equal(prefersMarkdown("text/*"), false);
  assert.equal(prefersMarkdown("text/markdown;q=0"), false);
  assert.equal(prefersMarkdown("text/html, text/markdown;q=0.9"), false);
  assert.equal(prefersMarkdown("text/markdown;q=2"), false);
  assert.equal(prefersMarkdown(""), false);
  assert.equal(prefersMarkdown(null), false);
});

test("normalizeContentPath and the URL builders", () => {
  assert.equal(normalizeContentPath(""), "/");
  assert.equal(normalizeContentPath("/index"), "/");
  assert.equal(normalizeContentPath("pricing/"), "/pricing");
  assert.equal(normalizeContentPath("/blog/post//"), "/blog/post");
  assert.equal(markdownPathFor("/"), "/index.md");
  assert.equal(markdownPathFor("/blog/post/"), "/blog/post.md");
  assert.equal(markdownRoutePathFor("/"), "/api/markdown");
  assert.equal(markdownRoutePathFor("/a/b"), "/api/markdown/a/b");
});

test("markdownRequestFor: the .md suffix", () => {
  assert.deepEqual(markdownRequestFor("/pricing.md", BROWSER_ACCEPT), {
    contentPath: "/pricing",
    via: "suffix",
  });
  assert.deepEqual(markdownRequestFor("/index.md", null), {
    contentPath: "/",
    via: "suffix",
  });
  assert.deepEqual(markdownRequestFor("/.md", null), { contentPath: "/", via: "suffix" });
  assert.deepEqual(markdownRequestFor("/blog/post/.md", null), {
    contentPath: "/blog/post",
    via: "suffix",
  });
});

test("markdownRequestFor: Accept negotiation skips files and reserved paths", () => {
  assert.deepEqual(markdownRequestFor("/pricing", "text/markdown"), {
    contentPath: "/pricing",
    via: "accept",
  });
  assert.deepEqual(markdownRequestFor("/", "text/markdown"), {
    contentPath: "/",
    via: "accept",
  });
  assert.equal(markdownRequestFor("/pricing", BROWSER_ACCEPT), null);
  assert.equal(markdownRequestFor("/logo.png", "text/markdown"), null);
  assert.equal(markdownRequestFor("/llms.txt", "text/markdown"), null);
  assert.equal(markdownRequestFor("/api/og", "text/markdown"), null);
  assert.equal(markdownRequestFor("/admin/structure", "text/markdown"), null);
  assert.equal(markdownRequestFor("/.well-known/skill/SKILL.md", null), null);
});
