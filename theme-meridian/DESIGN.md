---
name: Meridian
description: Marketing site design system — shadcn Stone in OKLCH, Mona Sans SemiExpanded, hairline double frames, soft-tinted product imagery.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.147 0.004 49.25)"
  card: "oklch(1 0 0)"
  card-muted: "oklch(0.985 0.001 106.423)"
  primary: "oklch(0.216 0.006 56.043)"
  primary-foreground: "oklch(0.985 0.001 106.423)"
  secondary: "oklch(0.97 0.001 106.424)"
  muted: "oklch(0.97 0.001 106.424)"
  muted-foreground: "oklch(0.54 0.013 58.071)"
  accent: "oklch(0.97 0.001 106.424)"
  border: "oklch(0.923 0.003 48.717)"
  input: "oklch(0.923 0.003 48.717)"
  ring: "oklch(0.709 0.01 56.259)"
  destructive: "oklch(0.577 0.245 27.325)"
  button-ghost-hover: "oklch(0.957 0.0002 49.25)"
  accent-peach: "#ecd3c7"
  accent-sage: "#b9c9c6"
  accent-rose: "#daa2a2"
  dark-background: "oklch(0.147 0.004 49.25)"
  dark-foreground: "oklch(0.985 0.001 106.423)"
  dark-card: "oklch(0.216 0.006 56.043)"
  dark-card-muted: "oklch(0.248 0.006 56.043)"
  dark-primary: "oklch(0.923 0.003 48.717)"
  dark-muted: "oklch(0.268 0.007 34.298)"
  dark-muted-foreground: "oklch(0.709 0.01 56.259)"
  dark-border: "oklch(1 0 0 / 10%)"
typography:
  display:
    fontFamily: "Mona Sans SemiExpanded, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem / 2.75rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Mona Sans SemiExpanded, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem / 2.25rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Mona Sans SemiExpanded, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Mona Sans SemiExpanded, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem / 1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Mona Sans SemiExpanded, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.2em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: "0.125rem"
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "1rem"
  2xl: "1.375rem"
  3xl: "1.625rem"
  4xl: "1.875rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  section: "6rem"
  gutter: "1.25rem"
  gutter-desktop: "3.75rem"
  container: "80rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 1rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-primary-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0 1rem"
    height: "2.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0 1rem"
    height: "2.25rem"
  button-ghost-hover:
    backgroundColor: "{colors.button-ghost-hover}"
    textColor: "{colors.foreground}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  card-muted:
    backgroundColor: "{colors.card-muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  icon-tile:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    size: "2.5rem"
  chip:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.5rem"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  nav-pill:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0 0.625rem"
    height: "2rem"
  nav-pill-active:
    backgroundColor: "{colors.button-ghost-hover}"
    textColor: "{colors.foreground}"
---

# Design System: Meridian

This file is the visual contract for every new section, page or component in
`web/`. Read it before building anything a visitor sees. The tokens above are
normative and live in `web/src/styles/app.css`; the prose below says how to use
them. Where this file and Figma disagree, Figma wins and this file gets fixed.
Where this file and a mockup, a screenshot or a client HTML page disagree, this
file wins.

Companion rules that this file does not repeat: the Tailwind and token mechanics
in `web/AGENTS.md` (Styling, Section Layout, Section Color Inversion), the
RichText scale in `web/src/ui/RichText/block-styles.ts`, and the product imagery
pipeline in `docs/guides/product-mocks.md`.

## Overview

**Creative North Star: "The Quiet Instrument"**

Meridian sells revenue intelligence, and the site behaves like a well-made
instrument: almost no colour, a single slightly extended sans, hairline frames
instead of shadows, and numbers that are allowed to be the loudest thing on the
page. The personality comes from precision (tabular figures, tight tracking,
exact 1px lines) and from restraint (one dark pill per block, soft pastel
markers at six pixels). The product itself is the only colourful object: its
screens carry an orange accent and emerald deltas because that is what the app
looks like, and they sit on pastel dune backdrops like exhibits.

Density is editorial, not dashboard: a 1280px container, 96px between sections
on desktop, generous card padding, balanced headings. Pages read top to bottom
as alternating bands: white, a tinted card-muted band, white, occasionally a
dark band for a CTA. Nothing animates to get attention; hover states are a
nudge or a shadow, never a scale.

