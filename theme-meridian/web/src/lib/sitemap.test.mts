import assert from "node:assert/strict";
import test from "node:test";

import { buildSitemapXml, SITEMAP_PATH, SITEMAP_REWRITE } from "./sitemap.ts";

test("the public /sitemap.xml is rewritten to a path that does not end in sitemap.xml", () => {
  assert.equal(SITEMAP_REWRITE.source, "/sitemap.xml");
  assert.equal(SITEMAP_REWRITE.destination, SITEMAP_PATH);
  assert.ok(!SITEMAP_PATH.endsWith("sitemap.xml"));
});

test("renders a urlset with loc, lastmod and priority", () => {
  assert.equal(
    buildSitemapXml([
      { url: "https://acme.com/", lastModified: "2026-11-04T12:29:30Z", priority: 1 },
      { url: "https://acme.com/blog/hello", lastModified: null, priority: 0.5 },
    ]),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "<url>",
      "<loc>https://acme.com/</loc>",
      "<lastmod>2026-11-04T12:29:30Z</lastmod>",
      "<priority>1</priority>",
      "</url>",
      "<url>",
      "<loc>https://acme.com/blog/hello</loc>",
      "<priority>0.5</priority>",
      "</url>",
      "</urlset>",
      "",
    ].join("\n"),
  );
});

test("escapes XML special characters in URLs", () => {
  assert.match(
    buildSitemapXml([{ url: "https://acme.com/a?x=1&y=<2>" }]),
    /<loc>https:\/\/acme\.com\/a\?x=1&amp;y=&lt;2&gt;<\/loc>/,
  );
});

test("an empty list is still a valid urlset", () => {
  assert.match(buildSitemapXml([]), /<urlset [^>]+>\n<\/urlset>\n$/);
});
