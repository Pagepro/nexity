# Product mocks: the screenshots of "the app" on the marketing site

The hero, the split sections and the CTA show screens of the Meridian product.
They are not screenshots of a running app. They are HTML mocks rendered in the
browser and saved as PNG, so anyone can add a screen, change a number or re-export
all of them in one sitting. This guide covers where they live, the rules that keep
them consistent, and how to add one.

**Where.** `tools/product-mocks/` holds the generator. `pnpm mocks:build` writes
`tools/product-mocks/out/index.html` (git-ignored). Open that file in Chrome, find
the panel, click **Save PNG**. The `product-mock` skill (in the repository's `.agents/skills/`
folder) walks a coding agent through adding a screen.

```bash
pnpm mocks:build
open tools/product-mocks/out/index.html   # macOS; any browser works
```

The page needs no server and no network except the `html-to-image` library it loads
from jsDelivr for the export. Fonts and images are embedded.

---

## 1. Two design systems, one rule each

A product mock has two layers, and each layer follows a different source of truth.

| Layer | Source of truth | Tokens | File |
|---|---|---|---|
| The screen (what the product looks like) | The product dashboard design | Inter, Tailwind Stone, primary `#e58849`, emerald deltas, red "flagged" badge, mono numbers | `tools/product-mocks/product.py` |
| The panel around it (how the site presents it) | The split-section design and `web/src/styles/app.css` | Mona Sans, the dune photo with a `hard-light` tint in peach / sage / rose, dark annotation pins | `tools/product-mocks/mocks.py` |

Never mix them. A screen uses `--p-*` tokens only; a panel uses the marketing
tokens only. The `.app` scope pins the product tokens so the marketing palette, and
its `.dark` inversion, cannot leak into a screen.

## 2. What the PNG must and must not contain

- **In the file:** the tinted dune backdrop, the screen with its own 1px product
  border and soft shadow, the numbered pins. These are "part of the photo".
- **Not in the file:** the outer hairline and the rounded corners of the panel.
  The site draws those in code: the hero adds `rounded-lg border border-foreground/10`
  (`web/src/ui/sections/HeroSection/index.tsx`), split rows add the `card-frame`
  inset hairline with `--card-frame-gap: 0px` (`web/src/ui/sections/SplitSections/split-row.tsx`).
  A PNG with its own border shows a double edge on the site. **Save PNG** strips
  them automatically (the `.exporting` class); the gallery preview keeps them so it
  looks like the site.
- The tint ships inside the asset, not as CSS: a CSS blend over a decorative image
  depends on what sits behind it, so the same PNG would look different per section.

## 3. Sizes and variants

| Use on the site | Size | Panel | File name |
|---|---|---|---|
| Split section row (image 4:3) | 1360×1020 | 4:3, screen offset 2.5rem from one edge, flush with the other | `meridian-<screen>-right-1360x1020.png` / `-left-…` |
| Hero product image, CTA image | 2880×1605 | the full dashboard, 16:9-ish (the hero asset ratio) | `meridian-hero-composite-2880x1605.png`, `meridian-dashboard-2880x1605.png` |

Every 4:3 screen exports in **two alignments**. Split sections alternate the image
side per row (`imageLeft = index % 2 === 1`), and the screen should always be
flush with the edge nearest the page edge: **right** variant for rows with the
image on the right, **left** variant for rows with the image on the left. The
pins flip with it.

The tint cycles like the eyebrow dots in `SplitSections` (`ACCENT_MARKER_CLASSES`):
peach, sage, rose, then again. Pass `tint="sage"` / `tint="rose"` in `stage()`.

## 4. Adding a screen

1. **Model the content** in `tools/product-mocks/mocks.py` as a function
   `my_screen(pins=True, align="right")`. Build it from the existing atoms:
   `frame(title, badge, body, badge_kind)` for the app panel with its header,
   `metric(label, value, delta)` for a KPI with an emerald delta,
   `hbar(label, pct, value)` for a horizontal bar, `area(values)` for a trend,
   `tag(icon, label)` for a neutral chip, and the `.app` utility classes from
   `product.py` (`lbl`, `mono`, `sm`, `xs`, `muted`, `row`, `vstack`, `rule`…).
   Copy `winloss()` as the template. Keep the copy real: a product name, a
   plausible number, the wording the product itself would use.
2. **Pins.** Two per screen, numbered 1 and 2, each naming the capability the
   bullet list on the site mentions. Position them with `top/bottom` and
   `left/right` offsets inside the `.mock-wrap`; `stage()` mirrors them for the
   left variant. Keep right-side pins inside the panel (`right:.75rem`) so the
   flush edge does not clip them.
3. **Return** `stage(frame(...), pins, tint="…", align=align)`.
4. **Register** it: add the key to `DIVES` (so the page builder can place it) and a
   row to `GALLERY` (`(title, subtitle, function)`), which gives it the two Save
   PNG buttons.
5. **Icons.** Only names present in `icons.json` render. Add one with
   `node tools/product-mocks/extract-icons.mjs <lucide-name>` (it reads the
   `lucide-react` version the site uses, from `web/node_modules`).
6. `pnpm mocks:build`, open the gallery, check both variants at a normal window
   width, click **Save PNG** for each, upload to Sanity.

Changing the dashboard itself (metrics, deals, feed) happens in
`tools/product-mocks/dashboard.py`: the data lives in `METRICS`, `ASSETS`, `DEALS`,
`FEED` and the chart values in `TREND`. The in-app notification used by the hero is
`dashboard(toast=True)`.

## 5. Uploading to Sanity

- Split section row → the row's `image` field, 1360×1020 PNG.
- Hero (`product-hero` layout) → `productImage`, 2880×1605 PNG.
- CTA banner → `image`, 2880×1605 PNG (the component crops it to the right edge).
- Write the alt text as what the screen shows ("Call review for Acme Corp showing
  talk ratio, transcript and a flagged coaching moment"), not "screenshot".
- In local dev the page may keep the old image until `web/.next/dev/cache/fetch-cache`
  is deleted and the dev server restarted.

## 6. Checks before you upload

- No double edge: the PNG has square corners and no outer line.
- Proportions: the file is exactly 1360×1020 or 2880×1605. If the gallery reports
  "the panel is taller than…", the screen has too much content for 4:3; trim a row.
- The screen uses product colours only (orange, emerald, red badge), the panel
  uses the dune tint only. Nothing from the marketing palette inside the screen.
- Both variants exported for a 4:3 screen.