**Key characteristics:**

- Monochrome Stone palette; colour is a 6px dot, never a surface
- Mona Sans SemiExpanded everywhere, medium weight for headings, never bold display
- Hairline double frame on cards (outer line, 4px white gap, inner line)
- Pill buttons, 14px medium, dark on light
- Product screens are the imagery; photos are backdrops, not subjects
- Every section is a `section` container with `py-12 md:py-24`

## Colors

A warm-grey monochrome (shadcn "Stone" in OKLCH) with three pastel markers.
There is no brand accent colour on the marketing site.

### Primary

- **Ink** (`oklch(0.147 0.004 49.25)`, `foreground`): all text, the dark pill
  button, the arrow disc, chart lines, pins. The only colour that carries
  emphasis.
- **Pill** (`oklch(0.216 0.006 56.043)`, `primary`): the solid button and the
  selected chip. A step lighter than ink so a dark button on a dark `.dark`
  band still separates.

### Secondary (the markers)

- **Peach** (`#ecd3c7`), **Sage** (`#b9c9c6`), **Rose** (`#daa2a2`): the eyebrow
  dot in split rows and feature cards, cycling in that order by row index, and
  the hard-light tint on product backdrops. Six pixels square on the page, a
  whole panel inside an image. Never text, never a button, never a border.

### Neutral

- **Paper** (`oklch(1 0 0)`, `background`, `card`): page and card surface. Cards
  are white on white; the frame separates them.
- **Tinted panel** (`oklch(0.985 0.001 106.423)`, `card-muted`): footer, insight
  callouts, integration tiles, the featured column in comparison tables, stats
  band default surface. This is the only "second surface".
- **Muted** (`oklch(0.97 0.001 106.424)`, `muted`, `secondary`, `accent`): icon
  tiles, unselected chips, avatar fallback, the stage behind product images in
  the gallery.
- **Muted text** (`oklch(0.54 0.013 58.071)`, `muted-foreground`): body copy
  inside `.richtext`, descriptions, labels, inactive icons. Headings opt back to
  ink.
- **Line** (`oklch(0.923 0.003 48.717)`, `border`, `input`): every rule, frame
  and divider. 1px, always.
- **Ghost hover** (`oklch(0.957 0.0002 49.25)`, `button-ghost-hover`): the opaque
  wash behind hovered or active nav pills and ghost buttons. Opaque on purpose,
  so it renders identically over any backdrop.
- **Dark band**: the `.dark` class flips the whole token set (ink and paper swap,
  borders become `white/10`, the pill becomes light). Apply it to a wrapper, never
  to individual elements, and never to header or footer.

### Named Rules

**The No-New-Colour Rule.** A colour enters `app.css` only after it exists as a
variable in Figma. Mockups, product screenshots and review feedback are not
token sources. The orange that once leaked in from the product UI was removed
for this reason; do not bring it back.

**The Dot Rule.** Peach, sage and rose are markers, not paints. If you reach for
one as a background, tile or text colour, use `muted` or `card-muted` instead.

**The Raw-Token Rule.** Plain CSS reads `var(--foreground)`, never
`var(--color-foreground)`, so `.dark` scopes invert correctly. Utilities are
fine either way.

## Typography

**Display and body font:** Mona Sans SemiExpanded (local TTFs, weights 300 to
700, loaded through `next/font/local` as `--font-mona-sans`).
**Mono:** the system monospace stack, used only for numbers that must line up.

**Character:** one family at one width does all the work. Headings are medium,
never bold, with negative tracking; body is regular with loose leading. The
extended width gives the page its calm, technical feel, so nothing else needs to.

### Hierarchy

- **Display** (500, 36px → 44px at `md`, line-height 1.1, tracking -0.025em):
  hero headline only. `heading-1` / `section-heading-xl`.
- **Headline** (500, 30px → 36px, line-height 1.0, tracking -0.025em): the
  section title. `section-heading-lg` is the canonical size; the numbered
  `heading-2` (30px) is for in-content headings.
- **Subheading** (500, 22px → 24px and 18px → 20px, line-height 1.375):
  `section-heading-md` / `-sm`; card titles in a split row use 28px → 30px
  (`heading-3`).
