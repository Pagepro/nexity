# Live-site catalog: commands, pipeline rules, pitfalls

Mode B of `sanity-module-catalog`. `$OUT` is the gitignored output folder picked in
SKILL.md; every path here is relative to it. Sites call sections "modules", "blocks" or
"sections"; this file says sections.

## Phase 1: schema

Goal: every section type, the document types that embed them, and a URL rule per
document type.

1. Find the section schemas: one file per type (`schemaTypes/sections/*.ts`,
   `schemaTypes/modules/*.ts`) or one big array (`schemaTypes/fields/modules.ts`).
2. Collect every `name: '<type>'`.
3. Find the embedders: grep `schemaTypes/documents/*.ts` for the array field (`sections`,
   `modules`, `content`). Typical: `page`, `post`, `landingPage`, `caseStudy`; a
   `siteSettings` singleton may embed home/about/contact pages with their own arrays.
4. Read the URL rule per type from `app/` or `pages/` (`app/[lang]/[slug]/page.tsx` →
   `/<lang>/<slug>`; `app/[lang]/page.tsx` + `siteSettings.homePage` → `/<lang>`).

In a project from this starter: types are `INNER_SECTIONS` + `shared-section-ref` in
`studio/src/sanity/schemaTypes/fragments/sections.ts`; embedders are `page`, the
`*-listing-page` singletons, `global-section` (rendered before/after pages by path) and
`shared-section` (reached through `shared-section-ref`); `page` uses
`metadata.slug.current` as its full path, other types map in `web/src/lib/resolveUrl.ts`.

## Phase 2: query

The HTTP API needs no project env vars, unlike the CLI:

```bash
TOKEN=$(jq -r .authToken ~/.config/sanity/config.json)   # or a Viewer token; never echo it
PROJECT_ID=<projectId>
DATASET=<dataset>

query() {
  curl -sH "Authorization: Bearer $TOKEN" \
    "https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}?perspective=published&query=$(jq -rn --arg q "$1" '$q|@uri')"
}

query '*[_type in ["page","landingPage","caseStudy"]]{
  _type, "slug": slug.current, title, modules,
  templateReference->{title, modules}
}' > "$OUT/pages.json"
query '*[_id=="siteSettings"][0]{homePage, aboutPage, contactPage}' > "$OUT/settings.json"
```

In this starter, query `sections[]` and dereference shared sections:
`sections[]{ ..., _type == "shared-section-ref" => { "inner": sharedSections[]->sections } }`.

**Indirection**: a document often has an empty array and renders the sections of a
referenced document (a template, a shared section). The URL is the page's, the sections
are the referenced document's; resolve the reference in the query.

## Phase 3: `url-index.json`

```json
[
  {
    "url": "/en/partners",
    "liveUrl": "https://example.com/en/partners",
    "title": "Partners",
    "source": "siteSettings.partnerPage",
    "modules": [
      { "type": "heroCTA", "text": "Built to integrate...", "key": "abc123" },
      { "type": "videoModule", "text": "", "key": "def456" }
    ]
  }
]
```

The snippet comes from the likeliest headline field
(`title // heading // bigText // smallText // pretitle // author // ""`). Join Portable
Text spans; for tabbed or repeated sections look inside `items`, `slides` or `rows`.
Truncate to ~70 characters.

## Phase 4: screenshots

### Probe the DOM once

```bash
agent-browser open <some-url> > /dev/null
agent-browser wait --load networkidle > /dev/null
agent-browser eval --stdin <<'EOF'
const main = document.querySelector('main');
function walk(el, depth=0, max=3) {
  const lines = [' '.repeat(depth*2) + el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '') + ' (' + el.children.length + ')'];
  if (depth < max) for (const c of el.children) lines.push(walk(c, depth+1, max));
  return lines.join('\n');
}
walk(main);
EOF
```

Typical results: `main > section`, `main > div > section` (a theme or animation wrapper),
`main article > section`, `main article article > div` (Portable Text pages). This
starter renders sections in `<main id="main-content">`, each wrapped in a theme `<div>`
and marked `data-section="<type>"`.

### Pipeline rules

Each one was learned from a wrong catalog.

1. **Fresh session per URL**: `agent-browser close` before each `open`. Otherwise Next.js
   prefetch can show the previous page's content in the screenshot. The #1 failure.
2. **Dismiss the consent banner**, trying labels in order:
   ```bash
   agent-browser find text "Decline all" click 2>/dev/null \
     || agent-browser find text "Reject all" click 2>/dev/null \
     || agent-browser find text "Only necessary" click 2>/dev/null \
     || agent-browser find text "Accept all" click 2>/dev/null \
     || true
   agent-browser wait 1500
   ```
