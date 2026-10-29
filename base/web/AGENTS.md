# Web Package — AGENTS.md

Rules for the Next.js 16 frontend application (`web/`). Before any change a visitor sees, read the root [`DESIGN.md`](../DESIGN.md) (how it looks) and [`BRAND.md`](../BRAND.md) (what it says); this file is how to build it.

## React & Next.js

- Server components by default. `"use client"` rules live in "Client Code & Performance" below
- Use `Suspense` for async operations and components using `useSearchParams`
- Use `useActionState` instead of deprecated `useFormState`
- Use arrow function components (`const X = () => {}`)
- Use named exports for components
- Use `clsx` for conditional class names, `tailwind-merge` via `cn()` for merging — `cn()` only in server components (in client code it ships tailwind-merge; see "Client Code & Performance")
- No `prop-types` — use TypeScript interfaces
- Use `const` instead of `function` for component and helper definitions

### Async Request APIs (Next.js 16)

```typescript
const cookieStore = await cookies()
const headersList = await headers()
const { isEnabled } = await draftMode()
const params = await props.params
const searchParams = await props.searchParams
```

## Client Code & Performance

`pnpm lint` runs `pnpm check:client`, which enforces the mechanical rules. Server first; `"use client"` only on the interactive leaf. Never import `RichText`, `FeatureIcon`, `@sanity/client`, `<Image>`, `ButtonLink` or `cn()` into client code: render them on the server and pass a `ReactNode`. Section client code goes through `client-lazy.tsx`. Measure JS per page against `main` before calling a change faster.

**Read [`../docs/agents/web-client-performance.md`](../docs/agents/web-client-performance.md) before adding or changing client code**: every rule, the experiments that were measured and rejected, and how to measure.

## Markdown for AI agents (`lib/markdown/`)

Every page has a Markdown twin at `/x.md` (and at `/x` with `Accept: text/markdown`): `proxy.ts` rewrites it to `/api/markdown/x`, which reads the page with the same queries as the HTML route and serializes it. Full guide: `docs/guides/markdown-for-agents.md`.

- **A section's Markdown lives next to it** in `ui/sections/<Name>/markdown.ts`, registered in `SECTION_MARKDOWN_SERIALIZERS`. Change what a section renders → change its `markdown.ts` in the same PR (a new field, a layout that hides content, a literal heading). Literal copy shared by both goes in `constants.ts`.
- **Serializers are pure** (data in, string out): `import type` from component files, `@sanity/client/stega` instead of `next-sanity`, no React. `pnpm test` loads them with Node's type stripper plus a resolve hook (`scripts/test/register-resolve.mjs`, `@/` and extensionless imports) and runs every gallery fixture through its serializer.
- **The Markdown route reads published content only** (`fetchPublished`, never `draftMode()`, no stega), with the HTML route's cache tags. Never give it a long `s-maxage`.
- **Internal links in Markdown are absolute HTML URLs**, built by `server-context.ts` from `resolveUrl`; never hand-build `BASE_URL + slug`.

## Section Component Structure

Simple sections (no interactivity) need only `index.tsx` + `types.ts`. Complex/interactive sections use modular file structure:

- `index.tsx` — Server component wrapper (with `<Suspense>` if using `useSearchParams`)
- `client.tsx` — `"use client"` orchestration (state, effects, event handlers)
- `client-lazy.tsx` — `"use client"` + `dynamic(() => import("./client"))`; the only way `index.tsx` imports the client part (see "Client Code & Performance")
- `types.ts` — `ExtractSectionProps` type
- `constants.ts` — Shared constants and config arrays
- `utils.ts` — Pure helper functions
- `{sub-component}.tsx` — One file per visual sub-component (kebab-case)

All files in the same section folder — no nested subdirectories. Reference: `web/src/ui/sections/BlogListingSection/` for the full pattern.

## Client-Side Query String State

For filtering/pagination with URL query strings, use `useState` + `window.history.pushState` (instant) instead of `router.push` (triggers server navigation, causes noticeable delay). Read initial state from `useSearchParams()` on mount, then manage locally. Listen to `popstate` for browser back/forward support.

## Images & Links

Always `<Image>` for images and `<BaseLink>` (or its variants) for links; never nest `<a>` inside `BaseLink`. `<Image fill>` needs a `relative` parent. Preload only the one LCP candidate, set at the call site, never from the CMS. GROQ image arrays use `IMAGE_FRAGMENT`. Wrap Sanity strings used in logic (conditions, class names) in `stegaClean()`; rendered text doesn't need it.