- **Title** (500, 16px): card titles, FAQ questions, names. Ink, not muted.
- **Body** (400, 14px → 16px, line-height 1.5): `body-3`, the default for all
  copy. `body-1` (16 → 18px) is the lead paragraph under a hero headline.
  Measure 36rem (`max-w-xl`) under centred section titles, 48rem under the
  hero.
- **Meta** (400, 12px → 14px): `body-4`, timestamps, footnotes, chip text.
- **Label** (500, 10px, uppercase, tracking 0.2em, muted text): the `pretitle`
  above section titles and logo rows. The eyebrow variant (10px, tracking
  0.05em, muted) sits next to a marker dot.
- **Stat** (500, 30px → 36px, line-height 1.0, tracking -0.025em, tabular):
  numbers in the stats band and the calculator. The bento stat is 22px.

### Named Rules

**The Medium Rule.** Headings are `font-medium` (500). Bold (700) is reserved
for inline `strong` in body copy and the arrow-link label.

**The CMS Scale Rule.** Text size in a section comes from the block style the
editor picks (`body-3`, `section-heading-lg`, …), never from a wrapper class
that overrides RichText. New sizes are new `--text-NN` tokens, never arbitrary
values.

**The Balance Rule.** Centred headings and card titles get `text-balance`.
Section intros never exceed 36rem.

## Layout

**Container.** Every band is a `<section>` with `py-12 md:py-24` whose content
sits in the `section` container: 1280px wide (`--width-container`), centred, with
20px side gutters on mobile and 60px from 1024px. Header, footer and all sections
share it, so every edge on the page lines up. Narrower text columns are an inner
`max-w-*` div inside the container, never a narrower container.

**Section anatomy.** A centred head (pretitle, title, optional intro, optional
CTA pair) in a `max-w-xl` column with 1rem gaps, then the content block 2rem below
on mobile and 3rem on desktop. Full-width rows inside (split rows, FAQ items)
are separated by 3rem on mobile and 6rem on desktop.

**Grids.** Bento and feature grids are 1 → 2 → 4 columns (`sm`, `lg`) with 1rem
gaps; wide bento cards span two columns. Split rows are a 5-column grid at `md`
(2 columns of copy, 3 of image, 5rem gap) that alternates image side by row
index. Stats are a 2 → 4 column band separated by 1px of `border` colour
(`gap-px bg-border`). The footer is a 5-column grid at `lg` and accordions below.

**Rhythm.** The spacing scale is Tailwind's 4px grid; the steps in use are 0.25,
0.5, 0.75, 1, 1.5, 2, 3, 6rem. Tight groups use 0.375 to 0.5rem, related blocks
1.5 to 2rem, sections 6rem. A heading has more space above it than below.

