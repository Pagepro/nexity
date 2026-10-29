// Presentation only (grouping, order, labels), never values. A token missing here
// still renders in its category's "Ungrouped" bucket.

export interface TokenMeta {
  group: string;
  order: number;
  usage: string;
  designMdAlias?: string;
}

export const COLOR_GROUPS: { id: string; label: string }[] = [
  { id: "surface", label: "Surface" },
  { id: "text", label: "Text" },
  { id: "brand", label: "Brand" },
  { id: "semantic", label: "Semantic" },
  { id: "accent", label: "Accent" },
  { id: "chart", label: "Chart" },
  { id: "sidebar", label: "Sidebar" },
];

export const COLOR_META: Record<string, TokenMeta> = {
  background: {
    group: "surface",
    order: 0,
    usage: "Page canvas / default surface.",
    designMdAlias: "surface",
  },
  card: {
    group: "surface",
    order: 1,
    usage: "Card surface (pure white = background).",
    designMdAlias: "surface",
  },
  "card-muted": {
    group: "surface",
    order: 1.5,
    usage: "Tinted card/panel surface (#fafaf9) — testimonials, footer.",
  },
  popover: { group: "surface", order: 2, usage: "Popover / dropdown surface." },
  muted: {
    group: "surface",
    order: 3,
    usage: "Tinted panels, subtle fills.",
    designMdAlias: "neutral",
  },
  border: { group: "surface", order: 4, usage: "Hairlines, dividers." },
  input: { group: "surface", order: 5, usage: "Input borders." },
  ring: { group: "surface", order: 6, usage: "Focus ring." },

  foreground: {
    group: "text",
    order: 0,
    usage: "Headlines & body copy.",
    designMdAlias: "on-surface",
  },
  "muted-foreground": { group: "text", order: 1, usage: "Secondary & meta text." },
  "card-foreground": { group: "text", order: 2, usage: "Text on cards." },
  "popover-foreground": { group: "text", order: 3, usage: "Text in popovers." },

  primary: {
    group: "brand",
    order: 0,
    usage: "Primary CTA fill.",
    designMdAlias: "primary",
  },
  "primary-foreground": { group: "brand", order: 1, usage: "Text on primary." },
  secondary: {
    group: "brand",
    order: 2,
    usage: "Secondary button fill.",
    designMdAlias: "secondary",
  },
  "secondary-foreground": { group: "brand", order: 3, usage: "Text on secondary." },
  accent: { group: "brand", order: 4, usage: "Accent fill (= muted)." },
  "accent-foreground": { group: "brand", order: 5, usage: "Text on accent." },

  destructive: {
    group: "semantic",
    order: 0,
    usage: "Errors / destructive actions.",
    designMdAlias: "error",
  },
  "destructive-foreground": {
    group: "semantic",
    order: 1,
    usage: "Text on destructive.",
  },

  "color-accent-peach": {
    group: "accent",
    order: 0,
    usage: "Decorative eyebrow marker.",
  },
  "color-accent-sage": { group: "accent", order: 1, usage: "Decorative eyebrow marker." },
  "color-accent-rose": { group: "accent", order: 2, usage: "Decorative eyebrow marker." },
};

export const TEXT_SIZE_PREFIX = "text-";
export const RADIUS_PREFIX = "radius-";
export const SHADOW_PREFIX = "shadow-";
export const INDEX_PREFIX = "index-";
export const LINE_HEIGHT_PREFIX = "line-height-";
export const LETTER_SPACING_PREFIX = "letter-spacing-";

export const LAYOUT_META: Record<string, string> = {
  "width-container": "Page container max-width (Figma max-w-7xl).",
  "section-padding-inline": "Side gutter, mobile.",
  "section-padding-inline-desktop": "Side gutter, desktop (≥1024px).",
  "section-padding-y": "Vertical section rhythm.",
  "header-height": "Fixed header height (used for content offset).",
  "hero-height": "Hero band height (base).",
  "hero-height-sm": "Hero band height (sm).",
  "hero-height-md": "Hero band height (md).",
  "hero-height-lg": "Hero band height (lg).",
  "tile-grid-row-height": "Tile grid row height (base).",
  "tile-grid-row-height-sm": "Tile grid row height (sm).",
  "tile-grid-row-height-md": "Tile grid row height (md).",
  "tile-grid-row-height-lg": "Tile grid row height (lg).",
  "cta-banner-min-height": "CTA banner min height.",
  "logo-bar-max-w": "Logo cell max width (base).",
  "logo-bar-max-w-sm": "Logo cell max width (sm).",
  "logo-bar-max-w-md": "Logo cell max width (md).",
  "default-transition-duration": "Default motion duration.",
};

export const SHADOW_META: { name: string; usage: string }[] = [
  { name: "shadow-header", usage: "Header bar drop shadow." },
  { name: "shadow-xl", usage: "Figma double drop-shadow (cards, popovers)." },
  {
    name: "shadow-card",
    usage: "Double 1px-stroke card frame (pair with border-4 border-background).",
  },
];

export const TEXT_LADDER_PATTERN = /^text-\d+$/;
export const RADIUS_PATTERN = /^radius-.+/;
export const INDEX_PATTERN = /^index-\d+$/;

export const BREAKPOINTS: { name: string; min: string; note: string }[] = [
  { name: "base", min: "0", note: "Mobile-first defaults; 20px side gutters." },
  { name: "sm", min: "640px", note: "Large phones / small tablets." },
  {
    name: "md",
    min: "768px",
    note: "Tablets; type scale steps up (e.g. body-3 → 16px).",
  },
  { name: "lg", min: "1024px", note: "Desktop; side gutters widen to 60px." },
  { name: "xl", min: "1280px", note: "Container max-width reached (1280px)." },
];
