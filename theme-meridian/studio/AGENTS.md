# Studio Package — AGENTS.md

Rules for the Sanity Studio package (`studio/`). Schemas defined here are shared with the `web/` package via `@meridian/studio`.

## Schema Files

- Schemas live in `studio/src/sanity/schemaTypes/` — organized as:
  - `documents/` — Page, header, footer, site settings, etc.
  - `objects/` — CTA, link, image (img), metadata, section-options, etc.
  - `sections/` — One file per section type
  - `fragments/` — Reusable field fragments (e.g., sections array definition)
  - `partials/` — Shared partial schemas (e.g., linkBaseSchema)
- All schemas registered in `studio/src/sanity/schemaTypes/index.ts`
- Structure config: `studio/src/sanity/structure.tsx`
- Presentation config: `studio/src/sanity/presentation.ts`

## Schema Rules

### Fundamentals

- **Always** use `defineType`, `defineField`, `defineArrayMember`
- Every schema file exports a named `const` that matches the filename
- Use `camelCase` for `name` values
- Only include a `title` if the `name` value is abbreviated or a capitalized version reads better
- Include brief, useful `description` values if the field intention is not obvious

### Field Rules

- Every `string` field with `options.list` under 5 options must set `options.layout: "radio"`
- Every `image` field must include `options.hotspot: true`
- Every image field (`type: "image"` or `type: "img"`) must state the recommended size and aspect ratio in its `description`, derived from how the web component actually renders it (its `aspect-[...]` class and `sizes` prop). Format: `"… Aspect ratio 16:9, recommended 2560×1440px (landscape)."`. When the dimensions vary by a sibling layout field, list each case. Social/OG images use 1.91:1, 1200×630px.
- **Avoid `boolean` fields** — use `string` with `options.list` instead
- **Never write single reference fields** — always use an array of references
- Include `rule.warning()` for fields that benefit from length guidance
- Include validation errors in `rule.required().error('<Message>')` that explain why the field matters
- Consider field order: most important first, least-used last

### Decorating Schemas

Every `document` and `object` schema type should:
- Have an `icon` property — prefer `react-icons/vsc`, fall back to `@sanity/icons`
- Have a customized `preview` property showing rich contextual details
- Use `groups` when there are many fields — group related fields together
- Use `fieldsets` with `options: { columns: 2 }` for visually related pairs (e.g., `startDate` + `endDate`)

### Section Schemas

- **Listing sections are pure grids** — always-present content (title, intro text) belongs on the listing page document, not inside the listing section. Sections are for optional, reorderable blocks.
- `section-options` is **always the first field**
- Use groups: `[{ name: "content", default: true }, { name: "options" }]`
- Assign every field to a group
- Add an icon from `@sanity/icons` or `react-icons`

```typescript
import { defineField, defineType } from "sanity";
import { VscSymbolMisc } from "react-icons/vsc";

export default defineType({
  name: "section-name",
  title: "Section Name",
  icon: VscSymbolMisc,
  type: "object",
  groups: [{ name: "content", default: true }, { name: "options" }],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    // content fields with group: "content"
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Section Name",
      subtitle: "Section Name",
    }),
  },
});
```

### CTA vs Link Type

- **`cta` type** (variant + link + buttonIcon) — when editors choose the visual style
- **`link` type** — when button styling is hardcoded in the component; editors only control label and destination
- Ask: "Does the editor control how this button looks?" No → `link` type.

### CTAs Array Pattern

```typescript
defineField({
  name: "ctas",
  title: "Call-to-actions",
  type: "array",
  of: [{ type: "cta" }],
  group: "content",
}),
```

### Reusable Types

Use existing registered types: `img`, `link`, `cta`, `section-options`. Only create new object types when none of the existing ones fit. An object used by more than one document type is registered as its own named type, never repeated inline.

### Custom Input Components

Colocate with the schema type file. Use a folder: `{typeName}/index.ts` for the schema, adjacent files for input components.

## Rich Text Types

Three rich text types exist, each for a different context. All render in the
single **Mona Sans SemiExpanded** font (the former Poppins/Inter split was
removed — `alt-*` block styles now map to the same size as their
`heading-*`/`body-*` peer; see `web/src/ui/RichText/block-styles.ts`):