**Breakpoints.** `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `3xl` 1440px (the hero
becomes a contained rounded card at `3xl`). Design mobile first; every grid
collapses to one column at phone width and nothing has a `min-width` wider than
the screen, with one exception: the hero product screenshot keeps a 40rem
minimum and bleeds right on phones.

**Header.** Fixed, transparent over the first section, solid white with a bottom
`border` once scrolled 4px. `<main>` pads the top by `--header-height` (4.125rem
fallback, measured live); a first-module hero cancels that padding to bleed under
the bar.

## Elevation & Depth

Flat by default. Depth is drawn with lines and tonal steps, not shadows: a card
is white on white and reads as an object because of its hairline frame; a band
is `card-muted` and reads as recessed because it is 1.5% darker than paper.

### Shadow Vocabulary

- **Frame** (`box-shadow: 0 0 0 1px var(--border)`, `shadow-card`): the outer
  line of every framed card. Not a shadow visually, a stroke drawn as one so it
  survives `overflow-hidden`.
- **Inner hairline** (`inset 0 0 0 1px rgba(0,0,0,.1)` via `.card-frame::after`):
  the second line of the double frame, painted on top of content so full-bleed
  images cannot cover it. With `--card-frame-gap: 0px` it becomes the single
  hairline on image frames.
- **Lift** (`shadow-xl`, `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)`):
  hover on linked cards only (bento, feature, blog, case study). No translate.
- **Header** (`shadow-header`): the open mobile menu panel.

### Named Rules

**The Flat-At-Rest Rule.** No card, tile or button carries a shadow at rest.
Shadow is a response to hover on something clickable, and it is the only
response: no lift, no scale.

**The Line Over Shadow Rule.** When two surfaces need separating, use a 1px
`border` line or a `card-muted` step before reaching for a shadow.

## Shapes

Corners are soft, not round. The working radius is `lg` (10px) for cards, image
frames and callouts; `md` (8px) for icon tiles, chips and inputs; `xl` (16px)
for the CTA banner and avatars; `4xl` (30px) for the hero card at `3xl`.
Buttons, nav pills, badges, pins and discs are fully rounded.

**The double frame** is the signature shape: `card-frame` + `border-4
border-background` + `shadow-card` draws outer line, 4px white gap, inner line.
Every framed card on the site uses it (feature, bento, integration tile, CTA
banner). The inner radius is the outer radius minus the gap, which the class
computes from `--card-frame-radius` and `--card-frame-gap`. An image frame uses
`--card-frame-gap: 0px` (one hairline, no gap). Reproduce it with the classes,
never with a hand-made border stack.

Markers are squares, not circles: the eyebrow dot is `size-1.5` with no radius.
Dividers are 1px lines in `border`; stats bands are built from 1px gaps on a
`border`-coloured background rather than borders on cells.

## Components

### Buttons

Pill-shaped (`rounded-full`), 14px medium, 1px border, 8px gap, icons 16px.
Three heights: `sm` 32px with 12px sides (header), `md` 36px with 16px sides
(sections, the default), `lg` 44px with 24px sides. Colour transition 250ms.

- **Primary:** ink pill (`primary`), paper text, hover 90% opacity. One per block.
- **Primary outline:** transparent, 20% ink border, ink text; hover fills with
  ink and inverts the text. Use this, not light-outline, inside `.dark` bands.
- **Secondary outline:** `border` line, hover `muted` fill.
- **Ghost:** no border, ink text, hover `button-ghost-hover` wash. Header actions
  and the second CTA next to a primary.
- **Link / Arrow link:** text only. The arrow link is a 14px bold label plus a
  24px ink disc with a 14px paper arrow; hover fades to 70% and nudges the disc
  2px right. It is the standard "Explore …" link under split rows.
- **Header CTA:** glassy white-40% pill while over the hero, solid `primary`
  once scrolled or when the mobile menu opens.
- **Hero CTA icon:** the trailing arrow in a hero button is 10px at 60%
  opacity, not the 16px section icon.

### Chips / Tabs

Category tabs and filter pills: 12px medium, `rounded-md`, 4px by 8px padding,
`secondary` fill with ink text; selected is `primary` fill with paper text;
hover drops the fill to 70%. Badges (e.g. "+43%" next to a split-row eyebrow):
`rounded-full`, 1px `border`, 12px medium, trending icon 14px.

### Cards

- **Framed card** (bento, feature): double frame, `rounded-lg`, white, 24px
  padding, `min-h-48` for bento. Icon tile top-left (40px, `rounded-md`, `muted`
  fill, 20px ink lucide icon), arrow 16px muted top-right that nudges 2px and
  turns ink on hover. Body is pushed to the bottom (`mt-auto`, `pt-8`): optional
  stat (10px uppercase label + 22px value), 16px medium title, 14 → 16px muted
  description. Linked cards get the lift shadow on hover.
- **Compact card:** same frame, 20px padding, icon tile beside the text.
- **Insight callout:** `card-muted` panel, 1px `border`, `rounded-lg`, 16px
  padding, a 10px uppercase label with an inline 14px sparkles icon, 14px ink
  text. The glyph is inline, never in a tile.
- **Integration tile:** double frame on `card-muted`, 16px padding, a 40px logo
  box (`rounded-md`, 1px `border`, white) with the logo padded 8px or two
  initials, 14px medium name, 12px muted category.
- **CTA banner:** double frame, `rounded-xl`, min height 27.5rem, two columns at
  `lg`, copy padded 32px (64px at `lg`), product image glued to the right and
  bottom edges with a rounded top-left corner, 10% black gradient along the
  bottom third. Background photo optional; a `.dark` wrapper is the alternative.

### Inputs

Search is an underline field: 48px tall, 1px `input` bottom border, 16px ink
text, muted placeholder, a 16px muted search icon on the right, no focus ring
beyond the browser default. Range sliders are hairlines: a 1px track in `border`
with the filled part in ink and an 18px white thumb carrying the card hairline.

### Navigation

Nav items are ghost pills (32px, 10px sides, 14px medium); the active item and
hover share the `button-ghost-hover` wash. Right side: Search pill, a 24px
vertical `border` rule, Login ghost, the primary CTA. Mobile: a 32px circular
outlined toggle opens a drawer that animates `grid-template-rows` from 0 to 1fr
with the links as a bordered list and full-width CTAs.

### Section head

Pretitle (10px uppercase, tracking 0.2em), `section-heading-lg` title, optional
`body-3` intro, centred, 1rem gaps, `max-w-xl`. Left-aligned heads exist only in
split rows and the footer subscribe band.

### Split row

Eyebrow (6px marker + 10px uppercase muted label), optional badge, `heading-3`
title, body copy, a check list (16px ink lucide checks, 12px gaps), optional
insight callout, an arrow link. Image column is a 4:3 frame with the single
hairline; the image already contains its tinted backdrop and callouts.

### Stats band

2 → 4 cells on a 1px `border` lattice, each `p-6`, label above value in the DOM
but value drawn first (`flex-col-reverse`): 14px muted label, 30 → 36px medium
tabular value. No markers on the top rule.

### Quote

Centred figure, `max-w-2xl`: optional 32px mark, 20px medium quote with 36px
leading, then a 56px `rounded-xl` avatar (or initials on `muted`), 16px medium
name, 16px muted role.

### Product imagery

Product screens are HTML mocks rendered on the **product** tokens (Inter, Stone,
orange `#e58849`, emerald deltas), placed on a dune photograph tinted peach, sage
or rose with `hard-light`, with dark pins for callouts. The PNG carries the tint
and the pins; the component draws the frame. Sizes: 1360×1020 for split rows,
2880×1605 for hero and CTA. Generator and rules: `docs/guides/product-mocks.md`.

