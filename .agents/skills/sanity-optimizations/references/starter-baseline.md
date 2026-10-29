# Nexity starter baseline (checked 2026-10-28)

What the starter's data layer already does right, and the gaps known when this was last
checked. Both starters share the same data layer. On a project built from one, each auditor
reads the rows with its IDs (Q = `sanity-query-auditor`, I = `sanity-image-auditor`,
C/K/B = `sanity-delivery-auditor`), confirms each "right" row survived and each gap is still
there. Paths are relative to `web/` unless marked "project root"; line numbers drift, so
search for the named symbol.

## Already right: keep it

| ID | What | Where |
|---|---|---|
| C1, C4 | Published reads on the API CDN, `perspective: "published"` explicit | `src/sanity/lib/fetch.ts` (`fetchSanity`), `src/sanity/lib/fetch-published.ts` (`fetchPublished`) |
| C2, C5 | Drafts through `previewClient.fetch` (`useCdn: false`, one request per read, not defineLive's `sanityFetch`, which adds a sync-tag request) only when `draftMode()` is on, never on `NODE_ENV`; `<SanityLive />` mounted only with a validated browser token | `fetch.ts`, `src/ui/VisualEditingControls.tsx`, `src/sanity/lib/preview-token.ts` |
| C6, Q4, Q11 | Listings paginate on the server through route handlers, clamped integer slices, real GROQ params | `src/app/api/blog/posts/route.ts`, `api/case-studies`, `api/podcast/episodes`, `src/sanity/lib/queries/blog.ts` |
| C7 | `requestTagPrefix: "web"` on every site client, plus a `tag` per read (its first type tag) | `src/sanity/lib/client.ts`, `fetch.ts`, `fetch-published.ts`, `src/lib/redirects.ts` |
| C8 | `fetch.ts` is a `"use server"` module and no client module imports it | `fetch.ts`; keep it that way |
| K1 | Every published fetch: global `sanity` tag + type tags + 30-day `revalidate` safety net | `fetch.ts`, `fetch-published.ts`, `src/sanity/lib/tags.ts` |
| K2, K3 | A body-only edit (`contentOnly`, projected with `delta::changedOnly`) purges `<type>:<slug>` + `sitemap`; any other edit keeps the type tag, so linked titles and slugs stay fresh. The sitemap carries the type tags | `src/sanity/lib/tags.ts` (`tagsForDocumentType`), `src/app/sitemap.ts` |
| K4 | Webhook as code: published only, `sanity.*`/`system.*` types filtered, minimal projection; tag map shared with fetch sites (`tagsForDocumentType`); signature check; `parseBody(..., true)` waits for the CDN | `sanity.blueprint.ts` (project root), `src/app/api/revalidate/route.ts` |
| K5, K6 | Frontend routes static/ISR with `generateStaticParams` (catch-all including `/`, blog, case studies, podcast; published slugs only); the root layout uses no dynamic API. In production the catch-all answers an unknown path from one cached slug list (`isKnownSlug`); the styleguide type pages render on first visit, not at build. `robots.ts`, `/api/markdown`, `/api/redirects` are dynamic on purpose | `src/app/(frontend)/**` |
| K8, K9 | CMS redirects: own stega-off client, tagged Data Cache reads, endpoint `s-maxage` pinned to the proxy's 60 s memo, single-flight loader, fail-open. Markdown and `llms.txt`: published-only, no `s-maxage` that would outlive a purge | `src/lib/redirects.ts`, `src/app/api/redirects/route.ts`, `src/proxy.ts`, `src/lib/redirect-loader.ts`, `src/app/api/markdown/[[...path]]/route.ts`, `src/app/llms.txt/route.ts` |
| I1 | One transformer: the Sanity original goes to `/_next/image`, with Sanity params only above 3,840 px (`MAX_SOURCE_WIDTH`). Keeping `next/image` is a recorded decision | `src/ui/components/image/utils.ts` (`generateSrc`), `docs/agents/web-images-links.md` (project root) |
| I4 | Editor crop reaches the URL as `rect` | `src/sanity/lib/image.ts` (`urlFor`, `@sanity/image-url`) |
| I7, I8 | LQIP only on the hero backdrop and only for opaque images; preload opt-in per call site (the hero) | `src/sanity/lib/queries.ts` (`hero` branch), `src/ui/components/image/index.tsx` |
| I9 | SVGs skip the optimizer and load from a cached same-origin rewrite | `isSvgAsset` in `utils.ts`, `src/lib/sanity-cdn-proxy.ts`, `vercel.json` |
| B1, B3 | Studio in its own `(studio)` route group; image URLs built without `@sanity/client`; `pnpm check:client` | `src/app/(studio)`, `src/sanity/lib/image.ts`, `scripts/check-client-boundaries.mjs` |
| Q5, Q7 | Global sections: one slug-free before/after pair shared by every route, matched in JS (`appliesToSlug`). Page and detail getters wrapped in React `cache()`, so the page and `generateMetadata` share one read | `src/sanity/lib/queries/global-sections.ts`, `src/app/(frontend)/**/page.tsx` |
| Q9 | `defineQuery` everywhere; runtime-sliced queries have static twins (`buildBlogPostsPageQuery` → `BlogPostsPageQuery`) | `src/sanity/lib/queries/*` |

## Gaps found

| ID | Sev | Where | Issue | Fix | Saving |
|---|---|---|---|---|---|
| Q5 | High | `src/sanity/lib/queries.ts` (`SECTIONS_QUERY`), `src/app/(frontend)/[[...slug]]/query.ts`, `src/sanity/lib/queries/global-sections.ts` | `PageQuery` is 181,445 chars (394,755 URL-encoded), so it goes out as POST; `GLOBAL_BEFORE_QUERY` and `GLOBAL_AFTER_QUERY` inline the same `SECTIONS_QUERY` (~181k each), `BlogListingPageQuery` is 186,598. One cold catch-all render POSTs ~545 KB of GROQ; the API CDN cap is 300 KB per POST, so a few more section types will start failing. The `shared-section-ref` branch inlines every section projection a second time | Collapse whitespace and comments at module load (117,398 chars, -35%); resolve shared sections in a second, smaller query; keep a size test (`PageQuery.length < 150_000`) | -35% at once, about half again without the duplicate branch; removes the hard-fail risk |
| Q7, Q8 | Low | `src/ui/header`, `src/ui/footer`, `src/sanity/lib/queries/site.ts`, `queries/setup-status.ts` | The `site` document is read by three queries per render (`SiteQuery`, `SiteSchemaQuery`, `SetupStatusQuery`); setup status, site, header and footer are four shell queries | One shell query for setup status + site + header + footer (+ schema fields) | 4–5 cache entries → 1; fewer reads after a settings publish |
| Q1, Q2 | Low | `src/sanity/lib/queries.ts` (`LINK_QUERY`) | Rich-text link annotations project `...`, the linked document's whole `metadata` object, and `file { ..., asset->{ ... } }` | Project the fields the link renderer reads | Smaller rich-text payloads |
| Q1 | Low | `PageQuery`, `NotFoundQuery`, listing page queries | Document-level `...` returns every field, then re-projects `sections` / `metadata` | Explicit field list | Payload size |
| Q6 | Low | `src/app/(frontend)/blog/page.tsx` and the other listing pages | Awaits the page, then the first posts page, then globals + site schema; the globals do not depend on the page | Start the globals together with the page | Latency on cache misses only |
| Q9 | Low | `src/app/sitemap.ts` | Untyped `groq` template (`as any[][]`) | `defineQuery` | Types |
| Q4, Q10 | Info | `queries.ts` (`integrations-grid` with `source == "all"`), `queries/podcast.ts` (search on `guests[0]->`), `queries/blog.ts` (related posts `order(select(...))`) | Bounded only by content; deref in a filter; order on a computed value | Fine at starter dataset sizes; revisit at thousands of documents | — |
| I4 | Low | `src/ui/components/image/utils.ts`, `src/sanity/lib/fragments/image.ts` | The hotspot is projected in `IMAGE_FRAGMENT` but never applied (no `object-position` for `fill` + `object-cover`); `generateSrc` takes width/height from the uncropped asset | Apply the hotspot as `object-position`; compute dimensions from the crop | Correct framing, less CLS |
| I5 | Low | `src/lib/processMetadata.ts` | The OG/Twitter image is `generateSrc(image, 1200).src`, the untransformed original (the width argument only changes the returned `width`) | `urlFor(image).width(1200).height(630).fit("crop").format("jpg").url()` | Smaller scraper downloads, predictable previews |
| I5 | Info | `src/lib/schema-org/*` | JSON-LD logo and image URLs are raw originals | Fine for crawlers; transform if originals are huge | — |
| I2 | Info | `next.config.ts` `images` | 2 formats × 4 qualities (75, 80 default, 85, 90, all used) × 16 widths: many potential transformations per image; fine on Pro, watch the 5k Hobby cap | Trim `qualities` to two, or a Sanity loader | Vercel image cost |
| K8 | Low | `src/app/llms.txt/route.ts`, `/api/markdown` | Dynamic: one function invocation per request (Data Cache hit, no Sanity read) | `llms.txt` can be static and tag-purged | Invocations only |
| C3 | Info | `src/sanity/lib/client.ts` | The shared client carries `SANITY_API_READ_TOKEN` on published reads (server env, cached per token) | On a public dataset, drop the token outside draft mode | None, hygiene |
