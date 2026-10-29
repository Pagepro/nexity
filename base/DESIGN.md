---
name: Nexity (neutral starter)
description: Neutral default design system — Tailwind `neutral` palette, Inter, square surfaces with rounded controls, Tailwind's default shadow scale. Replace it with your own.
colors:
  background: "oklch(1 0 0)" # white
  foreground: "oklch(0.145 0 0)" # neutral-950
  card: "oklch(1 0 0)" # white
  card-muted: "oklch(0.985 0 0)" # neutral-50
  primary: "oklch(0.205 0 0)" # neutral-900
  primary-foreground: "oklch(0.985 0 0)" # neutral-50
  secondary: "oklch(0.97 0 0)" # neutral-100
  muted: "oklch(0.97 0 0)" # neutral-100
  muted-foreground: "oklch(0.556 0 0)" # neutral-500
  accent: "oklch(0.97 0 0)" # neutral-100
  border: "oklch(0.922 0 0)" # neutral-200
  input: "oklch(0.922 0 0)" # neutral-200
  ring: "oklch(0.708 0 0)" # neutral-400
  destructive: "oklch(0.577 0.245 27.325)" # red-600
  button-ghost-hover: "oklch(0.97 0 0)" # neutral-100
  dark-background: "oklch(0.145 0 0)" # neutral-950
  dark-foreground: "oklch(0.985 0 0)" # neutral-50
  dark-card: "oklch(0.205 0 0)" # neutral-900
  dark-card-muted: "oklch(0.269 0 0)" # neutral-800
  dark-primary: "oklch(0.922 0 0)" # neutral-200
  dark-muted: "oklch(0.269 0 0)" # neutral-800
  dark-muted-foreground: "oklch(0.708 0 0)" # neutral-400
  dark-border: "oklch(1 0 0 / 10%)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem / 2.75rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem / 2.25rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem / 1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.2em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded: # md for controls; every other step 0 (square surfaces)
  sm: "0"
  md: "0.375rem"
  lg: "0"
  xl: "0"
  2xl: "0"
  full: "9999px"
spacing:
  section: "6rem"
  gutter: "1.25rem"
  gutter-desktop: "3.75rem"
  container: "80rem"
components:
  button:
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0 1rem"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  card:
    backgroundColor: "{colors.card}"
    border: "1px {colors.border}"
    rounded: "{rounded.lg}"
    shadow: "shadow-sm"
    padding: "1.5rem"
  card-muted:
    backgroundColor: "{colors.card-muted}"
    border: "1px {colors.border}"
    rounded: "{rounded.lg}"
---

# Design System: neutral starter

> **Put your design system here.** This file ships with neutral defaults so the
> starter looks like plain Tailwind. When the project has a design, change three places together: the token values in
> `web/src/styles/app.css` (`:root` and the `dark-palette` block; keep the token
> *names*), the font loader in `web/src/ui/fonts.ts`, and this file (frontmatter
> and every section below, keeping the headings).

This is the visual contract for every section, page or component in `web/`.
Read it before building anything a visitor sees. `create-section` and the
`styling-fidelity-reviewer` agent check against it. An approved design file wins
over it; it wins over mockups and screenshots. `BRAND.md` says what the site
says; this file says how it looks. The Tailwind mechanics (`.dark`, the `section`
utility, the `cn()` traps) are in `web/AGENTS.md` → Styling.

## Overview

**Creative North Star: "Plain Tailwind"** (replace with your own one-line idea).

The neutral starter is deliberately unbranded: a grey palette with no accent
colour, one sans family, square surfaces with rounded controls, Tailwind's default shadow scale. Pages read
top to bottom as bands of white and a light tinted panel, with an optional dark
band for a call to action. Nothing animates for attention.

**Key characteristics** (rewrite these five to six lines for your design):

- Monochrome `neutral` palette; `destructive` red is the only hue
- Inter everywhere, medium headings, regular body
- Cards are a 1px border, square corners and a small shadow
- Buttons are `rounded-md`, 14px medium, one primary per block
- Every section is a `section` container with `py-12 md:py-24`

## Colors

Semantic tokens on Tailwind's `neutral` palette, in OKLCH as Tailwind writes
them (values in the frontmatter). Use `bg-background`, `text-foreground`,
`text-muted-foreground`, `bg-card-muted`, `border-border`, `bg-primary` …, never a
raw `neutral-*` utility or a hex.

### Primary

- **Ink** (`foreground`, neutral-950): text, headings, icons that carry emphasis.
- **Primary** (`primary`, neutral-900): the solid button. There is no brand
  accent: links, focus rings and the primary button are neutral.

### Neutral

- **Paper** (`background`, `card`, white): page and card surface.
- **Tinted panel** (`card-muted`, neutral-50): the second surface: footer,
  tinted bands, callouts.
- **Muted** (`muted`, `secondary`, `accent`, neutral-100): chips, icon tiles,
  ghost-button hover (`button-ghost-hover`).
- **Muted text** (`muted-foreground`, neutral-500): body copy in `.richtext`,
  descriptions, labels.
- **Line** (`border`, `input`, neutral-200): every rule, frame and divider, 1px.
- **Error** (`destructive`, red-600): form errors only.
- **Dark band:** the `.dark` class swaps every token (neutral-950 background,
  neutral-50 text, `white/10` borders, light primary button).

### Named Rules

