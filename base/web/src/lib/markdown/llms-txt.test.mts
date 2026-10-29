import assert from "node:assert/strict";
import test from "node:test";

import { buildLlmsTxt } from "./llms-txt.ts";

const urlFor = (document: {
  _type?: string | null;
  metadata?: { slug?: { current?: string | null } | null } | null;
}) => {
  const slug = document.metadata?.slug?.current;
  if (document._type === "blog-listing-page") return "https://example.com/blog.md";
  if (!slug) return null;

  return slug === "/"
    ? "https://example.com/index.md"
    : `https://example.com/${document._type}/${slug}.md`;
};

test("llms.txt: title, summary, groups, Markdown links and descriptions", () => {
  const body = buildLlmsTxt(
    {
      site: { title: "Acme", description: "Acme sells\nanvils." },
      pages: [
        {
          _type: "page",
          title: "Home",
          metadata: { slug: { current: "/" }, title: null, description: "Start here" },
        },
        { _type: "page", title: "No slug", metadata: { slug: null } },
      ],
      listings: [
        {
          _type: "blog-listing-page",
          title: "Blog",
          metadata: { title: "The blog", description: null },
        },
      ],
      posts: [
        {
          _type: "post",
          metadata: { slug: { current: "hi" }, title: "Hi [there]", description: null },
          summary: "Excerpt",
        },
      ],
      caseStudies: [],
      episodes: null,
    },
    urlFor,
  );

  assert.equal(
    body,
    [
      "# Acme",
      "> Acme sells anvils.",
      "Every page below is also served as Markdown: add `.md` to its URL (the homepage is `/index.md`) or request it with `Accept: text/markdown`. Listing pages hold every item in one file.",
      "## Pages\n\n- [Home](https://example.com/index.md): Start here",
      "## Blog\n\n- [The blog](https://example.com/blog.md)\n- [Hi \\[there\\]](https://example.com/post/hi.md): Excerpt",
    ].join("\n\n") + "\n",
  );
});

test("llms.txt: empty data still names the site", () => {
  assert.ok(buildLlmsTxt({}, () => null).startsWith("# Website\n"));
});
