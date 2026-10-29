# Content patterns: global, shared and document-backed sections

How sections are reused across pages. Indexed from [`AGENTS.md`](../../AGENTS.md); the short version of each rule is there, the full one is here.

## Global Sections Helper

Global sections are CMS-managed sections that appear before/after page content based on URL path matching. They are a separate read, not part of the page query: `fetchGlobalSections(slug)` in `web/src/sanity/lib/queries/global-sections.ts` runs the before and after queries in parallel (no `$slug`: one cached pair serves every route, `appliesToSlug` matches the path in JS), tags both with `SANITY_TAGS["global-section"]`, puts wildcard (`path == '*'`) sections outermost, and returns `{ before, after }`.

### Pages with a `sections` array (catchall, listing pages, 404)

```typescript
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";

const [globals, siteSchema] = await Promise.all([fetchGlobalSections(slug), getSiteSchema()]);
const sections = [...globals.before, ...(page.sections ?? []), ...globals.after];
```

Pass the merged array to `buildRouteGraph` too, so JSON-LD sees the global sections.

### Detail pages with custom layouts (no `sections` array)

Call ``fetchGlobalSections(`blog/${slug}`)`` the same way and render `globals.before` and `globals.after` as two `<Sections>` around the custom JSX (`withDataFirstAttribute={false}` on the `before` one). The detail document query filters on `$documentSlug`, the bare slug (`metadata.slug.current == $documentSlug`).

### Important
- **Never copy the global-section GROQ into a page query**: it inlines `SECTIONS_QUERY` and counts against Sanity's query-size limit, and the page would lose the `global-section` tag.
- `slug` is the **full URL path** (`"/"`, `"blog/my-first-post"`, `"404"`): matching is `string::startsWith($slug, path)` minus `excludePaths`.
- The Markdown loader passes `fetchPublished` as the second argument, so `/x.md` never reads drafts.
- `<Sections>` `page` prop is optional — omit it when rendering global sections on detail pages

## Shared Sections

Reusable bundles of sections that editors author once and reference from many pages — edits propagate to every reference on the next publish. Two schema types work together:

- **`shared-section`** (document, `studio/.../documents/shared-section.ts`) — holds a `title` (internal) + a `sections` array of **inner** section types. Listed in the Studio sidebar next to "Global sections".
- **`shared-section-ref`** (section object, `studio/.../sections/shared-section-ref.ts`) — has `section-options` + a `sharedSections` **array of references** to `shared-section` documents. This is what editors insert into a page's `sections`.

Key conventions:
- **Inner vs full section lists** live in `studio/.../fragments/sections.ts`: `INNER_SECTIONS` (everything except `shared-section-ref`) is used by the `shared-section` document; `SECTIONS` (= inner + `shared-section-ref`) is the full page union. This split prevents shared sections from nesting inside one another.
- **Query** — `SECTIONS_QUERY` in `web/src/sanity/lib/queries.ts` reuses the extracted `SECTION_BRANCHES_QUERY` both inline and inside the `shared-section-ref` branch, which dereferences `sharedSections[]->{ ..., 'sections': sections[]{ <branches> } }`. Never duplicate the branches.
- **Rendering** — `web/src/ui/sections/map.ts` exports `INNER_SECTION_MAP`; the top-level `Sections` renderer (`index.tsx`) spreads it and adds `"shared-section-ref": SharedSection`. `SharedSection` flattens every referenced bundle's `sections` and renders each via `INNER_SECTION_MAP`, forwarding `data-first-module` only to the first inner section. Bundle-level color theme / dividers come from the ref's own `section-options` (applied by `Sections`).

## Document-Backed Listing Section (reusable entities referenced by a section)

When a section's items are **reusable entities** (testimonials, team members, case studies) — edited in one place, curated into one or more sections, order chosen per instance — model them as **standalone documents** and make the section a **listing of references**, not an inline array of objects. (Inline objects are right only when the content belongs to that one section instance, e.g. split-section rows or stats values.) This is the same shape as `shared-section-ref`; reuse it. Reference: `testimonial` document + `testimonials` section.

- **Document** (`documents/<entity>.ts`, `type: "document"`) holds the entity's fields. **Section** (`sections/<name>.ts`) keeps always-present copy (title via `pretitle` + `simpleRichText` `content`) plus the items as `array` of `reference` `to: [{ type: "<entity>" }]` (per `studio/AGENTS.md`: never a single reference — always an array; min 1).
- **GROQ** dereferences with `field[]->{ _id, … }`. The array member's `_key` is lost after `->`, so **key the rendered list by `_id`** (exactly what `shared-section-ref` does). `ExtractSectionProps<"<name>">` then yields the resolved (dereferenced) shape.
- **Studio structure** — if the entity has **no public route**, a plain `S.documentTypeListItem("<entity>")` is enough; the preview-tab helpers (`createDocumentListWithPreview` etc.) are only for types with a frontend URL. **List it under the `S.divider().title("Collections")` group in `structure.tsx`** (alongside `testimonial`, `author`) — that divider is the home for reusable, referenced-by-a-section entities. Only start a *new* divider/group when the entity is conceptually distinct from existing collections (its own domain), not just another reusable entity.
- **Seeding** — give the referenced docs fixed camelCase `_id`s and create them **before** the page that references them by `_id`.
