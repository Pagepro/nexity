// Every theme adds `section-themed`, which switches off the section's own
// surface (`bg-section-surface` in app.css) so the editor's choice wins.
// Kept free of `@/` imports so the Node test runner can load it.
export const SECTION_THEME_CLASSES = {
  light: "section-themed bg-background",
  dark: "section-themed dark bg-background text-foreground",
} as const satisfies Record<string, string>;

export type SectionTheme = keyof typeof SECTION_THEME_CLASSES;

export const isSectionTheme = (value: unknown): value is SectionTheme =>
  typeof value === "string" && Object.hasOwn(SECTION_THEME_CLASSES, value);

// Unset or no-longer-listed values return undefined: the section keeps its own
// surface (NOT treated as Light).
export const getSectionThemeClassName = (colorTheme: unknown): string | undefined =>
  isSectionTheme(colorTheme) ? SECTION_THEME_CLASSES[colorTheme] : undefined;