**Read [`../docs/agents/web-images-links.md`](../docs/agents/web-images-links.md) before touching images or links**: sizes and priority, placeholders, link types, `stegaClean`.

## GROQ Queries

- Wrap all queries in `defineQuery` from `groq` (required for type generation)
- Use `SCREAMING_SNAKE_CASE` for query constant names
- Do not use image expansion in GROQ unless explicitly needed — reference only
- Fragments: use string interpolation for reuse
- GROQ field names must match the Sanity schema field names exactly — never alias or rename (e.g., if the schema field is `variant`, the query must fetch `variant`, not `style`)
- Write every required attribute in a projection when writing a query
- Use parameters (`$slug`, `$locale`) for variables — never string interpolation for dynamic values
- Use `defined(field)` before accessing optional fields
- **Every routed document's query interpolates `STRUCTURED_DATA_FRAGMENT`** (`@/sanity/lib/fragments/structured-data`) at the document level, next to `metadata { ${METADATA_FRAGMENT} }` and never inside it. It carries `schemaPageType` / `schemaArticleType` from the Studio's "Structured Data" tab and `_createdAt`/`_updatedAt` for the `WebPage` node. If a route forgets it, the field projects `null` and the page silently inherits the site default. The JSON-LD graph is built by `buildRouteGraph` (`@/lib/schema-org/route-graph`) from data the route already fetched, with `getSiteSchema()` in the route's existing `Promise.all`, and rendered by `<StructuredData>` (`@/ui/components/structured-data`). The graph is `null` (no script) when `IS_INDEXABLE` is off or the page is `noIndex`.
- **Global sections** — call `fetchGlobalSections(fullPath)` from `@/sanity/lib/queries/global-sections`, never copy its GROQ into a page query. See root `AGENTS.md` "Global Sections Helper" for full pattern.

## Sanity Reads, Caching & Revalidation

All Sanity reads go through `fetchSanity` (`@/sanity/lib/fetch`). It returns the query result **directly (`T`)**, not `{ data }`, and takes a `tags?: string[]` option.

```typescript
const site = await fetchSanity<SiteQueryResult>({ query: SiteQuery, tags: [SANITY_TAGS.site] });
```

- **Preview is driven ONLY by draft mode** (`(await draftMode()).isEnabled`) — **never** by `dev`/`NODE_ENV`. Gating preview on `dev` makes every local `pnpm dev` render hit the billed, non-cached Live Content API and burns Sanity quota. Published reads use the CDN with cache tags + a long `revalidate` safety net.
- **The Live Content API (`<SanityLive />` from `defineLive`) is editor-only.** It bills against `api.sanity.io` and opens a browser SSE stream. `<SanityLive />` must mount **only in draft mode** — `VisualEditingControls` returns `null` outside draft mode so public traffic never touches it. Never mount `<SanityLive />` for regular visitors (even "deferred").
- **Cache-tag taxonomy lives in `@/sanity/lib/tags.ts`** — the single source of truth shared by fetch call sites and the revalidate webhook. Every published fetch carries `GLOBAL_TAG` (`"sanity"`) plus the caller's `tags`. Tag each read with its document-type tag(s): `SANITY_TAGS.<type>`, plus the slug-scoped tag for routed docs (`pageTag(slug)`, `postTag(slug)`).
- **Global sections are their own read**, tagged `SANITY_TAGS["global-section"]` inside `fetchGlobalSections`; the page query doesn't carry that tag.
- **Revalidation webhook** — `/api/revalidate` invalidates by `_type` (+ slug) via `tagsForDocumentType`; the **Sanity webhook must project `_type` and the slug** (`metadata.slug.current` for catchall pages, top-level `slug.current` for routed detail docs). A body-only edit (the webhook's `contentOnly`) purges just that route, so never add a field a listing, card or link reads to its selector. `/api/revalidate-all` purges `GLOBAL_TAG`. Both require the `SANITY_REVALIDATE_SECRET` env var (add new entities' tags to `tags.ts`, not ad-hoc strings). The webhook itself is declared in the root `sanity.blueprint.ts` and fires for every non-system type, so a new type needs no webhook change (`docs/guides/sanity-blueprints.md`).
- **Next 16:** use the two-arg `revalidateTag(tag, "max")` (cache-profile form) — the single-arg form is deprecated.

## CTA Rendering

