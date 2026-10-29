import assert from "node:assert/strict";
import test from "node:test";

import {
  blogListingPageToMarkdown,
  episodeToMarkdown,
  frontmatter,
  pageToMarkdown,
  podcastListingPageToMarkdown,
  postToMarkdown,
} from "./documents.ts";
import { testContext } from "./test-context.ts";

const block = (text: string, style = "normal", key = text) => ({
  _type: "block",
  _key: key,
  style,
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-span`, text, marks: [] }],
});

const META = {
  title: "SEO title",
  description: "A page.",
  url: "https://example.com/about",
};
const NO_GLOBALS = { before: [], after: [] };

type PageSections = Parameters<typeof pageToMarkdown>[0]["sections"];

test("frontmatter: quoted strings, ISO dates, empty fields left out", () => {
  assert.equal(
    frontmatter({
      title: 'Say "hi"',
      description: "",
      url: "https://example.com/x",
      published: "2026-05-22T10:00:00Z",
      updated: "not a date",
    }),
    '---\ntitle: "Say \\"hi\\""\nurl: https://example.com/x\npublished: 2026-05-22\n---',
  );
});

test("page: a hero headline becomes the # title and is not repeated", () => {
  const hero = {
    _type: "hero",
    _key: "h",
    pretitle: "Platform",
    content: [block("Ship faster", "section-heading-lg", "title"), block("Intro copy")],
    ctas: null,
  };
  const markdown = pageToMarkdown({
    meta: META,
    title: "About",
    sections: [hero] as unknown as PageSections,
    context: testContext,
  });
  assert.equal(
    markdown,
    '---\ntitle: "SEO title"\ndescription: "A page."\nurl: https://example.com/about\n---\n\n# Ship faster\n\n*Platform*\n\nIntro copy\n',
  );
});

test("page: without a hero, the page title is the # and section headings stay", () => {
  const text = {
    _type: "text-block",
    _key: "t",
    content: [block("Section", "section-heading-lg")],
    ctas: null,
  };
  const markdown = pageToMarkdown({
    meta: META,
    title: "About",
    sections: [text] as unknown as PageSections,
    context: testContext,
  });
  assert.ok(markdown.includes("# About\n\n## Section\n"), markdown);
});

test("page: no title anywhere falls back to the first headline, then to a placeholder", () => {
  const text = {
    _type: "text-block",
    _key: "t",
    content: [block("Pricing plans", "section-heading-lg")],
    ctas: null,
  };
  const withHeadline = pageToMarkdown({
    meta: { ...META, title: "" },
    title: null,
    sections: [text] as unknown as PageSections,
    context: testContext,
  });
  assert.ok(withHeadline.includes('title: "Pricing plans"'));
  assert.ok(withHeadline.includes("# Pricing plans\n"));
  assert.ok(!withHeadline.includes("## Pricing plans"));

  const empty = pageToMarkdown({
    meta: { ...META, title: "" },
    sections: [],
    context: testContext,
  });
  assert.ok(empty.includes("# Untitled page\n"));
});

test("page: a hidden first section does not take the title", () => {
  const hiddenHero = {
    _type: "hero",
    _key: "h",
    options: { hidden: true },
    content: [block("Hidden headline", "heading-1")],
  };
  const markdown = pageToMarkdown({
    meta: META,
    title: "About",
    sections: [hiddenHero] as unknown as PageSections,
    context: testContext,
  });
  assert.ok(markdown.includes("# About\n"));
  assert.ok(!markdown.includes("Hidden headline"));
});

test("post: meta line, excerpt, body, global sections around the body", () => {
  const post = {
    title: "Hello",
    publishedAt: "2026-09-12T08:00:00Z",
    author: { firstName: "Ada", lastName: "Lovelace" },
    excerpt: "Short.",
    coverImage: { alt: "Cover", image: null },
    body: [block("Body text")],
  };
  const globals = {
    before: [{ _type: "text-block", _key: "g1", content: [block("Before")], ctas: null }],
    after: [{ _type: "text-block", _key: "g2", content: [block("After")], ctas: null }],
  };
  const markdown = postToMarkdown({
    meta: META,
    document: post as never,
    globals: globals as never,
    context: testContext,
  });
  assert.ok(
    markdown.endsWith(
      "# Hello\n\n*Blog · September 12, 2026 · By Ada Lovelace*\n\nShort.\n\n[Image: Cover]\n\nBefore\n\nBody text\n\nAfter\n",
    ),
    markdown,
  );
});

test("episode: people, platforms, chapters and transcript", () => {
  const episode = {
    title: "Ep",
    episodeNumber: 3,
    publishedAt: "2026-10-07T08:00:00Z",
    durationMinutes: 38,
    summary: "Summary.",
    guest: { firstName: "Dana", lastName: "W", position: "CRO", company: "Finmo" },
    chapters: [{ _key: "1", timestamp: "00:00", title: "Intro" }],
    platformLinks: [
      { _key: "s", platform: "spotify", url: "https://open.spotify.com/x" },
    ],
    showNotes: [block("Notes")],
    transcript: [block("Words")],
    show: {
      title: "The Show",
      host: { firstName: "Mark", lastName: "R", position: null, company: null },
      platformLinks: [],
    },
  };
  const markdown = episodeToMarkdown({
    meta: META,
    document: episode as never,
    globals: NO_GLOBALS,
    context: testContext,
  });
  for (const snippet of [
    "*The Show · Ep. 3 · Oct 7, 2026 · 38 min*",
    "- Guest: Dana W (CRO, Finmo)\n- Hosted by: Mark R",
    "Listen on: [Spotify](https://open.spotify.com/x)",
    "## Chapters\n\n- 00:00 Intro",
    "Notes\n\n## Transcript\n\nWords",
  ]) {
    assert.ok(markdown.includes(snippet), `missing ${snippet}\n${markdown}`);
  }
});

test("blog listing: intro headline is the title, featured item, then every post", () => {
  const markdown = blogListingPageToMarkdown({
    meta: META,
    page: {
      title: "Blog",
      content: [block("The blog", "heading-2", "h"), block("Intro")],
    },
    featured: {
      _id: "f",
      title: "Featured post",
      slug: "featured",
      category: null,
      publishedAt: null,
      author: null,
      excerpt: null,
      coverImage: null,
    },
    sections: [
      {
        _type: "blog-listing",
        _key: "l",
        perPage: 6,
        posts: [
          {
            _id: "p",
            title: "Other",
            slug: "other",
            category: null,
            publishedAt: null,
            author: null,
            excerpt: null,
            coverImage: null,
          },
        ],
      },
    ] as never,
    context: testContext,
  });
  assert.ok(
    markdown.endsWith(
      "# The blog\n\nIntro\n\n## Featured\n\n- [Featured post](https://example.com/post/featured)\n\n## Latest articles\n\n- [Other](https://example.com/post/other)\n",
    ),
    markdown,
  );
});

test("podcast listing: the latest episode's own platforms, and its chapters only without artwork", () => {
  const featured = {
    _id: "e",
    title: "Latest",
    slug: "latest",
    episodeNumber: 14,
    publishedAt: null,
    durationMinutes: null,
    topic: null,
    summary: null,
    guest: null,
    chapters: [{ _key: "1", timestamp: "04:15", title: "The signal" }],
    platformLinks: [
      { _key: "s", platform: "spotify", url: "https://open.spotify.com/latest" },
    ],
    coverArt: null as unknown,
  };
  const render = (episode: typeof featured) =>
    podcastListingPageToMarkdown({
      meta: META,
      page: {
        title: "The Show",
        platformLinks: [
          { _key: "a", platform: "apple", url: "https://apple.example/show" },
        ],
      },
      featured: episode as never,
      sections: [],
      context: testContext,
    });

  const withoutArtwork = render(featured);
  assert.ok(
    withoutArtwork.includes(
      "## Latest episode\n\n- [Latest](https://example.com/podcast-episode/latest)\n  Ep. 14\n  Listen on: [Spotify](https://open.spotify.com/latest)\n  Chapters:\n  - 04:15 The signal",
    ),
    withoutArtwork,
  );
  const withArtwork = render({
    ...featured,
    coverArt: { image: { asset: { _id: "img" } } },
  });
  assert.ok(!withArtwork.includes("The signal"), withArtwork);
  // Without links of its own, the show's line above is enough.
  const showLinksOnly = render({ ...featured, platformLinks: [] });
  assert.equal(showLinksOnly.match(/Listen on:/g)?.length, 1, showLinksOnly);
});