3. **Verify the URL** after navigation; wait and retry once, then skip:
   ```bash
   CURRENT=$(agent-browser eval 'location.pathname' 2>/dev/null | jq -r '.')
   if [ "$CURRENT" != "$EXPECTED_PATH" ]; then
     agent-browser wait 2000
     CURRENT=$(agent-browser eval 'location.pathname' 2>/dev/null | jq -r '.')
     [ "$CURRENT" != "$EXPECTED_PATH" ] && { echo "skip — wrong URL"; continue; }
   fi
   ```
4. **Full-page screenshot, then crop** with Pillow (the CLI has no offset crop; macOS
   `sips --cropToHeightWidth` only crops around the centre):
   ```python
   from PIL import Image
   img = Image.open(full_screenshot)
   W, H = img.size
   img.crop((0, top, W, min(H, top + height))).save(out)
   ```
5. **Match dataset sections to DOM sections by content**: for each section's headline,
   take the DOM section whose `textContent` contains it; fall back to the index when the
   text is empty.

   | DOM vs dataset count | Cause | Fix |
   |---|---|---|
   | Equal | Aligned | Index works, content matching is still safer |
   | DOM > dataset | Chrome from top-level fields or global sections | Content-based matching |
   | DOM < dataset | A section hides itself when empty | Skip the missing one |

   ```javascript
   const sections = Array.from(document.querySelector('main').querySelectorAll('section'));
   const matches = expectedTexts.map((needle) =>
     needle ? sections.findIndex((s) => s.textContent.includes(needle)) : null,
   );
   ```

### Skeleton

```bash
SITE=https://example.com
rm -f "$OUT"/screenshots/*.png

for URL in $(jq -r '.[].url' "$OUT/url-index.json"); do
  SLUG=$(echo "$URL" | sed 's|^/||; s|/|_|g'); [ -z "$SLUG" ] && SLUG="home"
  agent-browser close > /dev/null 2>&1
  agent-browser open "$SITE$URL" > /dev/null 2>&1
  agent-browser wait --load networkidle > /dev/null 2>&1
  # rule 2 (consent), rule 3 (URL check), section bounds (rule 5),
  # full screenshot, crop each section to screenshots/<site>_${SLUG}_<NN>_<type>.png
done
```

## Phase 5: viewers

Both live in `$OUT` and use relative paths into `screenshots/`, so the folder can be
zipped and shared.

- **By URL** (`<SITE>-MODULE-SCREENSHOTS.html`): one block per URL, sections in render
  order. For editors who think page by page.
- **By type** (`<SITE>-MODULE-TYPES.html`): one block per type, all instances together,
  sorted by usage count. For design reviews and rework planning. Needs: a used/unused
  badge (green/amber), filters (All / Used / Unused / per type), a lightbox (← → and
  Esc), the stable file id, and per instance the live URL and headline.
- **Never-used types**: the insert-menu tile from `web/public/admin/thumbnails/<type>.webp`
  labelled as sample data; for a site without tiles, a card built from the schema and the
  component: the fields it accepts and what it renders.

## Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Prefetch race | Page N shows page N-1's content | Fresh session per URL |
| Consent banner | First shot is the modal | Label fallback list (rule 2) |
| Wrong selector | `0 sections found` everywhere | Probe the DOM first |
| Index misalignment | Page chrome labelled as a section | Content-based matching |
| Blank crops | PNGs saved but empty | Pillow `crop()`, not `sips` |
| Narrow viewport | Shots look mobile | Set the viewport or use `--full` |
| `<article>` pages | Portable Text pages return 0 sections | Fall back to the inner article element |
| Nested text | Headline shows "—" | Per-type extractors (`items[]`, `slides[]`, `body[].children[].text`) |
| One document type queried | Sections on other routed types missing | `_type in [...every embedder...]` |
| Drafts | Unpublished sections in the catalog | `perspective=published` or `!(_id in path("drafts.**"))` |
| Catalog committed | Hundreds of PNGs in a PR | `$OUT/` in `.gitignore` |

## Checklist

- [ ] Everything is under `$OUT`; `git status` shows no catalog files
- [ ] Every URL has as many crops as sections, or a noted reason
- [ ] Three random crops match their recorded headline
- [ ] The by-type lightbox opens for each type
- [ ] Never-used types show a tile or card, not a broken image
- [ ] File names follow `<site>_<urlslug>_<NN>_<type>.png`

Catalogs drift as editors work: re-run into a fresh `$OUT` before a design review. A new
embedding document type must be added to the Phase 2 query; a changed section wrapper
means a new probe.
