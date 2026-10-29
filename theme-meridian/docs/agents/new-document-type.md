# New document types and listing pages

Checklists for a new document type and for a listing + detail feature. Indexed from [`AGENTS.md`](../../AGENTS.md); the short version of each rule is there, the full one is here.

## New Document Types (full workflow)

When adding a new document type beyond a section:
1. Create schema in `studio/src/sanity/schemaTypes/documents/`
2. Register in `studio/src/sanity/schemaTypes/index.ts`
3. Add to Studio structure in `studio/src/sanity/structure.tsx`
4. Add to presentation resolver in `studio/src/sanity/presentation.ts`
5. Create a route in `web/src/app/(frontend)/` or add to the catchall
6. Update `web/src/app/sitemap.ts` if publicly discoverable
7. **If the document is internally linkable and its URL is NOT `metadata.slug`** (e.g. a routed detail doc like `case-study` → `/case-studies/{slug}`): (a) add a `_type` branch to `resolveUrl` (`web/src/lib/resolveUrl.ts`); (b) project the top-level `slug` in `LINK_QUERY` (`web/src/sanity/lib/queries.ts`) **and** `LINK_FRAGMENT` (`web/src/sanity/lib/fragments/link.ts`); (c) add `{ type: "<doc>" }` to `linkBaseSchema.ts` `to`. Skip this and internal links to the doc render an **empty `href`**.
8. **If the document is routed (has a public URL), give it structured data.** (a) Spread `structuredDataFields` and add `STRUCTURED_DATA_GROUP` last in `groups` (`studio/.../partials/structuredDataFields.ts`). (b) Add it to `ROUTED_DOCUMENT_TYPES` (`partials/schemaPageTypes.ts`), which also creates its Site settings default. (c) Add it to `RoutedDocuments` in `web/src/lib/schema-org/types.ts`, plus its camel-cased key to `SITE_STRUCTURED_DATA_FRAGMENT`, `RawSiteSchema` and `normalizeSiteSchema`. (d) Interpolate `STRUCTURED_DATA_FRAGMENT` next to `metadata { ${METADATA_FRAGMENT} }` in its query. (e) Write a reducer in `route-graph.ts` and render `<StructuredData graph={buildRouteGraph(…)} />` in the route. Typecheck fails if (a) is missing for a type listed in `RoutedDocuments`.
9. **If the document is routed, give it a Markdown version and an `llms.txt` entry.** Add a template next to `postToMarkdown` in `web/src/lib/markdown/documents.ts`, a loader in `web/src/lib/markdown/load-markdown.ts` that reuses the route's query and cache tags through `fetchPublished` (register its URL prefix in `ROUTED_LOADERS`), and the type to `LLMS_DATA_QUERY` (`web/src/app/llms.txt/route.ts`) and `buildLlmsTxt`. A detail page also renders `<CopyMarkdownButton markdownPath={markdownPathFor(…)} />` like the blog post. Without the loader its `.md` is a 404. See `docs/guides/markdown-for-agents.md`.
10. **Update `docs/FEATURES.md`** — add the new content type to the "Content types editors manage" list (and adjust its count). That file is the editor/marketer-facing feature inventory; it goes stale silently if skipped.

## Listing Page Pattern (listing + detail pages)

When a feature has both a **listing page** and **detail pages** (e.g., Blog listing + Post detail), **always** use a dedicated route — never the catchall.

Reference implementations: `blog/` and `case-studies/` (the latter adds a `category` filter on a reusable detail document + a featured item — see `web/src/ui/sections/CaseStudiesListingSection/`).

> **Don't copy a sibling listing section's plumbing — reuse `web/src/ui/listing/`.** The interactive grid (search-debounce, paginated `fetch` with abort/race guard, pushState URL sync, popstate restore, page clamp) is a **generic `<ListingGrid<TItem>>`** plus dumb `Pagination`/`SearchInput`/`CategoryTabs` and pure utils, all in `web/src/ui/listing/`. A listing's `client.tsx` is a ~35-line wrapper passing config: `categories`, `apiPath`, `parseResponse` (normalizes the route's `{ posts | caseStudies, total }` → `{ items, total }`), `renderCard`, and labels. The route handler reuses `parseListingParams()` from `web/src/lib/listing-params.ts` for the shared page/perPage/category/`q` parsing. Per-listing files are only: the card, `CATEGORIES`/`constants.ts`, the GROQ query, and `index.tsx` (heading + SSR fallback).

### Full checklist:

1. **Listing page schema** — Create singleton document type `{name}-listing-page` in `studio/src/sanity/schemaTypes/documents/` with fields: `title`, `content` (simpleRichText — intro text above the listing), `sections` (fragment), `metadata`. Groups: content + metadata.
2. **Schema registration** — Register in `studio/src/sanity/schemaTypes/index.ts` (documents array)
3. **Studio structure** — Register the singleton in `studio/src/sanity/singletons.ts` (`defineSingleton({ documentId: "{camelId}", schemaType: "{name}-listing-page", title, icon })` — native Sanity singletons, see `studio/AGENTS.md`). Then add it as a **grouped** entry using `group(S, "Name", [...])`: `createSingletonWithPreview(S, { id: "{camelId}", previewSlug: "/{path}" })` for the listing page singleton (provides "Open In Visual Editor" + "Open on the Website" tabs) and `createDocumentListWithSlugPrefix` for the detail document list (provides the same tabs with prefixed slug URLs).
4. **Presentation resolver** — Add route filter in `mainDocuments` and location entry in `locations`
5. **Internal links** — Add `{ type: "{name}-listing-page" }` to the `to` array in `studio/src/sanity/schemaTypes/partials/linkBaseSchema.ts`, **and** add a branch to `resolveUrl` (`web/src/lib/resolveUrl.ts`) mapping `{name}-listing-page` → its fixed path (e.g. `/case-studies`). The listing-page URL is a fixed literal, not `metadata.slug` — without the `resolveUrl` branch internal links render an empty `href`. (Because the path is fixed, no top-level `slug` projection in `LINK_QUERY`/`LINK_FRAGMENT` is needed — that's only for slug-derived routed docs like the detail document.)
6. **Readonly slug** — Add `"{name}-listing-page"` to `READONLY_SLUG_DOCUMENT_TYPES` in `studio/src/sanity/schemaTypes/objects/metadata.tsx`
7. **Query** — Create dedicated query file in `web/src/sanity/lib/queries/{name}.ts` fetching the singleton by `_id`. Global sections are not part of it (the route fetches them, step 8). The detail document query filters on `$documentSlug`, the bare slug.
8. **Route** — Create `web/src/app/(frontend)/{name}/page.tsx` using `fetchSanity` + `generateMetadata`, with `fetchGlobalSections("{path}")` (and ``fetchGlobalSections(`{path}/${slug}`)`` on the detail route) in its `Promise.all`; see `docs/agents/content-patterns.md` → "Global Sections Helper". Render `page.content` directly (via `<RichText>`) before `<Sections>` — always-present content lives on the document, not in sections. Listing sections are pure grids.
9. **Type generation** — Run `pnpm --filter @meridian/web ts:typegen`
10. **Content** — create the singleton in the Studio (its fixed camelCase ID comes from `singletons.ts`); for the demo, add it to the dataset and re-export `seed/meridian.tar.gz` (`seed/README.md`)
11. **Sitemap** — Add the listing-page singleton to `web/src/app/sitemap.ts` (mirror the `blog` block: `*[_type == '{name}-listing-page' && _id == '{camelId}']{ 'url': $baseUrl + '{path}', ... }`). The listing route is publicly discoverable; without this it's absent from the sitemap (detail-doc URLs alone are not enough).
12. **Markdown** — a listing template next to `blogListingPageToMarkdown` (`web/src/lib/markdown/documents.ts`) and its loader in `ROUTED_LOADERS` (`load-markdown.ts`), so `/{path}.md` lists every item; the listing section gets a serializer like any section, and the detail document follows step 9 of "New Document Types".
13. **Update `docs/FEATURES.md`** — add the listing page + detail document to the "Content types editors manage" list (the editor/marketer-facing feature inventory).

> **Seed the singleton before building.** A listing route whose singleton does **not** exist in the dataset calls `notFound()`, which makes Next statically prerender it; `generateMetadata`'s `getSite()` then throws **"Missing Site settings"** at build time. Seed the singleton first so the page renders dynamically like every other CMS page.

### Content model conventions — title + slug always live in `metadata`

**One rule for every routed/linkable document** (`page`, `post`, `case-study`, …): the `title` (H1) and routing `slug` live in the shared **`metadata`** object — **never** a second top-level `title`/`slug`. Render the H1 from `metadata.title`; route via `metadata.slug.current`.

- **Slug storage format:** catchall `page` → **full path without a leading slash** (`about`, `company/team`; the home page is `/`), enforced by the slug validation in `objects/metadata.tsx` (`/about` never matches the catchall and the sitemap would list `//about`); routed detail under a fixed prefix (`post`→`/blog`, `case-study`→`/case-studies`) → **bare slug** (`my-article`), prefix applied in code; fixed-URL singletons (listing pages) → bare key, **read-only**.
- **`READONLY_SLUG_DOCUMENT_TYPES`** (`objects/metadata.tsx`) holds **only** the fixed-URL singletons. Routed detail docs are editable (slug auto-derives from `metadata.title`).
- **Keep `metadata.title` optional** in the shared object (it's shared with `page`; making it `required()` flips the generated type non-null everywhere via `--enforce-required-fields`). Treat aliased `title`/`slug` as nullable: guard in `generateStaticParams` (`.filter((s): s is string => Boolean(s))`) and `generateMetadata` (`x.title || "…"`).
- **Alias in GROQ** so components don't churn: `"title": metadata.title`, `"slug": metadata.slug.current`. Then `resolveUrl`, sitemap, presentation `mainDocuments`+`locations`, and the Studio `structure.tsx` slug-prefix preview resolver all read `metadata.slug`/`metadata.title`.
- **Reusable people/entities (e.g. author) are documents, not strings** — referenced as an array of references (max 1), aliased back to one object: `"author": authors[0]->{ ${AUTHOR_FRAGMENT} }`.
- **`generateMetadata` for a routed detail doc:** small local builder (reuse `resolveUrl` + `generateSrc`), **not** `processMetadata` (`processMetadata` is for catchall/`metadata.slug` pages). **Every** builder takes its `<title>`/description from `buildSeoTitle`/`buildSeoDescription` (`@/lib/seo-title`, re-exporting the pure `studio/src/sanity/lib/seo-title.ts` that the Studio "Search appearance" preview also uses — never re-implement the precedence) and spreads `buildRobotsAndAlternates(metadata, url, { isIndexable: IS_INDEXABLE })` (`@/lib/seo-robots`) for robots/canonical/hreflang — never set `robots` by hand, or the `IS_INDEXABLE` switch is bypassed. The query must project `metadata { ${METADATA_FRAGMENT} }`.
- **"Related items" (same-category-first, top-up from all):** one GROQ sub-query in the detail projection — `order(select(field == ^.field => 0, 1) asc, publishedAt desc)[0...N]` (`^` = the doc being viewed; slice bound must be a constant literal); reuse the shared **card projection** so the related grid reuses the listing card (key by `_id`).