| Type | Block styles | Lists | Use for |
|---|---|---|---|
| `richText` | `alt-heading-*`, `alt-body-*` (= same size as `heading-*`/`body-*` peer) | bullet, number | Content sections — `alt-*` style keys kept for existing content |
| `simpleRichText` | `heading-*`, `body-*` | none | UI section text (heroes, text-blocks) — short copy without lists |
| `pageRichText` | `heading-*`, `body-*` | bullet, number | Text-heavy pages (legal, about, articles) — long-form with lists |

**When choosing a rich text type for a new section:**
- Does the content need lists? → `pageRichText`
- Short copy, no lists? → `simpleRichText`
- Reusing existing `alt-*`-keyed content? → `richText` (no separate font anymore)

**Create a new rich text type only when** existing types can't serve the need without breaking existing content. Prefer reusing over fragmenting.

### Editor preview of block styles

Block styles are **not** CSS classes — `RawTextRenderer` (`objects/richText/styles.tsx`) emits `<div class="{styleKey}">` (e.g. `class="heading-1"`), and the frontend turns those *keys* into Tailwind utility strings at render time (`web/src/ui/RichText/block-styles.ts`). The keys have **no matching CSS** anywhere, so the editor would show every style at the same flat size. A static **`objects/richText/editor.css`** (imported once in `config.ts`, so it covers both the standalone and embedded `/admin` studios) defines `.heading-*`/`.body-*` with plain CSS mirroring the frontend scale to restore the preview. **When you change a size/weight in `block-styles.ts`, update `editor.css` to match** (kept in sync by convention — it's preview-only, low stakes).

## Content Modelling Philosophy

- Model for what things **are**, not what they **look like** — e.g., use `status` instead of `color`
- CTA/field names must be consistent end-to-end: schema field name → GROQ query field name → frontend prop name (e.g., `variant` everywhere, never aliased to `style`)
- Any `string` value that is used in UI conditions needs to be wrapped with `stegaClean` on the frontend

## Writing Content for Import (ndjson)

When writing seed content:
- Write as `.ndjson` file at the root of the project; write the file itself, not a script that generates it
- Never include a `.` in the `_id` field unless the document needs to be private
- Never include image references — use placeholder format:
  ```json
  {"_type":"image","_sanityAsset":"image@https://picsum.photos/seed/[[DOCUMENT_ID]]/1920/1080"}
  ```
- Import with: `npx sanity dataset import <filename.ndjson>`
- Before writing a custom script against the project, check whether the Sanity CLI already does it (`npx sanity --help`)

## Structure Helpers (`studio/src/sanity/lib/structure.tsx`)

Three helpers add "Preview" (inline draft-mode iframe via `sanity-plugin-iframe-pane`, desktop/mobile toggle + reload), "Open In Visual Editor" and "Open on the Website" view tabs to document editors. The iframe origin mirrors `presentation.ts` via `lib/preview-origin.ts`: in dev it is `SANITY_STUDIO_APP_URL` / `NEXT_PUBLIC_BASE_URL` (fallback `http://localhost:3000`), `same-origin` in production (embedded `/admin`).

| Helper | Use for | Slug resolution |
|---|---|---|
| `createDocumentListWithPreview` | Page-like documents with `metadata.slug.current` | `metadata.slug.current` |
| `createSingletonWithPreview` | Listing page singletons (e.g., blog-listing-page) — must be registered in `singletons.ts` first | Fixed URL (e.g., `/blog`) |
| `createDocumentListWithSlugPrefix` | Detail documents under a prefix (e.g., post → `/blog/:slug`) | `slug.current` prefixed |

**Every document type that has a frontend route must use one of these helpers** — otherwise editors won't see the "Open In Visual Editor" tab. Plain `S.editor()` or `S.documentTypeListItem()` don't include preview views.

Example — listing + detail group:
```typescript
group(S, "Blog", [
  // Title, icon and document id come from the `singletons.ts` definition.
  createSingletonWithPreview(S, { id: "blogListingPage", previewSlug: "/blog" }),
  S.listItem()
    .title("Posts")
    .schemaType("post")
    .child(
      createDocumentListWithSlugPrefix(S, {
        title: "Posts",
        type: "post",
        slugPrefix: "/blog",
      }),
    ),
]),
```

## Singletons (`studio/src/sanity/singletons.ts`)

> ⚠️ **Beta API — may change.** We use Sanity's first-class singletons API, released as **beta in Studio 6.17.0** (Sept 2026). Sanity says it will be stabilised in an upcoming release, so method names, config shape, or behaviour can still change. **Before bumping `sanity`, read the Studio changelog for singleton changes, then re-run the singleton checks** (structure items open the existing docs, "Singleton" badge, nothing in the "+" create menu, listing-page preview tabs).

Single-document types (`site`, `header`, `footer`, the listing pages) use Sanity's **native singleton API** (Studio 6.17+, beta): one `defineSingleton({ documentId, schemaType, title, icon })` per document in `SINGLETONS`, passed to `document.singletons` in `config.ts`. Studio then hides the type from every create menu, removes `duplicate`, and shows a "Singleton" badge. **Don't hand-roll** template filters for this. Surface it in `structure.tsx` with `S.listItem().singleton(id)`, or `createSingletonWithPreview` when it has a public URL.

- **`documentId` is the live `_id` the web app queries by** (`header`, `footer`, `site`, `blogListingPage`, `caseStudiesListingPage`). Never rename one without migrating the document.
- **Delete and Unpublish are blocked** for every singleton by the `document.actions` filter in `config.ts` (`SINGLETON_BLOCKED_ACTIONS` in `singletons.ts`). The native API only drops `duplicate`, and a deleted or unpublished header/footer/site or listing page breaks the production build. Use `context.singleton` (the documented hook) to do this; don't filter by type name.
- **Missing document (new project / fresh dataset):** the structure item still opens. Studio shows an empty "New …" form bound to the fixed `documentId`, the first edit creates the draft under that `_id`, and Publish creates the document. Blocking Delete/Unpublish doesn't affect this. Until `site`, `header` and `footer` (and a page with slug `/`) are **published**, the frontend layout renders the Next steps screen instead of the site (`getSetupStatus()` → `web/src/ui/getting-started/`); it no longer crashes the build. A missing listing-page singleton still 404s its route. `pnpm seed` imports them with the Meridian demo dataset (`seed/README.md`).
- `S.documentTypeListItems()` excludes singleton types automatically — no manual `filter()`.

## After Schema Changes

Always regenerate types:
```bash
pnpm --filter @meridian/web ts:typegen
```

### Restart running dev servers — schema is not hot-reloaded

A Studio process started **before** a schema change does not pick up new types reliably. This bites hardest when you **add a new section type**: a Studio running the old schema does not recognize it, and **silently strips the unknown section from any document it saves/syncs** — so freshly-seeded content "disappears" and the document shows fewer sections than expected.

After adding or renaming a schema type:
1. **Restart the Studio** (`pnpm dev:studio` and/or reload `/admin`) so it loads the new type. Locally prefer the standalone Studio on `:3333`: it reloads faster than `/admin`, which goes through Next.js. Production serves only `/admin`.
2. **Restart the web dev server** (`pnpm dev:web`) so it reloads `SECTION_MAP` (`map.ts`) and the `SECTION_BRANCHES_QUERY` GROQ branch.
3. Only **then** seed/edit documents that use the new type. If a doc was already touched by the stale Studio, re-seed it.

Debugging "missing content": query the dataset directly and compare perspectives (`raw` / `drafts` / `published`) before assuming an HMR/build problem — in dev the frontend reads `drafts`, while seed scripts write `published`. A Studio still running an old schema also strips unknown section types on save, so restart it after adding a section.

### Creating Reusable Fragment Types

For reusable fragment types (link, image, etc.):
1. Add field to `studio/src/sanity/schemaTypes/documents/__type-source.ts`
2. Create fragment file in `web/src/sanity/lib/fragments/` with a `defineQuery` query against `internal.typeSource`
3. Export type alias from `web/src/types/fragments.ts` using `NonNullable<QueryResult>`
