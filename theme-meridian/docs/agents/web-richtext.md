# RichText block styles and typography

The CMS type scale and custom RichText blocks. Indexed from [`web/AGENTS.md`](../../web/AGENTS.md); the short version of each rule is there, the full one is here.

## RichText Block Styles & Typography

The CMS uses block styles to control text sizing. Block styles are **not** CSS
presets anymore — each maps to a Tailwind utility string in
`web/src/ui/RichText/block-styles.ts` (Figma "Meridian" type scale, Mona Sans).

The Studio editor previews these block styles via a static stylesheet
(`studio/src/sanity/schemaTypes/objects/richText/editor.css`, imported in
`studio/src/sanity/config.ts`) that mirrors this scale. **When changing a size
here, update `editor.css` to match** so the editor preview stays accurate.
The block-style **keys** (`heading-1`, `body-2`, `alt-body-3`, …) are content
identifiers and never change. **Always verify the correct block style before
seeding content.**

**Body text (most body copy is `body-3`, NOT `body-1`):**

| Block style | Utility string (mobile → md) |
|---|---|
| `body-1` | `text-16 md:text-18` (16px → 18px) — large intro text |
| `body-2` | `text-16` (16px) — medium body text |
| `body-3` | `text-14 md:text-16` (14px → 16px) — **standard body text** |
| `body-4` | `text-12 md:text-14` (12px → 14px) — small/meta text |
| `body-5` | `text-12` (12px) — smallest text |

**Headings** (`font-medium`, tight leading; Figma scale tops out at 44px):

| Block style | Utility string (mobile → md) |
|---|---|
| `heading-1` | `text-36 md:text-44` (36 → 44px) — hero headline |
| `heading-2` | `text-30` (30px) — section title (matches Figma `text-3xl`) |
| `heading-3` | `text-28 md:text-30` (28 → 30px) |
| `heading-4` | `text-22 md:text-24` (22 → 24px) |
| `heading-5` | `text-18 md:text-20` (18 → 20px) |
| `heading-6` | `text-16 md:text-18` (16 → 18px) |

`alt-heading-*` / `alt-body-*` render at the **same** size as their numbered peer
(single Mona Sans font — the former Inter `alt-*` ladder was collapsed).

**Section headings** (`simpleRichText` only — the section text type) expose the
design-system "Custom Text Styles" scale so section titles match the Figma type
tokens. Prefer these for section titles over the numbered `heading-*` list:

| Block style | Utility string (mobile → md) | Figma custom token | Tag |
|---|---|---|---|
| `section-heading-xl` | `text-36 md:text-44` (36 → 44px) | `heading-xl` (44) | `<h2>` |
| `section-heading-lg` | `text-30 md:text-36` (30 → 36px) | `heading-lg` (36) | `<h2>` |
| `section-heading-md` | `text-22 md:text-24` (22 → 24px) | `heading-md` (24) | `<h3>` |
| `section-heading-sm` | `text-18 md:text-20` (18 → 20px) | `heading-sm` (20) | `<h4>` |

`section-heading-lg` (36px) is the canonical **section-title** size — the numbered
`heading-*` ladder tops a section title out at `heading-2` = 30px, which is off the
custom scale. Defined in `block-styles.ts` `SECTION_HEADING_STYLES`; dropdown
entries in `styles.tsx` `SECTION_HEADING_STYLES`.

**Inline decorators:** `strong` (font-bold), `light` (font-light), `medium` (font-medium)