**The No-New-Colour Rule.** A colour enters `app.css` only when it exists in the
design system (a variable in the design file, or a rule in this file). Mockups,
product screenshots and review feedback are not token sources.

**The Raw-Token Rule.** Plain CSS reads `var(--foreground)`, never
`var(--color-foreground)`, so `.dark` scopes invert correctly.

## Typography

**Font:** Inter via `next/font/google` (`--font-inter` → `font-sans`), weights
300 to 700 from one variable file. **Mono:** the system monospace stack.

### Hierarchy

- **Display** (500, 36px → 44px at `md`): hero headline. `heading-1` /
  `section-heading-xl`.
- **Headline** (500, 30px → 36px): the section title, `section-heading-lg`.
- **Subheading** (500, 22px → 24px and 18px → 20px): `section-heading-md` / `-sm`.
- **Title** (500, 16px): card titles, FAQ questions, names.
- **Body** (400, 14px → 16px): `body-3`, the default for all copy. `body-1`
  (16px → 18px) is the lead paragraph under a hero headline.
- **Meta** (400, 12px → 14px): `body-4`, timestamps, footnotes.
- **Label** (500, 10px, uppercase, tracking 0.2em, 50% ink): the `pretitle`
  above section titles.

### Named Rules

**The CMS Scale Rule.** Text size in a section comes from the block style the
editor picks (`web/src/ui/RichText/block-styles.ts`), never from a wrapper class
that overrides RichText. New sizes are new `--text-NN` tokens, never arbitrary
values.

## Layout

**Container.** Every band is a `<section>` with `py-12 md:py-24` whose content
sits in the `section` container: 1280px (`--width-container`), centred, 20px
gutters on mobile and 60px on desktop. Header, footer and all sections share it.
Narrower text columns are an inner `max-w-*` div, never a narrower container.

**Section anatomy.** Optional `pretitle`, title, intro (`max-w-xl`), then the
content 2 to 3rem below.

**Rhythm.** Tailwind's 4px grid. Tight groups 0.5rem, related blocks 1.5 to 2rem,
sections 6rem.

**Breakpoints.** Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280)
plus `3xl` 1440px. Mobile first; every grid collapses to one column on a phone.

**Header.** Fixed and transparent over the first section; `<main>` pads the top
by `--header-height`, and a first-module hero cancels that padding to bleed
under the bar.

## Elevation & Depth

Tailwind's default shadow scale; there are no project shadow tokens.

- `shadow-sm`: cards at rest.
- `shadow-md`: hover on a card that is a link, overlay images.
- `shadow-lg`: popovers and the mobile menu.

**The Hover-Is-Shadow Rule.** A linked card responds to hover with a shadow
(`transition-shadow hover:shadow-md`) and nothing else: no lift, no scale.

## Shapes

Square surfaces, rounded controls. `--radius-md` (0.375rem) is the only rounded
step: buttons, inputs, tabs and nav items use `rounded-md`. Every other step is 0,
so cards, image frames, panels and the hero frame keep their `rounded-lg` (or
`-sm`, `-xl`, `-2xl`) class and render square. Badges and dots stay
`rounded-full`. Change corners in one place: the `--radius-*` scale in
`web/src/styles/app.css`. Dividers are 1px lines in `border`.

## Components

### Buttons

`ButtonBase` variants only: `primary`, `secondary`, `primary-outline`, `ghost`,
`link`, `arrow-link` …. `rounded-md`, 14px medium, 1px border, 16px icons. Sizes
through the `size` prop: `sm` 32px (header), `md` 36px (default), `lg` 44px. One
primary per block; the second action is `ghost`, an outline or an arrow link.
Inside a dark band use `primary-outline`, not `light-outline`.

### Cards

`rounded-lg border border-border bg-card shadow-sm` (or `bg-card-muted` for a
tinted panel), `p-6`. Reference: `FeatureGrid/feature-card.tsx`. A carousel of
cards pads its track (`p-0.5`) so the border isn't clipped.

### Section surfaces

A band's own grey surface is `bg-section-surface` / `bg-section-surface-muted`,
never a bare `bg-card-muted`, so the editor's Color theme can override it. The
editor's "Dark" theme wraps the section in `.dark`; never apply `.dark` to the
header, the footer or a single element.

### Icons

Lucide, from the shared `FEATURE_ICONS` list for icons an editor picks, so the
Studio and the site agree. Social icons from `react-icons` in the footer.

### Motion

Colour and shadow transitions only. Animating `translate`/`scale`/`rotate` needs
`transition-all` in Tailwind v4. Small micro-interactions are not gated behind a
JS reduced-motion check.

## Do's and Don'ts

### Do:

- **Do** start every section from the existing pattern: head + content in a
  `section` container, `py-12 md:py-24`, tokens only.
- **Do** use `card-muted` for any tinted panel and `bg-section-surface` for a
  band's own surface.
- **Do** keep one primary button per block.
- **Do** compare computed sizes with the design file before calling a section
  done.

### Don't:

- **Don't** add a colour, size, radius or shadow that is not a token (no
  `[23px]`).
- **Don't** override RichText sizes with wrapper classes; pick the block style.
- **Don't** lift, scale or translate cards on hover.
- **Don't** bake a border, a radius or a shadow into an image; the component
  draws them.
- **Don't** apply `.dark` to the header, the footer or a single element.