- CTA variant handling lives in `ButtonLink` (`web/src/ui/components/button/button-link.tsx`) — not in individual sections
- When adding a new CTA variant with different JSX structure (e.g., ArrowLink), add detection in `ButtonLink` using `stegaClean(variant)`, not in each section
- New visual CTA patterns that don't fit `ButtonBase` (different HTML structure) should be standalone components under `web/src/ui/components/`
- **Variants live in three places that must stay in sync:** `getVariantClasses` + `getLoaderColors` (`button/utils.ts`), the `CommonButtonProps["variant"]` union (`button/types.ts`), and the `variant` list in the `cta` schema (`studio/.../objects/cta.ts`). Run typegen after touching the schema list. Available variants: `primary`, `secondary`, `primary-outline`, `secondary-outline`, `ghost`, `link`, `arrow-link`, `light`, `light-outline`, `plain`.
- **`ghost` = borderless button** (transparent bg, `text-foreground`, `hover:bg-button-ghost-hover` — an opaque fill in light that the dark palette swaps for a white wash, not a translucent `foreground/5`). Use it for transparent/no-border CTAs instead of `primary-outline`. It keeps a `border-transparent` so its height stays aligned with adjacent bordered/filled buttons (`ButtonBase` always adds a 1px `border` to every non-`link`/`plain` variant).
- **`buttonIcon` must be projected in the section's GROQ branch**, or the CTA icon silently never renders. The hand-written `ctas[] { variant, link {…} }` projections omit it — add `buttonIcon,` (or reuse `CTA_FRAGMENT` from `@/sanity/lib/fragments/cta`). Icon set is custom utility SVGs: `utility-arrow` is **diagonal** (↗), `utility-arrow-long` is the **horizontal right arrow** (→) — pick by the Figma glyph.
- **Overriding `ButtonBase`'s internal utilities needs `!important`.** `ButtonBase` composes classes with `clsx` (not `tailwind-merge`), so a conflicting utility passed via `buttonClassName` won't replace the base one — both emit and stylesheet order wins. To resize/restyle the icon, force it: `buttonClassName="[&_.icon-container]:!text-16 [&_.icon-container]:opacity-60"` (the default icon size is `[&_.icon-container]:text-16`).
- **Buttons are `rounded-md`.** `ButtonBase` applies `rounded-md border text-14 font-medium` + a 16px icon (`[&_.icon-container]:text-16`) to every variant except `link`/`plain`. Set size via the `size` prop — never hardcode height/radius per CTA. Sizes (`getSizeClasses`): `sm = h-8 px-3` (32px — navbar), `md = h-9 px-4` (36px — hero/default), `lg = h-11 px-6` (44px); horizontal padding tightens while `loading`. Filled `primary` = `bg-primary text-primary-foreground`; `secondary` = light `bg-secondary`; outlines/`ghost` are transparent.

## Styling (Tailwind CSS v4)

- **Read the root [`DESIGN.md`](../DESIGN.md) first.** It wins over mockups and screenshots; the approved design file wins over it, and `DESIGN.md` is updated in the same PR.
- Semantic tokens only (`bg-primary`, `text-muted-foreground`); never a raw palette utility (`bg-neutral-200`) or an arbitrary value (`[23px]`). Add a token to `app.css` instead; a new color enters only from the design system.
- Every container uses the `section` utility. Dark bands use the `.dark` class (plain CSS, never `@utility`).
- Text size comes from the CMS block style, not wrapper classes or `[&_p]` overrides.
- `cn()` silently drops a custom `text-NN` size next to a `text-{color}` utility.

**Read [`../docs/agents/web-styling.md`](../docs/agents/web-styling.md) before building or restyling anything visible**: tokens, cards, Section Layout & Padding, Section Color Inversion, Header & Footer Layout, Design Fidelity.

## RichText Block Styles & Typography

Text size is a CMS block style mapped in `web/src/ui/RichText/block-styles.ts`; change a size there **and** in `studio/.../richText/editor.css`. Standard body copy is `body-3`, not `body-1`; section titles use `section-heading-lg`. A Client Component block renderer must be wrapped (PortableText passes a non-serializable `renderNode`).

**Read [`../docs/agents/web-richtext.md`](../docs/agents/web-richtext.md) before writing content or adding a RichText block**: the full scale and the custom-block checklist.

## Text-Heavy Page Sections

For pages that are mostly text (legal, policies, articles), create a section with:
- `section` utility for horizontal padding + inner `max-w-4xl mx-auto` (896px) for optimal line length
- Dedicated `title` string field that renders as `<h1>` (not embedded in rich text)
- `pageRichText` for body content (standard block styles + lists)
- CTAs array in the same section (avoids spacing/width mismatch from separate sections)

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
