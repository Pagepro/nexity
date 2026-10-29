# create-section gotchas

Traps from past section builds, grouped by the `create-section` phase they bite in. When a
build turns up a new section-building trap (and the user agrees), append it to the matching
group here.

## Universal

- **Field names are identical end to end.** Schema field → GROQ projection → component prop.
  Never alias or rename (`variant` everywhere, never aliased to `style`).
- **GROQ returns `null` silently for misspelled fields.** Cross-check names across schema →
  query → frontend.
- **Check the block style exists before using it.** `web/src/ui/RichText/block-styles.ts` is the
  only source of sizes; the `normal` style renders as `body-2`.
- **After adding a NEW section type, restart Studio AND the web dev server before creating
  content.** A Studio running the old schema doesn't know the type and silently strips it from
  the document on save; a stale web server under-fetches it. When content seems missing, query
  the dataset and compare perspectives (`raw` / `drafts` / `published`; dev reads drafts)
  before suspecting HMR or the build.

## Reuse or extend (Phase 0)

- **The same layout under different copy is not a new section.** Match the request to an
  existing type by its slots, not by what the text talks about, and check the `options` group
  for a `layout` value that already draws it.
- **`initialValue` does not backfill.** A field added to an existing section is `null` on every
  document saved before it, so the component treats `null` as the old look.

## Schema, GROQ and routing (Phases 3–4)

- **Register in `fragments/sections.ts`, not only `schemaTypes/index.ts`.** Without the
  `INNER_SECTIONS` entry and an `insertMenu` group the type is valid but no editor can insert it.
- **Don't name a field `groups`.** It collides with the `defineType` field-group key; use a
  domain name (`featureGroups`). Rename before the first typegen, or the GROQ, types, props and
  fixture all churn.
- **Delete dead components before changing types.** Stale imports cause build failures when
  schema types change.
- **Detail pages need dual GROQ params for global sections.** `$slug` = full URL path
  (e.g. `blog/my-first-post`), `$documentSlug` = bare slug. See `docs/agents/content-patterns.md` → "Global
  Sections Helper".
- **Use `IMAGE_FRAGMENT`, not a hand-rolled image projection.** `images[] { _key, ${IMAGE_FRAGMENT} }`
  keeps the `ImageFragment` type the image component expects.
- **Document editors need preview view tabs.** Use `createSingletonWithPreview`,
  `createDocumentListWithSlugPrefix` or `createDocumentListWithPreview`
  (`studio/src/sanity/lib/structure.tsx`), never a plain `S.editor()`.
- **Listing page content lives at document level.** Always-present content (title, intro)
  belongs on the listing page document, not inside the listing section. Sections are for
  optional, reorderable blocks.
- **CTA vs link.** Ask: "Does the editor control how this button looks?" No → `link`, and the
  component hardcodes the styling.
- **Fixtures follow the schema.** When a schema or GROQ field name changes, update the gallery
  fixture in the same change.
- **Fixture images follow the neighbouring fixtures.** The helpers in
  `web/src/ui/styleguide/sections-gallery/mock-image.ts` depend on the project. With local placeholders,
  `mockImage(shape)` points at a local SVG in `web/public/placeholders/` (logo rows cycle
  `PLACEHOLDER_LOGOS`), so the gallery works on an empty dataset; never reference a dataset
  asset there. With seeded assets, `mockImage(orientation)` resolves fixed asset IDs
  (`PLACEHOLDER_ASSETS`) and `` imageFromUrl(`${CDN_BASE}/…`) `` real demo assets; both must exist in
  the dataset (`pnpm seed`), or `<Image>` throws "Image asset is missing" in the gallery.
- **GROQ fragment shape must match the resolver.** If the link resolver reads
  `internal.metadata.slug.current`, the fragment keeps that nesting; never flatten it.
- **`--enforce-required-fields` makes optional fields `T | null`.** A fixture item that omits an
  optional field still needs `field: null`, or typecheck reports "Property 'x' is missing".

## Component (Phase 2)

- **Start from the closest existing section** (Phase 1b of `SKILL.md`), not from a blank file.
  Copy its wrapper, image, CTA and rich-text handling, then change the layout.
- **Continuous logo/marquee strips → embla auto-scroll, not CSS keyframes.** Use the trimmed
  shadcn carousel in `web/src/components/ui/carousel.tsx` + `embla-carousel-auto-scroll`
  (`AutoScroll({ playOnInit: true })`, `opts={{ loop: true }}`): a server wrapper (`section` +
  `sectionProps`) and a `"use client"` track leaf behind `client-lazy.tsx`. Reference:
  `LogosCarousel/`.
- **A carousel of bordered cards clips the border.** The carousel viewport is `overflow-hidden`;
  add `p-0.5` to `CarouselContent` so outer strokes and rings clear the clip. Reference:
  `TestimonialsSection/client.tsx`.
- **Sanity v4 has no native number `range` slider.** `options: { range }` is a type error on a
  number field. For a slider, build a co-located `<input type="range">` custom input wired with
  `set`/`unset` from `"sanity"` via `components: { input: … }`, and put the schema in a folder
  (`<type>/index.ts` + the input component; see `sections/logos-carousel/SpeedSlider.tsx`). Number fields need
  **no** `stegaClean` on the frontend (only strings are stega-encoded).