### Icons

Lucide only, stroke 2, at 16px inline, 20px in tiles, 12 to 14px inside labels
and chips. Ink in tiles and lists, muted as decoration (trust badges, arrows at
rest). Feature icons come from the shared `FEATURE_ICONS` list so the Studio and
the site agree. No emoji, no brand icon fonts; social icons from `react-icons/fa6`
in the footer only.

### Motion

Default transition 250ms. Hover: shadow on linked cards, 2px arrow nudge, colour
on buttons and nav. Opening panels (mobile menu, footer accordions) animate
`grid-template-rows`. Animating `translate`/`scale`/`rotate` needs `transition-all`
in Tailwind v4. Reduce-motion is handled in CSS (`motion-reduce:`), and only for
large effects; small nudges stay.

## Do's and Don'ts

### Do:

- **Do** start every section from the pattern that already exists: head +
  content in a `section` container, `py-12 md:py-24`, tokens only.
- **Do** frame cards with `card-frame border-4 border-background shadow-card`
  and images with `card-frame [--card-frame-gap:0px]`.
- **Do** put the icon in a 40px `muted` tile at the top of a card, and inline
  next to the label inside a callout or badge.
- **Do** use `card-muted` for any tinted panel and `bg-section-surface` /
  `bg-section-surface-muted` for a band's own surface so the editor's Color
  theme can override it.
- **Do** cycle peach, sage, rose for markers by index, and keep them at 6px.
- **Do** give numbers `tabular-nums` and tight tracking.
- **Do** measure computed values against Figma before calling a section done.
- **Do** keep one primary pill per block; the second action is ghost, outline
  or an arrow link.

### Don't:

- **Don't** add a colour, size, radius or shadow that is not already a token in
  `app.css` and a variable in Figma. No arbitrary values (`[23px]`).
- **Don't** use Inter, Geist, a mono display face, or bold headings. Mono is for
  aligned numbers only.
- **Don't** paint peach, sage or rose onto a tile, badge, background or text.
- **Don't** lift, scale or translate a card on hover. Shadow only, and only when
  it links somewhere.
- **Don't** bake a border, a radius or a drop shadow into a product image; the
  component draws them and you get a double edge.
- **Don't** put a `min-h` on a card to glue an image to its edge; put it on the
  inner grid.
- **Don't** apply `.dark` to the header, the footer or a single element; it is
  a band-level wrapper.
- **Don't** add eyebrow numbers (01 / 02), gradient text, glass panels or a
  coloured left border on callouts. The system has no such devices.
- **Don't** override RichText sizes with wrapper classes; pick the block style.
