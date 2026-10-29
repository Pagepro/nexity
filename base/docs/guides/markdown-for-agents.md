# Markdown for AI agents

Every public page has a Markdown twin. AI crawlers and agents (ChatGPT, Claude,
Perplexity, coding agents) read it instead of the HTML: no navigation, no scripts, no
class names, only what the page says. It complements `/llms.txt`, which lists every page
with a link to its Markdown.

## How a request gets there

| Request | Result |
|---|---|
| `GET /pricing.md` | Markdown of `/pricing` |
| `GET /index.md` (or `/.md`) | Markdown of the homepage |
| `GET /pricing` with `Accept: text/markdown` | Markdown of `/pricing` |
| `GET /pricing` with a browser `Accept` (`text/html,…,*/*;q=0.8`) | the HTML page, as before |
| `GET /logo.png` with `Accept: text/markdown` | the file, untouched |

1. `web/src/proxy.ts` runs `markdownRequestFor()` (`lib/markdown/negotiation.ts`) after
   basic auth. `text/markdown` must be listed explicitly with a q at least that of
   `text/html`, so `*/*` never triggers it. Paths with a file extension, `/api`, `/admin`,
   `/_next` and `/.well-known` are skipped.
2. The CMS redirects and rewrites run on the page's path (`/pricing`, not `/pricing.md`):
   - A redirect on this site keeps the Markdown: `/old.md` → `308 /new.md`. Through
     `Accept` the plain redirect is enough, since the client sends the same header again.
   - An internal rewrite serves the Markdown of its destination. An external one has no
     Markdown here: `.md` gets a Markdown 404, `Accept` gets the normal rewrite.
3. The proxy rewrites to `/api/markdown/<path>`
   (`app/api/markdown/[[...path]]/route.ts`), which calls `loadMarkdown()`
   (`lib/markdown/load-markdown.ts`).

Vercel runs the proxy before its cache, so a cached HTML page is never served to a
Markdown request, and vice versa.

## What the response looks like

```
Content-Type: text/markdown; charset=utf-8
Vary: Accept
X-Robots-Tag: noindex
X-Content-Type-Options: nosniff
Link: <https://example.com/pricing>; rel="canonical"
Cache-Control: public, max-age=300
```

```markdown
---
title: "Pricing"
description: "…"
url: https://example.com/pricing
published: 2026-04-02
updated: 2026-10-05
---

# Pricing

…the page's sections in render order…
```

- **`noindex` + canonical**: the HTML page is the one to index; this is its twin.
- **No `s-maxage`**: the Sanity reads carry the cache (tagged, purged by
  `/api/revalidate`), and an edge copy would outlive a `revalidateTag` (the edge
  sits in front of the Data Cache, so no tag purge reaches it).
- **404** is a Markdown body (`# Not found`), `no-store`. A Sanity failure is a `503`.
- **Published content only.** `fetchPublished` (`sanity/lib/fetch-published.ts`) never
  reads `draftMode()` and runs without stega, so an editor with preview on copies the
  live page, and no invisible stega characters reach the text.

Every HTML page announces its twin in the head, through `buildRobotsAndAlternates`
(`lib/seo-robots.ts`): `<link rel="alternate" type="text/markdown" href="…/x.md">`. It is
left out when the editor set a canonical pointing elsewhere.

## What goes into the Markdown

**The Markdown says what a visitor can see on the page**, including what sits behind a
toggle, a tab or a carousel, and nothing the page hides. In practice:

- The `#` title is the hero's headline when the page opens with a hero, else a leading
  `heading-1`, else the page's title. The promoted heading is not repeated. Section
  headings follow the tags `RichText` renders (`section-heading-lg` → `##`,
  `section-heading-md` → `###`), and `#` is reserved for the title.
- Hidden sections (`options.hidden`) are skipped. Shared sections are flattened in place.
  Global sections are included where the route renders them.
- **Images are never embedded.** An image with alt text becomes `[Image: alt]`; a
  decorative one (no alt) is left out.
- Interactive widgets are described with a `presenceHint`: `[Contact form; fields: …]`,
  `[Newsletter signup form (email); …]`, `[Interactive calculator. …]` plus the worked
  example the calculator opens with.
- Links are absolute URLs of the **HTML** pages (the canonical ones).
- Listing pages hold every item in one file, not page one: `/blog.md` lists every post
  with its meta line and excerpt. (Capped at 1000 per listing in `load-markdown.ts`.)