- **Never nest `<a>` inside `BaseLink`.** Strip raw `<a>` tags from reference markup before
  wrapping it in CMS link components.
- **`stegaClean()` before string comparisons.** Visual-editing encoding breaks direct string
  equality.
- **Opacity transitions over conditional rendering.** `{isOpen && <div>}` shows and hides
  abruptly. Use `visible/invisible` + `opacity-0/opacity-100` with `transition-all duration-200`.
- **Animating `translate-*` / `scale-*` / `rotate-*`? Use `transition-all`.** Tailwind v4 sets
  the standalone `translate`/`scale`/`rotate` properties, which a `transition-transform` does not
  cover, so they jump.
- **No `[&_p]` or child-targeting overrides for RichText.** Text styling is driven by the block
  style the editor picks.
- **CTA variant detection lives in `ButtonLink`, not in sections.** New CTA variants go in
  `web/src/ui/components/button/` using `stegaClean(variant)`.
- **Project `buttonIcon` in the section's CTA GROQ branch.** A hand-written
  `ctas[] { variant, link {…} }` omits it and the icon never renders; add `buttonIcon,` or reuse
  `CTA_FRAGMENT`.
- **Borderless button in the reference → `ghost` variant.** Transparent background,
  `border-transparent` keeps the height aligned with filled siblings. Not `primary-outline`
  (draws a border) and not `link`/`plain` (drop the padding).
- **Overriding `ButtonBase` internals needs `!important`.** `ButtonBase` joins classes with
  `clsx`, not `tailwind-merge`, so `buttonClassName` utilities don't replace the base ones:
  e.g. `buttonClassName="[&_.icon-container]:!text-10"`.
- **`cn()` drops a custom `text-NN` size next to a `text-{color}`.** tailwind-merge treats the
  custom size as a colour conflict and keeps one. Put the size on a parent, and confirm with
  `getComputedStyle(el).fontSize`.
- **`<Image fill>` requires a `relative` parent.** `<div className="relative aspect-[…] overflow-hidden"><Image fill … /></div>`.
- **A full-bleed background `<Image fill>` needs an `absolute inset-0` wrapper.** The
  `<picture>` is `absolute size-full` with no insets, so the section's padding pushes it down.
  Wrap it: `<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">`,
  and give the box it belongs to `isolate`, or the layer sinks behind a themed wrapper.
- **Never use `@utility` for CSS variable overrides.** Tailwind v4 `@utility` doesn't cascade.
  Use a plain CSS class (`.dark`).
- **Dark bands use the `.dark` class from the `Sections` renderer.** `colorTheme === "dark"`
  wraps the section in `section-themed dark bg-background text-foreground`
  (`web/src/ui/sections/section-theme.ts`); `.dark` re-declares the tokens, so children and
  `dark:` variants invert. In a dark context use the `primary-outline` CTA variant, not
  `light-outline`.
- **A band's own background must not fight the Color theme.** If `app.css` defines a
  section-surface token (`bg-section-surface`), paint the band with it rather than a bare
  `bg-muted` on `<section>`; `section-themed` switches the surface off so the editor's choice
  wins.
- **Never use `<button>` for fill-image containers with an aspect ratio.** Use
  `<div role="button" tabIndex={0}>` with keyboard handlers.
- **Use `loading="eager"`, not `priority`.** The image schema sets `loading: "lazy"`; `priority`
  conflicts with it.
- **Sections need the `section` utility.** Without it content sits at the viewport edge.
- **Verify CSS classes exist.** Tailwind doesn't warn about undefined custom classes.
- **Vertical padding is per section.** The `section` utility is horizontal only; add `py-*`.
- **Equal-height card grids: push the footer down with `mt-auto`.** Give the card
  `h-full flex flex-col` and the trailing media/footer `mt-auto`. Reference:
  `FeatureGrid/feature-card.tsx`.
- **`useSearchParams()` needs a `<Suspense>` boundary**, or static builds fail. For query-string
  state use `useState` + `history.pushState`, not `router.push` (a full server navigation).

## Authoring the first instance (Phase 6)

- **Always include `_key` on array items** in fixtures.
- **Set block styles explicitly.** `body-3` for standard body text; `normal` renders as
  `body-2`, which is almost never what the design wants.
- **A field an editor can't find is a bug.** A short field declared after a tall array looks
  missing; move it above the array.

## Navigation (header/footer only)

- **Union-type arrays need `_type` discrimination at every consumer.**
- **A mega menu needs `fixed` positioning** (not `absolute`) to span the full width.
- **The `--header-height` CSS variable** positions the mobile menu; keep the ResizeObserver in
  the header `Wrapper`.
- **Icon-link CTAs render as `BaseLink` with icons**, not `ButtonLink`.
- **`isSanityLink()` checks `type`, not `_type`.** `type` = link kind (internal/external/download),
  `_type` = Sanity type; the wrong check breaks every navigation link.
