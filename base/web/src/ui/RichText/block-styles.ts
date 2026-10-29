// Raw strings, not cn(): tailwind-merge would drop the `text-NN` size next to `text-foreground`.
// Section titles use SECTION_HEADING_STYLES (section-heading-lg), not heading-2.
export const HEADING_STYLES = {
  "heading-1":
    "text-36 md:text-44 font-medium leading-tighter tracking-tight text-foreground",
  "heading-2": "text-30 font-medium leading-tight tracking-tight text-foreground",
  "heading-3":
    "text-28 md:text-30 font-medium leading-tight tracking-tight text-foreground",
  "heading-4": "text-22 md:text-24 font-medium leading-snug text-foreground",
  "heading-5": "text-18 md:text-20 font-medium leading-snug text-foreground",
  "heading-6": "text-16 md:text-18 font-medium leading-snug text-foreground",
} as const;

export const SECTION_HEADING_STYLES = {
  "section-heading-xl":
    "text-36 md:text-44 font-medium leading-tighter tracking-tight text-foreground",
  "section-heading-lg":
    "text-30 md:text-36 font-medium leading-tight tracking-tight text-foreground",
  "section-heading-md": "text-22 md:text-24 font-medium leading-snug text-foreground",
  "section-heading-sm": "text-18 md:text-20 font-medium leading-snug text-foreground",
} as const;

export const BODY_STYLES = {
  "body-1": "text-16 md:text-18 leading-relaxed",
  "body-2": "text-16 leading-relaxed",
  "body-3": "text-14 md:text-16 leading-relaxed",
  "body-4": "text-12 md:text-14 leading-normal",
  "body-5": "text-12 leading-normal",
} as const;