- Header, footer and the "related items" rails are left out.

Each document type has a template in `lib/markdown/documents.ts`: the catchall page,
post, case study, podcast episode, and the three listing pages.

## Adding or changing a section

Each section has a serializer next to its component, `ui/sections/<Name>/markdown.ts`,
registered in `SECTION_MARKDOWN_SERIALIZERS` (`lib/markdown/section-serializers.ts`). The
registry is `satisfies` the generated section union, so **a new section type fails
`pnpm typecheck` until it has an entry** (`null` only for `shared-section-ref`, which is
flattened first).

```ts
// ui/sections/FaqSection/markdown.ts
export const faqToMarkdown: SectionMarkdownSerializer<SectionData<"faq">> = (section, context) =>
  joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    ctaList(section.ctas, context),
    ...items.map((item) => joinBlocks([heading(3, markdownText(item.question)), paragraph(item.answer)])),
  ]);
```

The building blocks are in `lib/markdown/`: `blocks.ts` (`joinBlocks`, `heading`,
`paragraph`, `bulletList`, `textList`, `table`, `blockquote`, `imageHint`, `presenceHint`,
`labelLine`), `links.ts` (`linkHref`, `ctaLink`, `ctaList`), `escape.ts` (`markdownText`,
`cleanText`), `portable-text.ts`.

Rules:

- **Mirror the component.** If a layout hides the heading, hide it here. If the component
  renders literal copy (a listing heading, a unit like "reps"), move it to the section's
  `constants.ts` or a shared formatter and use it in both, so they can't drift.
- **Escape every CMS string** with `markdownText` (or a helper that does). `cleanText`
  alone is for values that end up in a URL or a condition.
- **Stay pure.** `import type` for anything from the component side, `@sanity/client/stega`
  instead of `next-sanity`, no React. The tests load these files with Node's type stripper.
- **A serializer that throws loses only its own section**; the page still renders.

### Portable Text

`portableTextToMarkdown` (`lib/markdown/portable-text.ts`) is our own serializer for all
three rich-text types. It merges decorators across spans (`**`, `*`, `~~`; the rest are
plain text), groups a link's spans into one `[text](url)`, nests lists, and renders the
custom blocks: `img` (alt text), `pullquote`, `callout`, `code`, `table`, `videoEmbed`,
`checklist`. A new `pageRichText` block needs a branch in `renderObjectBlock`; until then it
is skipped (with a dev warning).

## Testing

```bash
pnpm --filter @nexity/web test        # escape, Portable Text, negotiation, every gallery fixture, documents, llms.txt
curl -s localhost:3000/pricing.md
curl -s -H 'Accept: text/markdown' localhost:3000/pricing
curl -s -H 'Accept: text/html,*/*;q=0.8' -o /dev/null -w '%{content_type}\n' localhost:3000/pricing   # text/html
curl -sI localhost:3000/nope.md         # 404, text/markdown
```

`section-serializers.test.mts` runs every Sections Gallery fixture through its serializer
and checks key snippets per type. `src/proxy-markdown.test.mts` runs the real `proxy.ts`
against a stubbed redirect table: `.md` and `Accept` rewrites, redirects (`/old.md` →
`/new.md`), internal and external rewrites. The test runner gets `@/` and extensionless imports from
a small resolve hook (`web/scripts/test/register-resolve.mjs`).

To check a page by hand, compare `document.querySelector("main").innerText` in a browser with
its `.md`. Expected differences: breadcrumbs, the copy button, related items, pagination and
filter tabs are missing; listings carry every item with its excerpt; text behind a toggle (a
transcript, the yearly price) is present; images, logos and icons appear as their alt text.
Anything else is a serializer bug. Run the result through a CommonMark parser too: two
adjacent lists must stay two lists (`joinBlocks` switches the second one's bullet).

## The "Copy as Markdown" button

`ui/components/copy-markdown-button/` is on post, case-study and episode pages. It fetches
the page's `.md` on click (the Markdown is never in the HTML) and writes it to the
clipboard. A `ClipboardItem` built from the fetch promise keeps Safari's user-gesture
requirement; other browsers fall back to `writeText`. It adds about 1.2 KB gz to those
pages and nothing elsewhere.

## Later

- **`llms-full.txt`**: every document's full Markdown in one file, assembled from the
  same serializers. Not built yet.
- **`X-Markdown-Tokens`**: a token count header, if a consumer asks for it.