**Key rules:**
- **Never select block styles by mobile size alone.** `heading-1` and `heading-2` share a tight leading but diverge in size — compare the full breakpoint progression against the design.
- `normal` block style = `body-2` (standard 16px) — still specify the intended style explicitly.
- `.richtext` base styles: `space-y-4` (paragraph spacing), `text-muted-foreground` (#78716c stone body copy, per Figma), `strong { color: foreground }` (bold stays full strength). Heading block styles (`heading-*`) opt back into full `text-foreground` so titles aren't muted.
- **Vertical rhythm inside a `<RichText>` body lives on `.richtext-flow`** (the component's root, `app.css`), not on `.richtext`: sections also use `.richtext` as a flex wrapper, so changing it moves section layouts. **One rhythm for every RichText** (hero intro, blog post, case study, legal page, show notes) — no per-page modifier class: 16px between text blocks, paragraphs and lists alike, and from a heading to whatever follows it (the hero's heading-to-intro gap), 48/64px above an h1/h2/h3 that isn't first (mobile/desktop; `heading-2` and `heading-3` both render at 30px, so the gap can't depend on which one the editor picked), 32px above an h4–h6, 10px between list items and above a nested list (16px when items carry a title, a line break and a description: `hasMultilineItems` in `RichText/utils.ts`, the same split as `RichTextChecklist`'s `hasDescriptions`), and 32px around an embed (16px right under a heading). A legal page built from `heading-3` + lists must space out exactly like a blog post built from `heading-2` + paragraphs. Empty paragraphs keep their `min-height` and add a blank line: that's content, remove them in the Studio. **A block renderer never sets its own outer margin**: its root gets `richtext-embed` (see `RichTextTable.tsx`). A `my-8` on a renderer sits in the utilities layer and overrides the flow, which is how a checklist under a heading ended up 32px away from it. Lists (`ul`/`ol`) carry no `mt-*` either. **Lists and `RichTextChecklist` look the same** (Oct 2026): body-3 text (`text-14 md:text-16`) at `leading-relaxed`, the item gaps above, and 8px under a title (12px from title to description glyphs). In a list that title is an item written as bold title + Shift+Enter + description (`isTitledItem` → `richtext-titled-item`); in the checklist it's `gap-2` between the title and description `<p>`s, whose `leading-relaxed` must sit on the `<p>` itself, since `.richtext p` sets its own line-height in the base layer and beats an inherited one. 32px leading was tried on both and read too loose. The gap sits on the title as an `inline-block` margin: hiding the `<br>` and making the title a block left the space typed before the break as an indent. Change lists and the checklist together.
- `.pretitle` class (kept in `app.css`): `text-10 font-medium uppercase` + `letter-spacing: 0.2em` + `text-foreground/50` — used for pretitle fields, not RichText
- When designs use small headings (16px h2, 14px h3), map them to bold body text (`body-2` + strong, `body-3` + strong) rather than heading-* styles.

### Custom RichText blocks (`pageRichText` objects)

`pageRichText` supports custom block objects beyond text/lists (image, pullquote, callout, code, table, video embed, checklist). To add a new one:

1. **Schema** — one file per object under `studio/.../objects/richText/blocks/`; register it in `schemaTypes/index.ts` and add `defineArrayMember({ type: "<name>" })` to `pageRichText.ts` `of`. (Plugin types like `code` from `@sanity/code-input` / `table` from `@sanity/table` are referenced by type name; register the plugin in `config.ts`.)
2. **GROQ** — add a branch to `RICHTEXT_QUERY` (`web/src/sanity/lib/queries.ts`) for blocks that contain nested images/portable text/CTAs (e.g. `_type == 'pullquote' => { ..., avatar { ${IMAGE_FRAGMENT} } }`). Blocks with only scalar fields (code, table, checklist) are covered by the leading `...,`. **Never self-reference `RICHTEXT_QUERY` inside its own definition** (it's `undefined` at that point) — for nested rich text reuse the extracted `MARKDEFS_QUERY` const instead.
3. **Renderer** — one file per block in `web/src/ui/RichText/` (per `feedback_modular_sections`), registered in `components.types` (or `components.marks`) in `RichText/index.tsx`. Type the `value` prop with a local interface in `RichText/types.ts`.
4. **`pageRichText` is shared with `post.body`** — new blocks are additive (blog posts gain them too). Re-run typegen and smoke-test a blog post for regressions.

**CRITICAL — wrap Client Components.** PortableText forwards a non-serializable `renderNode` function prop to every registered renderer. A Server Component renderer can be registered by reference; a `"use client"` renderer **must** be wrapped so only serializable props cross the boundary, e.g. `videoEmbed: ({ value }) => <RichTextVideo value={value} />` (and `link: ({ children, value }) => <RichTextLink value={value}>{children}</RichTextLink>` for marks). Registering a Client Component by bare reference crashes the render with *"Functions cannot be passed directly to Client Components"* (HTTP 500, often after partial HTML streams — check the status code, not just the body).
